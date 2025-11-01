import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function POST(req: NextRequest) {
  try {
    const { originalPostUrn, commentary, visibility } = await req.json();

    if (!originalPostUrn) {
      return NextResponse.json(
        { error: "Original post URN is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get LinkedIn profile and access token
    const { data: profile, error: profileError } = await supabase
      .from("linkedin_profiles" as any)
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("LinkedIn profile error:", profileError);
      return NextResponse.json(
        { error: "LinkedIn profile not found" },
        { status: 404 }
      );
    }

    const profileData = profile as any;
    
    if (!profileData.access_token) {
      return NextResponse.json(
        { error: "LinkedIn access token not found" },
        { status: 401 }
      );
    }

    // Prepare repost payload according to LinkedIn's official documentation
    const repostPayload = {
      author: profileData.person_urn,
      visibility: visibility === "CONNECTIONS" ? "CONNECTIONS" : "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
      reshareContext: {
        parent: originalPostUrn
      },
      commentary: commentary && commentary.trim() ? commentary.trim() : ""
    };

    console.log("Creating LinkedIn repost with payload:", JSON.stringify(repostPayload, null, 2));

    // Make request to LinkedIn REST API (NEW API for reposts)
    const linkedinResponse = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profileData.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202501'
      },
      body: JSON.stringify(repostPayload)
    });

    const responseText = await linkedinResponse.text();
    console.log("LinkedIn repost API response:", {
      status: linkedinResponse.status,
      statusText: linkedinResponse.statusText,
      headers: Object.fromEntries(linkedinResponse.headers.entries()),
      body: responseText
    });

    if (!linkedinResponse.ok) {
      let errorMessage = 'LinkedIn API error';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error_description || errorMessage;
      } catch {
        errorMessage = `${linkedinResponse.status} ${linkedinResponse.statusText}`;
      }
      
      return NextResponse.json(
        { error: `Failed to repost on LinkedIn: ${errorMessage}` },
        { status: linkedinResponse.status }
      );
    }

    // LinkedIn returns the new post ID in the response header
    const newPostId = linkedinResponse.headers.get("x-restli-id");
    
    console.log("LinkedIn repost successful:", {
      originalPost: originalPostUrn,
      newPostId: newPostId,
      commentary: commentary || "(no commentary)"
    });

    // Save the repost to our database
    try {
      // Get the original post details to create the repost text
      const { data: originalPost, error: originalPostError } = await supabase
        .from("linkedin_posts" as any)
        .select("text")
        .eq("ugc_post_id", originalPostUrn)
        .eq("user_id", user.id)
        .single();

      if (originalPostError) {
        console.error("Could not find original post in database:", originalPostError);
      }

      // Create repost text - either just commentary or commentary + reference to original
      let repostText = "";
      if (commentary && commentary.trim()) {
        repostText = commentary.trim();
        if (originalPost && (originalPost as any).text) {
          repostText += `\n\n--- Genopslag af: "${(originalPost as any).text.slice(0, 100)}${(originalPost as any).text.length > 100 ? '...' : ''}" ---`;
        }
      } else {
        // No commentary, just indicate it's a repost
        if (originalPost && (originalPost as any).text) {
          repostText = `Genopslag: "${(originalPost as any).text.slice(0, 200)}${(originalPost as any).text.length > 200 ? '...' : ''}"`;
        } else {
          repostText = "Genopslag af tidligere opslag";
        }
      }

      // Insert the repost as a new post in our database
      const { data: newPost, error: insertError } = await supabase
        .from("linkedin_posts" as any)
        .insert({
          user_id: user.id,
          linkedin_profile_id: profileData.id,
          text: repostText,
          visibility: visibility,
          status: 'published',
          ugc_post_id: newPostId || null,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          is_repost: true,
          original_post_urn: originalPostUrn
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error saving repost to database:", insertError);
        console.error("Insert data was:", {
          user_id: user.id,
          text: repostText,
          visibility: visibility,
          status: 'published',
          ugc_post_id: newPostId || null,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          is_repost: true,
          original_post_urn: originalPostUrn
        });
        // Don't fail the API call, just log the error since LinkedIn post was successful
      } else {
        console.log("Repost saved to database successfully:", newPost);
      }

    } catch (dbError) {
      console.error("Database error when saving repost:", dbError);
      // Don't fail the API call since LinkedIn post was successful
    }

    return NextResponse.json({
      success: true,
      message: "Post successfully reposted on LinkedIn",
      newPostId: newPostId,
      originalPostUrn: originalPostUrn
    });

  } catch (error) {
    console.error("Error in repost API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

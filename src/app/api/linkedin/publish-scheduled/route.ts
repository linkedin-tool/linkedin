import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RESTLI = { "X-Restli-Protocol-Version": "2.0.0" };

async function getLinkedInProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data, error } = await supabase
    .from("linkedin_profiles" as any)
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("LinkedIn-profil ikke fundet");
  return data;
}

async function ensureAccessToken(profile: any) {
  // Simplificeret: tjek udløb og (evt.) refresh ved <14 dage tilbage
  const ttl = new Date(profile.access_token_expires_at).getTime() - Date.now();
  if (ttl > 14 * 864e5) return profile.access_token;
  // TODO: implementer rigtigt refresh-flow hvis du har refresh_token
  return profile.access_token; // fallback: brug eksisterende
}

async function createUgcPost({ accessToken, personUrn, text, imageAssetUrns, visibility }: {
  accessToken: string; personUrn: string; text: string; imageAssetUrns?: string[]; visibility: string;
}) {
  let mediaBlock;
  
  if (imageAssetUrns && imageAssetUrns.length > 0) {
    if (imageAssetUrns.length === 1) {
      // Enkelt billede - brug den gamle struktur
      mediaBlock = {
        shareMediaCategory: "IMAGE",
        media: [{
          status: "READY",
          description: { text: text.slice(0, 200) },
          media: imageAssetUrns[0],
          title: { text: "Image" }
        }]
      };
    } else {
      // Flere billeder - brug multiImage struktur
      mediaBlock = {
        shareMediaCategory: "IMAGE",
        media: imageAssetUrns.map((urn, index) => ({
          status: "READY",
          description: { text: text.slice(0, 200) },
          media: urn,
          title: { text: `Image ${index + 1}` }
        }))
      };
    }
  } else {
    mediaBlock = { shareMediaCategory: "NONE" };
  }

  const payload = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        ...mediaBlock
      }
    },
    visibility: { 
      "com.linkedin.ugc.MemberNetworkVisibility": visibility === "CONNECTIONS" ? "CONNECTIONS" : "PUBLIC" 
    }
  };

  console.log("Publishing scheduled LinkedIn post with payload:", JSON.stringify(payload, null, 2));
  
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...RESTLI
    },
    body: JSON.stringify(payload)
  });

  const responseText = await res.text();
  console.log("LinkedIn API Response for scheduled post:", {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
    body: responseText
  });

  if (!res.ok) {
    throw new Error(`ugcPosts failed: ${res.status} ${res.statusText} - ${responseText}`);
  }
  
  // ID returneres i respons-headeren:
  const ugcPostId = res.headers.get("x-restli-id") || null;
  console.log("Successfully published scheduled LinkedIn post with ID:", ugcPostId);
  return ugcPostId;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Hent det planlagte opslag fra databasen med billeder
    const { data: post, error: fetchError } = await supabase
      .from("linkedin_posts" as any)
      .select(`
        *,
        images:linkedin_post_images(*)
      `)
      .eq("id", postId)
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Scheduled post not found" }, { status: 404 });
    }

    // Hent LinkedIn profil
    const profile = await getLinkedInProfile(supabase, user.id) as any;
    const accessToken = await ensureAccessToken(profile);
    const personUrn = profile.person_urn as string;

    // Saml alle LinkedIn image URNs fra både gamle og nye felter
    const imageAssetUrns: string[] = [];
    
    // Først tilføj billeder fra den nye images tabel
    const postWithImages = post as any;
    if (postWithImages.images && postWithImages.images.length > 0) {
      postWithImages.images.forEach((image: any) => {
        if (image.linkedin_image_urn && image.image_upload_status === 'uploaded') {
          imageAssetUrns.push(image.linkedin_image_urn);
        }
      });
    }
    
    // Alle billeder håndteres nu via den nye images tabel
    
    console.log("Publishing scheduled post:", {
      postId: postWithImages.id,
      imageCount: imageAssetUrns.length,
      imageAssetUrns: imageAssetUrns
    });

    // Publiser opslaget til LinkedIn med de allerede uploadede billeder
    const ugcPostId = await createUgcPost({ 
      accessToken, 
      personUrn, 
      text: postWithImages.text, 
      imageAssetUrns, 
      visibility: postWithImages.visibility 
    });

    // Opdater opslaget i databasen
    const { data: updatedPost, error: updateError } = await supabase
      .from("linkedin_posts" as any)
      .update({
        ugc_post_id: ugcPostId,
        status: "published",
        published_at: new Date().toISOString()
      })
      .eq("id", postId)
      .eq("user_id", user.id)
      .select("id, ugc_post_id, status, published_at")
      .single();

    if (updateError) throw updateError;

    const updatedPostData = updatedPost as any;
    return NextResponse.json({ 
      success: true,
      postId: updatedPostData.id,
      ugcPostId: updatedPostData.ugc_post_id,
      status: updatedPostData.status,
      publishedAt: updatedPostData.published_at,
      message: "Scheduled post published successfully using pre-uploaded image"
    });

  } catch (e: unknown) {
    console.error("Error publishing scheduled post:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Noget gik galt. Prøv igen.',
      details: "Failed to publish scheduled post"
    }, { status: 400 });
  }
}

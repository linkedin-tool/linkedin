import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";

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
  const ttl = new Date(profile.access_token_expires_at).getTime() - Date.now();
  if (ttl > 14 * 864e5) return profile.access_token;
  return profile.access_token; // fallback: brug eksisterende
}

async function registerImageUpload(accessToken: string, personUrn: string) {
  const res = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...RESTLI,
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: personUrn,
        serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }]
      }
    })
  });
  if (!res.ok) throw new Error(`registerUpload failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const uploadUrl = json.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
  const asset = json.value.asset;
  return { uploadUrl, asset };
}

async function uploadBinary(uploadUrl: string, file: File, accessToken: string) {
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: Buffer.from(await file.arrayBuffer())
  });
  if (!res.ok) throw new Error(`binary upload failed: ${res.status} ${await res.text()}`);
}

async function uploadImageToLinkedIn(accessToken: string, personUrn: string, image: File) {
  try {
    console.log("Starting LinkedIn image upload for edit mode...");
    
    const { uploadUrl, asset } = await registerImageUpload(accessToken, personUrn);
    console.log("LinkedIn upload registered:", { asset });
    
    await uploadBinary(uploadUrl, image, accessToken);
    console.log("LinkedIn binary upload completed");
    
    return {
      linkedinImageUrn: asset,
      uploadStatus: 'uploaded' as const,
      error: null
    };
  } catch (error) {
    console.error("LinkedIn image upload failed:", error);
    return {
      linkedinImageUrn: null,
      uploadStatus: 'failed' as const,
      error: error instanceof Error ? error.message : 'Billede upload fejlede'
    };
  }
}

async function optimizeAndUploadToSupabase(file: File, supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { error } = await supabase.storage
      .from('linkedin-images')
      .upload(fileName, optimizedBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('linkedin-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error optimizing and uploading image:', error);
    throw new Error(`Image upload failed: ${error}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const form = await req.formData();
    const postId = String(form.get("postId") || "");
    const text = String(form.get("text") || "");
    const visibility = String(form.get("visibility") || "PUBLIC");
    const scheduledForLocal = form.get("scheduledFor") as string | null;
    const newStatus = form.get("newStatus") as string | null;
    // Håndter flere billeder
    const images: File[] = [];
    const keepImageUrls: string[] = [];
    
    for (const [key, value] of form.entries()) {
      if (key.startsWith("image") && value instanceof File && value.size > 0) {
        images.push(value);
      } else if (key.startsWith("keepImageUrl") && typeof value === "string") {
        keepImageUrls.push(value);
      }
    }
    
    if (!postId || !text) {
      return NextResponse.json({ error: "Post ID and text are required" }, { status: 400 });
    }

    // Konverter lokal tid til UTC for database storage
    let scheduledForUTC: string | null = null;
    if (scheduledForLocal) {
      // scheduledForLocal er i format "YYYY-MM-DDTHH:MM:SS" (dansk tid)
      // Parse dato komponenter og konstruer Date objekt eksplicit som lokal tid
      const [datePart, timePart] = scheduledForLocal.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second = 0] = timePart.split(':').map(Number);
      
      // Konstruer Date objekt eksplicit som lokal tid (ikke UTC)
      const localDate = new Date(year, month - 1, day, hour, minute, second);
      
      // Konverter til UTC for database storage
      scheduledForUTC = localDate.toISOString();
    }

    // Hent det eksisterende opslag for at sikre det tilhører brugeren
    const { data: existingPost, error: fetchError } = await supabase
      .from("linkedin_posts" as any)
      .select("*")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Kun tillad redigering af planlagte opslag (ikke udgivne)
    const postData = existingPost as any;
    if (postData.status === 'published') {
      return NextResponse.json({ error: "Cannot edit published posts" }, { status: 400 });
    }

    // Opdater opslaget i databasen
    const updateData: any = {
      text,
      visibility,
      updated_at: new Date().toISOString()
    };

    // Opdater scheduled_for hvis det er angivet
    if (scheduledForUTC) {
      updateData.scheduled_for = scheduledForUTC;
    }

    // Opdater status hvis newStatus er angivet
    if (newStatus) {
      const validStatuses = ['draft', 'scheduled', 'published', 'failed'];
      if (!validStatuses.includes(newStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = newStatus;
    }

    // Håndter billede ændringer - slet billeder der ikke skal beholdes
    if (keepImageUrls.length === 0) {
      // Ingen billeder skal beholdes - slet alle
      const { error: deleteImagesError } = await supabase
        .from("linkedin_post_images" as any)
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      
      if (deleteImagesError) {
        console.error("Failed to delete all existing images:", deleteImagesError);
      } else {
        console.log("All existing images removed from post");
      }
    } else {
      // Først hent alle eksisterende billeder for dette opslag
      const { data: existingImages, error: fetchError } = await supabase
        .from("linkedin_post_images" as any)
        .select("id, image_url")
        .eq("post_id", postId)
        .eq("user_id", user.id);
      
      if (fetchError) {
        console.error("Failed to fetch existing images:", fetchError);
      } else if (existingImages) {
        // Find billeder der skal slettes (ikke i keepImageUrls)
        const existingImagesData = existingImages as any[];
        const imagesToDelete = existingImagesData.filter(img => 
          !keepImageUrls.includes(img.image_url)
        );
        
        if (imagesToDelete.length > 0) {
          const idsToDelete = imagesToDelete.map(img => img.id);
          const { error: deleteImagesError } = await supabase
            .from("linkedin_post_images" as any)
            .delete()
            .in("id", idsToDelete);
          
          if (deleteImagesError) {
            console.error("Failed to delete specific images:", deleteImagesError);
          } else {
            console.log(`Kept ${keepImageUrls.length} existing images, deleted ${imagesToDelete.length} images`);
          }
        } else {
          console.log(`All ${existingImages.length} existing images kept`);
        }
      }
    }

    // Array til at holde billede upload resultater
    const imageUploadResults: Array<{
      linkedinImageUrn: string | null;
      supabaseImageUrl: string | null;
      uploadStatus: 'pending' | 'uploaded' | 'failed';
      uploadError: string | null;
      fileSize: number;
      fileType: string;
      originalName: string;
    }> = [];

    // Håndter nye billeder upload
    if (images.length > 0) {
      console.log(`Processing ${images.length} new image uploads in edit mode`);
      
      // Hent LinkedIn profil for upload - billeder skal altid uploades til LinkedIn for pre-upload
      const profile = await getLinkedInProfile(supabase, user.id) as any;
      const accessToken = await ensureAccessToken(profile);
      const personUrn = profile.person_urn as string;
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`Uploading image ${i + 1}/${images.length} in edit mode:`, image.name);
        
        const result = {
          linkedinImageUrn: null as string | null,
          supabaseImageUrl: null as string | null,
          uploadStatus: 'pending' as 'pending' | 'uploaded' | 'failed',
          uploadError: null as string | null,
          fileSize: image.size,
          fileType: image.type,
          originalName: image.name
        };
        
        // Upload til LinkedIn
        try {
          const linkedinUploadResult = await uploadImageToLinkedIn(accessToken, personUrn, image);
          result.uploadStatus = linkedinUploadResult.uploadStatus;
          result.uploadError = linkedinUploadResult.error;
          result.linkedinImageUrn = linkedinUploadResult.linkedinImageUrn;
          
          if (linkedinUploadResult.uploadStatus === 'uploaded') {
            console.log(`LinkedIn image upload ${i + 1} successful in edit mode:`, linkedinUploadResult.linkedinImageUrn);
          } else {
            console.error(`LinkedIn image upload ${i + 1} failed in edit mode:`, linkedinUploadResult.error);
          }
        } catch (error) {
          console.error(`LinkedIn image upload ${i + 1} error in edit mode:`, error);
          result.uploadStatus = 'failed';
          result.uploadError = error instanceof Error ? error.message : 'Billede upload fejlede';
        }
        
        // Upload optimeret version til Supabase Storage
        try {
          result.supabaseImageUrl = await optimizeAndUploadToSupabase(image, supabase, user.id);
          console.log(`Supabase image upload ${i + 1} successful in edit mode:`, result.supabaseImageUrl);
        } catch (error) {
          console.error(`Supabase image upload ${i + 1} failed in edit mode:`, error);
        }
        
        imageUploadResults.push(result);
      }
      
      // Billeder gemmes nu kun i separat linkedin_post_images tabel
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from("linkedin_posts" as any)
      .update(updateData)
      .eq("id", postId)
      .eq("user_id", user.id)
      .select("id, text, visibility, scheduled_for, status")
      .single();

    if (updateError) {
      console.error("Error updating post:", updateError);
      throw updateError;
    }

    // Hvis status ændres til "published", udgiv til LinkedIn
    if (newStatus === 'published') {
      try {
        // Hent LinkedIn access token
        const { data: profile, error: profileError } = await supabase
          .from("linkedin_profiles" as any)
          .select("access_token, linkedin_id")
          .eq("user_id", user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("LinkedIn access token not found");
        }

        const profileData = profile as any;
        
        if (!profileData.access_token) {
          throw new Error("LinkedIn access token not found");
        }

        // Forbered LinkedIn post data
        const linkedinPostData: any = {
          author: `urn:li:person:${profileData.linkedin_id}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: text
              },
              shareMediaCategory: imageUploadResults.length > 0 ? "IMAGE" : "NONE"
            }
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": visibility
          }
        };

        // Tilføj billeder hvis der er nogen
        if (imageUploadResults.length > 0) {
          const mediaUrns = imageUploadResults
            .filter(result => result.linkedinImageUrn)
            .map(result => ({ media: result.linkedinImageUrn }));
          
          if (mediaUrns.length > 0) {
            linkedinPostData.specificContent["com.linkedin.ugc.ShareContent"].media = mediaUrns;
          }
        }

        // Udgiv til LinkedIn
        const linkedinResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${profileData.access_token}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          },
          body: JSON.stringify(linkedinPostData)
        });

        if (!linkedinResponse.ok) {
          const errorText = await linkedinResponse.text();
          console.error('LinkedIn API error:', errorText);
          throw new Error(`LinkedIn publishing failed: ${linkedinResponse.status}`);
        }

        const linkedinResult = await linkedinResponse.json();
        
        // Opdater post med LinkedIn ID og published_at
        await supabase
          .from("linkedin_posts" as any)
          .update({
            ugc_post_id: linkedinResult.id,
            published_at: new Date().toISOString(),
            status: 'published'
          })
          .eq("id", postId);

        console.log('Successfully published to LinkedIn:', linkedinResult.id);
        
      } catch (linkedinError) {
        console.error('Error publishing to LinkedIn:', linkedinError);
        
        // Opdater status til failed hvis LinkedIn publishing fejler
        await supabase
          .from("linkedin_posts" as any)
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq("id", postId);
        
        // Returner fejl til frontend
        return NextResponse.json({ 
          error: `Post updated but LinkedIn publishing failed: ${linkedinError instanceof Error ? linkedinError.message : 'Unknown error'}`,
          postUpdated: true,
          linkedinPublished: false
        }, { status: 400 });
      }
    }

    // Gem nye billeder i den separate tabel
    if (imageUploadResults.length > 0) {
      const imageInserts = imageUploadResults.map((result, index) => ({
        post_id: postId,
        user_id: user.id,
        image_url: result.supabaseImageUrl,
        linkedin_image_urn: result.linkedinImageUrn,
        image_upload_status: result.uploadStatus,
        image_upload_error: result.uploadError,
        image_file_size: result.fileSize,
        image_file_type: result.fileType,
        image_original_name: result.originalName,
        display_order: index
      }));

      const { error: imagesError } = await supabase
        .from("linkedin_post_images" as any)
        .insert(imageInserts);
      
      if (imagesError) {
        console.error("Failed to insert new images:", imagesError);
        // Ikke kast fejl - hovedopslaget er allerede opdateret
      } else {
        console.log(`Successfully saved ${imageInserts.length} new images to database`);
      }
    }

    const updatedPostData = updatedPost as any;
    return NextResponse.json({ 
      success: true,
      postId: updatedPostData.id,
      message: "Post updated successfully",
      post: updatedPostData,
      imageCount: imageUploadResults.length,
      imageUploadResults: imageUploadResults.map(r => ({
        uploadStatus: r.uploadStatus,
        linkedinImageUrn: r.linkedinImageUrn,
        supabaseImageUrl: r.supabaseImageUrl
      }))
    });

  } catch (e: unknown) {
    console.error("Error updating post:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Noget gik galt. Prøv igen.',
      details: "Failed to update post"
    }, { status: 400 });
  }
}

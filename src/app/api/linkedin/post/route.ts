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
  // Simplificeret: tjek udløb og (evt.) refresh ved <14 dage tilbage
  const ttl = new Date(profile.access_token_expires_at).getTime() - Date.now();
  if (ttl > 14 * 864e5) return profile.access_token;
  // TODO: implementer rigtigt refresh-flow hvis du har refresh_token
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
  const asset = json.value.asset; // urn:li:digitalmediaAsset:...
  return { uploadUrl, asset };
}

async function uploadImageToLinkedIn(accessToken: string, personUrn: string, image: File) {
  try {
    console.log("Starting LinkedIn image upload process...");
    
    // Register upload with LinkedIn
    const { uploadUrl, asset } = await registerImageUpload(accessToken, personUrn);
    console.log("LinkedIn upload registered:", { asset });
    
    // Upload binary data
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

async function uploadBinary(uploadUrl: string, file: File, accessToken: string) {
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: Buffer.from(await file.arrayBuffer())
  });
  if (!res.ok) throw new Error(`binary upload failed: ${res.status} ${await res.text()}`);
}

async function optimizeAndUploadToSupabase(file: File, supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  try {
    // Optimer billedet med Sharp - max bredde 1200px, kvalitet 85%
    const buffer = Buffer.from(await file.arrayBuffer());
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Generer unikt filnavn
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload til Supabase Storage bucket 'linkedin-images'
    const { error } = await supabase.storage
      .from('linkedin-images')
      .upload(fileName, optimizedBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    // Få den offentlige URL
    const { data: { publicUrl } } = supabase.storage
      .from('linkedin-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error optimizing and uploading image:', error);
    throw new Error(`Image upload failed: ${error}`);
  }
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

  console.log("Creating LinkedIn UGC Post with payload:", JSON.stringify(payload, null, 2));
  
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
  console.log("LinkedIn API Response:", {
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
  console.log("Successfully created LinkedIn post with ID:", ugcPostId);
  return ugcPostId;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const form = await req.formData();
    const text = String(form.get("text") || "");
    const visibility = String(form.get("visibility") || "PUBLIC");
    
    // Håndter flere billeder
    const images: File[] = [];
    for (const [key, value] of form.entries()) {
      if (key.startsWith("image") && value instanceof File && value.size > 0) {
        images.push(value);
      }
    }
    
    const scheduledForLocal = form.get("scheduledFor") as string | null;
    const publishType = String(form.get("publishType") || "now"); // "now", "schedule", or "draft"
    
    // Konverter lokal tid til UTC for database storage
    let scheduledForUTC: string | null = null;
    if (scheduledForLocal && publishType === "schedule") {
      // scheduledForLocal er i format "YYYY-MM-DDTHH:MM:SS" (dansk tid)
      // Parse dato komponenter og konstruer Date objekt eksplicit som lokal tid
      const [datePart, timePart] = scheduledForLocal.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second = 0] = timePart.split(':').map(Number);
      
      // Konstruer Date objekt eksplicit som lokal tid (ikke UTC)
      const localDate = new Date(year, month - 1, day, hour, minute, second);
      
      // Konverter til UTC for database storage
      scheduledForUTC = localDate.toISOString();
      
      console.log("Scheduled time conversion:", {
        local: scheduledForLocal,
        utc: scheduledForUTC,
        localParsed: localDate.toString(),
        localDateTime: `${year}-${month}-${day} ${hour}:${minute}:${second}`
      });
    }

    const profile = await getLinkedInProfile(supabase, user.id) as any;
    const accessToken = await ensureAccessToken(profile);
    const personUrn = profile.person_urn as string;
    
        const imageAssetUrns: string[] = [];
    let ugcPostId: string | null = null;
    let status = "published";
    let publishedAt: Date | null = null;
    
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

    // Upload billeder baseret på publish type
    if (images.length > 0) {
      const uploadType = publishType === "draft" ? "draft" : (publishType === "schedule" ? "scheduled" : "immediate");
      console.log(`Processing ${images.length} image uploads for ${uploadType} post`);
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`Uploading image ${i + 1}/${images.length}:`, image.name);
        
        const result = {
          linkedinImageUrn: null as string | null,
          supabaseImageUrl: null as string | null,
          uploadStatus: 'pending' as 'pending' | 'uploaded' | 'failed',
          uploadError: null as string | null,
          fileSize: image.size,
          fileType: image.type,
          originalName: image.name
        };
        
        // For kladder: kun upload til Supabase
        if (publishType === "draft") {
          try {
            result.supabaseImageUrl = await optimizeAndUploadToSupabase(image, supabase, user.id);
            result.uploadStatus = 'uploaded';
            console.log(`Supabase image upload ${i + 1} successful for draft:`, result.supabaseImageUrl);
          } catch (error) {
            console.error(`Supabase image upload ${i + 1} failed for draft:`, error);
            result.uploadStatus = 'failed';
            result.uploadError = error instanceof Error ? error.message : 'Billede upload fejlede';
          }
        } else {
          // For planlagte og øjeblikkelige opslag: upload til både LinkedIn og Supabase
          // Upload til LinkedIn
          try {
            const linkedinUploadResult = await uploadImageToLinkedIn(accessToken, personUrn, image);
            result.uploadStatus = linkedinUploadResult.uploadStatus;
            result.uploadError = linkedinUploadResult.error;
            result.linkedinImageUrn = linkedinUploadResult.linkedinImageUrn;
            
            if (linkedinUploadResult.uploadStatus === 'uploaded' && linkedinUploadResult.linkedinImageUrn) {
              imageAssetUrns.push(linkedinUploadResult.linkedinImageUrn);
              console.log(`LinkedIn image upload ${i + 1} successful:`, linkedinUploadResult.linkedinImageUrn);
            } else {
              console.error(`LinkedIn image upload ${i + 1} failed:`, linkedinUploadResult.error);
            }
          } catch (error) {
            console.error(`LinkedIn image upload ${i + 1} error:`, error);
            result.uploadStatus = 'failed';
            result.uploadError = error instanceof Error ? error.message : 'Billede upload fejlede';
          }
          
          // Upload optimeret version til Supabase Storage (for miniature/preview)
          try {
            result.supabaseImageUrl = await optimizeAndUploadToSupabase(image, supabase, user.id);
            console.log(`Supabase image upload ${i + 1} successful:`, result.supabaseImageUrl);
          } catch (error) {
            console.error(`Supabase image upload ${i + 1} failed:`, error);
            // Fortsæt selvom Supabase upload fejler - LinkedIn upload er vigtigere for ikke-kladder
          }
        }
        
        imageUploadResults.push(result);
      }
    }

    // Håndter forskellige publish typer
    if (publishType === "draft") {
      status = "draft";
      publishedAt = null;
      console.log("Saving post as draft");
    } else if (publishType === "schedule" && scheduledForUTC) {
      status = "scheduled";
      publishedAt = null;
      console.log("Scheduling post with pre-uploaded images:", { imageAssetUrns });
    } else {
      // Publiser med det samme - brug de allerede uploadede billeder
      ugcPostId = await createUgcPost({ accessToken, personUrn, text, imageAssetUrns, visibility });
      
      // Sæt published_at til det faktiske tidspunkt hvor opslaget blev udgivet
      publishedAt = new Date();
      console.log("Published post immediately with pre-uploaded images:", { ugcPostId, imageAssetUrns });
    }

    // Gem hovedopslaget i Supabase (uden billede felter - de gemmes separat)
    const { data: postData, error: postError } = await supabase
      .from("linkedin_posts" as any)
      .insert({
        user_id: user.id,
        linkedin_profile_id: profile.id,
        ugc_post_id: ugcPostId,
        text,
        visibility: visibility,
        status: status,
        scheduled_for: scheduledForUTC,
        published_at: publishedAt?.toISOString() ?? null,
        // Billeder gemmes nu i separat linkedin_post_images tabel
      })
      .select("id, ugc_post_id, status, scheduled_for")
      .single();
    if (postError) throw postError;

    const postId = (postData as any).id;

    // Gem alle billeder i den separate tabel
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
        console.error("Failed to insert images:", imagesError);
        // Ikke kast fejl - hovedopslaget er allerede gemt
      } else {
        console.log(`Successfully saved ${imageInserts.length} images to database`);
      }
    }

    return NextResponse.json({ 
      postId: postId, 
      ugcPostId: (postData as any).ugc_post_id,
      status: (postData as any).status,
      scheduledFor: (postData as any).scheduled_for,
      imageCount: imageUploadResults.length,
      imageUploadResults: imageUploadResults.map(r => ({
        uploadStatus: r.uploadStatus,
        linkedinImageUrn: r.linkedinImageUrn,
        supabaseImageUrl: r.supabaseImageUrl
      }))
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Noget gik galt. Prøv igen.' }, { status: 400 });
  }
}

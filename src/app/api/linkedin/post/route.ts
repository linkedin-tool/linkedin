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

async function createUgcPost({ accessToken, personUrn, text, imageAssetUrn, visibility }: {
  accessToken: string; personUrn: string; text: string; imageAssetUrn?: string; visibility: string;
}) {
  const mediaBlock = imageAssetUrn
    ? {
        shareMediaCategory: "IMAGE",
        media: [{
          status: "READY",
          description: { text: text.slice(0, 200) },
          media: imageAssetUrn,
          title: { text: "Image" }
        }]
      }
    : { shareMediaCategory: "NONE" };

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

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...RESTLI
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`ugcPosts failed: ${res.status} ${await res.text()}`);
  // ID returneres i respons-headeren:
  const ugcPostId = res.headers.get("x-restli-id") || null;
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
    const image = form.get("image") as File | null;

    const profile = await getLinkedInProfile(supabase, user.id) as any;
    const accessToken = await ensureAccessToken(profile);
    const personUrn = profile.person_urn as string;

    let imageAssetUrn: string | undefined;
    let imageUrl: string | undefined;
    
    if (image && image.size > 0) {
      // Upload til LinkedIn
      const { uploadUrl, asset } = await registerImageUpload(accessToken, personUrn);
      await uploadBinary(uploadUrl, image, accessToken);
      imageAssetUrn = asset;
      
      // Upload optimeret version til Supabase Storage
      imageUrl = await optimizeAndUploadToSupabase(image, supabase, user.id);
    }

    const ugcPostId = await createUgcPost({ accessToken, personUrn, text, imageAssetUrn, visibility });

    // Gem i Supabase
    const { data, error } = await supabase
      .from("linkedin_posts" as any)
      .insert({
        user_id: user.id,
        linkedin_profile_id: profile.id,
        ugc_post_id: ugcPostId,
        text,
        image_asset_urn: imageAssetUrn ?? null,
        image_url: imageUrl ?? null,
        visibility: visibility
      })
      .select("id, ugc_post_id")
      .single();
    if (error) throw error;

    return NextResponse.json({ postId: (data as any).id, ugcPostId: (data as any).ugc_post_id });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    scope?: string;
  }>;
}

async function fetchUserInfo(accessToken: string) {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`userinfo failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{ sub: string } & Record<string, unknown>>;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  
  // Handle LinkedIn OAuth errors
  if (error) {
    const errorDescription = url.searchParams.get("error_description") || error;
    console.error("LinkedIn OAuth error:", error, errorDescription);
    return NextResponse.redirect(new URL(`/dashboard/integration?linkedin_error=${encodeURIComponent(errorDescription)}`, req.url));
  }
  
  if (!code) {
    console.error("Missing authorization code in callback");
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // TODO: valider 'state' mod cookie/session

  try {
    console.log("Exchanging code for tokens...");
    const token = await exchangeCodeForTokens(code);
    const accessToken = token.access_token;
    const accessTokenExpiresAt = new Date(Date.now() + token.expires_in * 1000);
    const refreshToken = token.refresh_token ?? null;
    const refreshTokenExpiresAt = token.refresh_token_expires_in
      ? new Date(Date.now() + token.refresh_token_expires_in * 1000)
      : null;
    const scope = token.scope ?? process.env.LINKEDIN_SCOPES!;

    console.log("Fetching user info...");
    const uinfo = await fetchUserInfo(accessToken); // OIDC userinfo
    const memberId = uinfo.sub;                      // LinkedIn member id
    const personUrn = `urn:li:person:${memberId}`;

    console.log("Getting Supabase user...");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated in app");

    console.log("Saving LinkedIn profile to database...");
    // upsert profil - opdater både created_at og updated_at ved fornyelse
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("linkedin_profiles" as any)
      .upsert({
        user_id: user.id,
        person_urn: personUrn,
        linkedin_member_id: memberId,
        scope,
        access_token: accessToken,
        access_token_expires_at: accessTokenExpiresAt.toISOString(),
        refresh_token: refreshToken,
        refresh_token_expires_at: refreshTokenExpiresAt?.toISOString() ?? null,
        created_at: now,  // Opdater created_at til fornyelsesdato
        updated_at: now
      }, { onConflict: "user_id" });
    if (error) throw error;

    console.log("LinkedIn integration successful, redirecting...");
    return NextResponse.redirect(new URL("/dashboard/integration?connected=linkedin", req.url));
  } catch (e: unknown) {
    console.error("LinkedIn callback error:", e);
    return NextResponse.redirect(new URL(`/dashboard/integration?linkedin_error=${encodeURIComponent(e instanceof Error ? e.message : 'Noget gik galt. Prøv igen.')}`, req.url));
  }
}

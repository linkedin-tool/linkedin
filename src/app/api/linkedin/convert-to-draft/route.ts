import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { postId } = await req.json();
    
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Hent det eksisterende opslag for at sikre det er planlagt og tilhører brugeren
    const { data: existingPost, error: fetchError } = await supabase
      .from("linkedin_posts" as any)
      .select("*")
      .eq("id", postId)
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: "Scheduled post not found" }, { status: 404 });
    }

    // Konverter opslaget til kladde
    const { data: updatedPost, error: updateError } = await supabase
      .from("linkedin_posts" as any)
      .update({
        status: "draft",
        scheduled_for: null,  // Fjern planlagt tidspunkt
        updated_at: new Date().toISOString()
      })
      .eq("id", postId)
      .eq("user_id", user.id)
      .select("id, status, updated_at")
      .single();

    if (updateError) {
      console.error("Error converting post to draft:", updateError);
      throw updateError;
    }

    const updatedPostData = updatedPost as any;
    return NextResponse.json({ 
      success: true,
      postId: updatedPostData.id,
      status: updatedPostData.status,
      message: "Post converted to draft successfully"
    });

  } catch (e: unknown) {
    console.error("Error converting post to draft:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Noget gik galt. Prøv igen.',
      details: "Failed to convert post to draft"
    }, { status: 400 });
  }
}

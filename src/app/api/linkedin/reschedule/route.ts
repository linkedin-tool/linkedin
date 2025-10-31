import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { postId, newScheduledFor } = await req.json();
    
    if (!postId || !newScheduledFor) {
      return NextResponse.json({ error: "Post ID and new scheduled time are required" }, { status: 400 });
    }

    // Valider at den nye dato er i fremtiden
    const newDate = new Date(newScheduledFor);
    if (newDate <= new Date()) {
      return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
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

    // Opdater scheduled_for datoen
    const { data: updatedPost, error: updateError } = await supabase
      .from("linkedin_posts" as any)
      .update({
        scheduled_for: newDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", postId)
      .eq("user_id", user.id)
      .select("id, scheduled_for, updated_at")
      .single();

    if (updateError) {
      console.error("Error updating scheduled post:", updateError);
      throw updateError;
    }

    const updatedPostData = updatedPost as any;
    return NextResponse.json({ 
      success: true,
      postId: updatedPostData.id,
      newScheduledFor: updatedPostData.scheduled_for,
      message: "Post rescheduled successfully"
    });

  } catch (e: unknown) {
    console.error("Error rescheduling post:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Unknown error',
      details: "Failed to reschedule post"
    }, { status: 400 });
  }
}

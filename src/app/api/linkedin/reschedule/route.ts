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

    // newScheduledFor er i format "YYYY-MM-DDTHH:MM:SS" (lokal tid, dansk tid)
    // Parse dato komponenter og konstruer Date objekt eksplicit som lokal tid
    const [datePart, timePart] = newScheduledFor.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second = 0] = timePart.split(':').map(Number);
    
    // Konstruer Date objekt eksplicit som lokal tid (ikke UTC)
    const localDate = new Date(year, month - 1, day, hour, minute, second);
    
    // Konverter til UTC for database storage
    const scheduledForUTC = localDate.toISOString();
    
    console.log("Reschedule time conversion:", {
      local: newScheduledFor,
      utc: scheduledForUTC,
      localParsed: localDate.toString(),
      localDateTime: `${year}-${month}-${day} ${hour}:${minute}:${second}`
    });

    // Valider at den nye dato er i fremtiden
    if (localDate <= new Date()) {
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

    // Opdater scheduled_for datoen med UTC tid
    const { data: updatedPost, error: updateError } = await supabase
      .from("linkedin_posts" as any)
      .update({
        scheduled_for: scheduledForUTC,  // Bruger UTC tid (konverteret fra lokal tid)
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
      error: e instanceof Error ? e.message : 'Noget gik galt. Prøv igen.',
      details: "Failed to reschedule post"
    }, { status: 400 });
  }
}

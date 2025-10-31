import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Call the database functions to get queue status and upcoming posts
    const [queueStatusResult, upcomingPostsResult] = await Promise.all([
      (supabase as any).rpc('get_queue_status'),
      (supabase as any).rpc('get_upcoming_posts', { hours_ahead: 168 }) // 7 days to get 10 time slots
    ]);

    if (queueStatusResult.error) {
      console.error('Error calling get_queue_status:', queueStatusResult.error);
      return NextResponse.json({
        error: "Failed to fetch queue status",
        details: queueStatusResult.error.message
      }, { status: 500 });
    }

    if (upcomingPostsResult.error) {
      console.error('Error calling get_upcoming_posts:', upcomingPostsResult.error);
    }

    if (!queueStatusResult.data) {
      return NextResponse.json({
        error: "No data returned",
        stats: {
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          lastRun: null,
          lastRunStatus: null,
          runsLast24Hours: 0,
          successRate: 0,
          averageDuration: null
        },
        recentRuns: [],
        upcomingPosts: upcomingPostsResult.data || []
      });
    }

    // The function returns a jsonb object with stats and recentRuns
    const result = queueStatusResult.data as {
      stats: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        lastRun: string | null;
        lastRunStatus: string | null;
        runsLast24Hours: number;
        successRate: number;
        averageDuration: number | null;
      };
      recentRuns: Array<{
        jobid: number;
        runid: string;
        status: string;
        start_time: string;
        end_time: string | null;
        return_message: string | null;
        command: string;
      }>;
    };

    return NextResponse.json({
      success: true,
      ...result,
      upcomingPosts: upcomingPostsResult.data || []
    });

  } catch (e: unknown) {
    console.error("Error fetching queue status:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Noget gik galt. Prøv igen.',
      details: "Failed to fetch queue status"
    }, { status: 500 });
  }
}

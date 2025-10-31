import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESTLI = { "X-Restli-Protocol-Version": "2.0.0" };

// Configuration
const BATCH_SIZE = 50; // Process 50 posts at a time
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

interface LinkedInPost {
  id: string;
  user_id: string;
  text: string;
  visibility: string;
  scheduled_for: string;
  images?: Array<{
    linkedin_image_urn: string;
    image_upload_status: string;
  }>;
}

interface LinkedInProfile {
  id: string;
  access_token: string;
  access_token_expires_at: string;
  person_urn: string;
}

/**
 * Ensures the access token is still valid (simplified version)
 */
async function ensureAccessToken(profile: LinkedInProfile): Promise<string> {
  // Check if token expires within 14 days
  const expiresAt = new Date(profile.access_token_expires_at);
  const now = new Date();
  const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysUntilExpiry > 14) {
    return profile.access_token;
  }
  
  // TODO: Implement refresh token flow if needed
  return profile.access_token;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates a UGC post on LinkedIn with retry logic
 */
async function createUgcPost({
  accessToken,
  personUrn,
  text,
  imageAssetUrns,
  visibility,
  retryCount = 0,
}: {
  accessToken: string;
  personUrn: string;
  text: string;
  imageAssetUrns?: string[];
  visibility: string;
  retryCount?: number;
}): Promise<string> {
  let mediaBlock;

  if (imageAssetUrns && imageAssetUrns.length > 0) {
    if (imageAssetUrns.length === 1) {
      // Single image
      mediaBlock = {
        shareMediaCategory: "IMAGE",
        media: [
          {
            status: "READY",
            description: { text: text.slice(0, 200) },
            media: imageAssetUrns[0],
            title: { text: "Image" },
          },
        ],
      };
    } else {
      // Multiple images
      mediaBlock = {
        shareMediaCategory: "IMAGE",
        media: imageAssetUrns.map((urn, index) => ({
          status: "READY",
          description: { text: text.slice(0, 200) },
          media: urn,
          title: { text: `Image ${index + 1}` },
        })),
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
        ...mediaBlock,
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility":
        visibility === "CONNECTIONS" ? "CONNECTIONS" : "PUBLIC",
    },
  };

  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...RESTLI,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseText = await res.text();

    if (!res.ok) {
      // Check if error is retryable (5xx errors or 429)
      const isRetryable = res.status >= 500 || res.status === 429;
      
      if (isRetryable && retryCount < MAX_RETRIES) {
        console.log(`Retrying LinkedIn API call (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY_MS * (retryCount + 1)); // Exponential backoff
        return createUgcPost({
          accessToken,
          personUrn,
          text,
          imageAssetUrns,
          visibility,
          retryCount: retryCount + 1,
        });
      }
      
      throw new Error(
        `LinkedIn API error: ${res.status} ${res.statusText} - ${responseText}`
      );
    }

    // LinkedIn returns the ID in the response header
    const ugcPostId = res.headers.get("x-restli-id");
    if (!ugcPostId) {
      throw new Error("LinkedIn API did not return a post ID");
    }

    return ugcPostId;
  } catch (error) {
    // Retry on network errors
    if (retryCount < MAX_RETRIES && error instanceof Error) {
      console.log(`Retrying after error: ${error.message} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY_MS * (retryCount + 1));
      return createUgcPost({
        accessToken,
        personUrn,
        text,
        imageAssetUrns,
        visibility,
        retryCount: retryCount + 1,
      });
    }
    throw error;
  }
}

/**
 * Publishes a scheduled post to LinkedIn
 */
async function publishPost(
  supabase: ReturnType<typeof createClient>,
  post: LinkedInPost
): Promise<{ success: boolean; error?: string; postId: string }> {
  try {
    // Fetch LinkedIn profile
    const { data: profile, error: profileError } = await supabase
      .from("linkedin_profiles")
      .select("*")
      .eq("user_id", post.user_id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        postId: post.id,
        error: `LinkedIn profile not found: ${profileError?.message}`,
      };
    }

    const linkedinProfile = profile as unknown as LinkedInProfile;

    // Ensure access token is valid
    const accessToken = await ensureAccessToken(linkedinProfile);
    const personUrn = linkedinProfile.person_urn;

    // Collect all LinkedIn image URNs
    const imageAssetUrns: string[] = [];
    if (post.images && post.images.length > 0) {
      post.images.forEach((image) => {
        if (
          image.linkedin_image_urn &&
          image.image_upload_status === "uploaded"
        ) {
          imageAssetUrns.push(image.linkedin_image_urn);
        }
      });
    }

    // Publish to LinkedIn
    const ugcPostId = await createUgcPost({
      accessToken,
      personUrn,
      text: post.text,
      imageAssetUrns,
      visibility: post.visibility,
    });

    // Update post in database
    const { error: updateError } = await supabase
      .from("linkedin_posts")
      .update({
        ugc_post_id: ugcPostId,
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    if (updateError) {
      return {
        success: false,
        postId: post.id,
        error: `Database update error: ${updateError.message}`,
      };
    }

    return { success: true, postId: post.id };
  } catch (error) {
    return {
      success: false,
      postId: post.id,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process posts in batches to avoid overwhelming the system
 */
async function processBatch(
  supabase: ReturnType<typeof createClient>,
  posts: LinkedInPost[]
): Promise<Array<{ success: boolean; error?: string; postId: string }>> {
  return await Promise.allSettled(
    posts.map((post) => publishPost(supabase, post))
  ).then((results) =>
    results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          success: false,
          postId: posts[index].id,
          error: result.reason?.message || String(result.reason),
        };
      }
    })
  );
}

/**
 * Process all posts in controlled batches
 */
async function processAllPosts(
  supabase: ReturnType<typeof createClient>,
  posts: LinkedInPost[]
): Promise<Array<{ success: boolean; error?: string; postId: string }>> {
  const allResults: Array<{ success: boolean; error?: string; postId: string }> = [];
  
  // Process in batches
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(posts.length / BATCH_SIZE)} (${batch.length} posts)`);
    
    const batchResults = await processBatch(supabase, batch);
    allResults.push(...batchResults);
    
    // Small delay between batches to be nice to LinkedIn's API
    if (i + BATCH_SIZE < posts.length) {
      await sleep(500);
    }
  }
  
  return allResults;
}

Deno.serve(async (req) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Start timing for execution tracking
    const startTime = Date.now();

    // Parse request body to get minute window (if provided by PostgreSQL function)
    let requestBody: any = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (e) {
      // If no body or invalid JSON, use current time
    }

    // Determine time window for this run
    let windowStart: Date;
    let windowEnd: Date;

    if (requestBody.minute_start && requestBody.minute_end) {
      // Use provided minute window from PostgreSQL function
      windowStart = new Date(requestBody.minute_start);
      windowEnd = new Date(requestBody.minute_end);
    } else {
      // Fallback: current minute + safety buffer for older posts
      const now = new Date();
      windowStart = new Date(Math.floor(now.getTime() / 60000) * 60000); // Current minute
      windowEnd = new Date(windowStart.getTime() + 60 * 1000); // Next minute
      
      // Add safety buffer for delayed posts (up to 5 minutes old)
      const safetyBuffer = new Date(windowStart.getTime() - 5 * 60 * 1000);
      windowStart = safetyBuffer;
    }

    console.log(`Processing window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`);

    // Create cron job run record
    const { data: cronJobRun, error: cronJobError } = await supabase
      .from('cron_job_runs')
      .insert({ 
        status: 'running',
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString()
      })
      .select()
      .single();

    if (cronJobError) {
      console.error("Error creating cron job run record:", cronJobError);
      // Continue execution even if logging fails
    }

    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("linkedin_posts")
      .select(`
        *,
        images:linkedin_post_images(*)
      `)
      .eq("status", "scheduled")
      .gte("scheduled_for", windowStart.toISOString())
      .lt("scheduled_for", windowEnd.toISOString())
      .order("scheduled_for", { ascending: true });

    if (fetchError) {
      console.error("Error fetching scheduled posts:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch scheduled posts",
          details: fetchError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      // Update cron job run record - no posts to process
      if (cronJobRun?.id) {
        await supabase
          .from('cron_job_runs')
          .update({
            status: 'completed',
            total_posts: 0,
            successful_posts: 0,
            failed_posts: 0,
            execution_time_ms: Date.now() - startTime,
            completed_at: new Date().toISOString()
          })
          .eq('id', cronJobRun.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "No scheduled posts to publish",
          count: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `Found ${scheduledPosts.length} scheduled post(s) to publish`
    );

    // Process all posts in controlled batches
    const results = await processAllPosts(
      supabase,
      scheduledPosts as unknown as LinkedInPost[]
    );

    // Count successes and failures
    const successful: string[] = [];
    const failed: Array<{ postId: string; error: string }> = [];

    results.forEach((result) => {
      if (result.success) {
        successful.push(result.postId);
      } else {
        failed.push({ postId: result.postId, error: result.error || "Unknown error" });
      }
    });

    console.log(
      `Published ${successful.length} post(s) successfully, ${failed.length} failed`
    );

    if (failed.length > 0) {
      console.error("Failed posts:", failed);
    }

    // Update cron job run record with final results
    if (cronJobRun?.id) {
      await supabase
        .from('cron_job_runs')
        .update({
          status: 'completed',
          total_posts: scheduledPosts.length,
          successful_posts: successful.length,
          failed_posts: failed.length,
          execution_time_ms: Date.now() - startTime,
          completed_at: new Date().toISOString()
        })
        .eq('id', cronJobRun.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: scheduledPosts.length,
        successful: successful.length,
        failed: failed.length,
        failures: failed,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in publish-scheduled-posts function:", error);
    
    // Try to update cron job run record with error status
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      
      // We need to find the most recent running job for this function
      const { data: runningJob } = await supabase
        .from('cron_job_runs')
        .select('id, started_at')
        .eq('status', 'running')
        .eq('job_name', 'publish-scheduled-posts')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
        
      if (runningJob?.id) {
        const executionTime = runningJob.started_at 
          ? Date.now() - new Date(runningJob.started_at).getTime()
          : 0;
          
        await supabase
          .from('cron_job_runs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : String(error),
            execution_time_ms: executionTime,
            completed_at: new Date().toISOString()
          })
          .eq('id', runningJob.id);
      }
    } catch (logError) {
      console.error("Error updating cron job run record:", logError);
    }
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

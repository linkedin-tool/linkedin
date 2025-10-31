-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to publish scheduled LinkedIn posts via Edge Function
-- This function calls the Edge Function which handles the actual LinkedIn API calls
-- The Edge Function uses SUPABASE_SERVICE_ROLE_KEY internally for database access
CREATE OR REPLACE FUNCTION publish_scheduled_linkedin_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url text;
  response_id bigint;
BEGIN
  -- Get project URL (this should match your Supabase project URL)
  project_url := 'https://ixbgjwmnhxpkyraodyxy.supabase.co';
  
  -- Make async HTTP POST request to the Edge Function
  -- Note: Edge Functions have access to SUPABASE_SERVICE_ROLE_KEY via environment variables
  -- So we don't need to pass authentication - the Edge Function handles it internally
  SELECT net.http_post(
    url := project_url || '/functions/v1/publish-scheduled-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
      -- No Authorization header needed - Edge Function uses SUPABASE_SERVICE_ROLE_KEY internally
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000  -- 5 minute timeout for batch processing (handles up to 200+ posts)
  ) INTO response_id;
  
  -- Log the request for monitoring
  RAISE LOG 'Scheduled publish job triggered: request_id=%, timestamp=%', response_id, now();
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail - allows cron to continue running
    RAISE WARNING 'Error calling publish-scheduled-posts Edge Function: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (pg_cron runs as postgres)
GRANT EXECUTE ON FUNCTION publish_scheduled_linkedin_posts() TO postgres;

-- Schedule the cron job to run every minute
-- This will check for scheduled posts that need to be published
SELECT cron.schedule(
  'publish-scheduled-linkedin-posts',  -- job name
  '* * * * *',                         -- cron expression: every minute
  'SELECT publish_scheduled_linkedin_posts();'  -- SQL command to execute
);

-- Add comment
COMMENT ON FUNCTION publish_scheduled_linkedin_posts() IS 
'Calls the Edge Function to publish scheduled LinkedIn posts. Runs every minute via pg_cron.';

-- Add comment for the cron job
COMMENT ON EXTENSION pg_cron IS 
'pg_cron is used to schedule the publish_scheduled_linkedin_posts function to run every minute.';

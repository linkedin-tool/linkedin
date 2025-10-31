-- Fix Edge Function authentication
-- Edge Functions with verify_jwt=true require an Authorization header
-- We'll use the anon key for the HTTP request (the Edge Function uses service_role_key internally for DB access)

CREATE OR REPLACE FUNCTION publish_scheduled_linkedin_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url text;
  anon_key text;
  response_id bigint;
BEGIN
  -- Get project URL and anon key
  project_url := 'https://ixbgjwmnhxpkyraodyxy.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Ymdqd21uaHhwa3lyYW9keXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1Nzk1MzYsImV4cCI6MjA3NzE1NTUzNn0.47h1_-TBNMEkQpHsfU-gJG-AINLiQcDK2qo74F-84KQ';
  
  -- Make async HTTP POST request to the Edge Function with Authorization header
  SELECT net.http_post(
    url := project_url || '/functions/v1/publish-scheduled-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
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


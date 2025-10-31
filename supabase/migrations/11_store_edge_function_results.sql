-- Store Edge Function results in a table for detailed tracking
CREATE TABLE IF NOT EXISTS public.cron_job_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  run_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_id BIGINT,
  total_posts INTEGER DEFAULT 0,
  successful_posts INTEGER DEFAULT 0,
  failed_posts INTEGER DEFAULT 0,
  failures JSONB,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_job_results_job_name ON public.cron_job_results(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_job_results_run_time ON public.cron_job_results(run_time DESC);

COMMENT ON TABLE public.cron_job_results IS 'Stores detailed results from Edge Function calls for cron jobs';
COMMENT ON COLUMN public.cron_job_results.job_name IS 'Name of the cron job (e.g., publish-scheduled-linkedin-posts)';
COMMENT ON COLUMN public.cron_job_results.run_time IS 'Time when the cron job was executed';
COMMENT ON COLUMN public.cron_job_results.response_id IS 'ID from net._http_response table';
COMMENT ON COLUMN public.cron_job_results.total_posts IS 'Total number of posts processed';
COMMENT ON COLUMN public.cron_job_results.successful_posts IS 'Number of posts successfully published';
COMMENT ON COLUMN public.cron_job_results.failed_posts IS 'Number of posts that failed to publish';
COMMENT ON COLUMN public.cron_job_results.failures IS 'JSON array of failed posts with error details';
COMMENT ON COLUMN public.cron_job_results.execution_time_ms IS 'Execution time in milliseconds';

-- Update publish_scheduled_linkedin_posts function to store results
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
  response_data jsonb;
  response_content text;
  execution_start timestamptz;
  execution_end timestamptz;
  execution_time_ms integer;
BEGIN
  execution_start := now();
  
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
  
  -- Wait a moment for the async request to complete (we'll process the response later via a trigger or polling)
  -- For now, we'll store basic info immediately
  INSERT INTO public.cron_job_results (
    job_name,
    run_time,
    response_id,
    total_posts,
    successful_posts,
    failed_posts
  ) VALUES (
    'publish-scheduled-linkedin-posts',
    execution_start,
    response_id,
    0, -- Will be updated when response is available
    0,
    0
  );
  
  -- Try to fetch response immediately (may be null if async hasn't completed)
  -- In production, you might want to use a separate process or trigger to update this
  SELECT content INTO response_content
  FROM net._http_response
  WHERE id = response_id
  LIMIT 1;
  
  -- Parse response and update the record
  IF response_content IS NOT NULL THEN
    BEGIN
      response_data := response_content::jsonb;
      
      execution_end := now();
      execution_time_ms := EXTRACT(EPOCH FROM (execution_end - execution_start)) * 1000;
      
      UPDATE public.cron_job_results
      SET 
        total_posts = COALESCE((response_data->>'total')::integer, 0),
        successful_posts = COALESCE((response_data->>'successful')::integer, 0),
        failed_posts = COALESCE((response_data->>'failed')::integer, 0),
        failures = response_data->'failures',
        execution_time_ms = execution_time_ms
      WHERE response_id = cron_job_results.response_id
        AND run_time = execution_start;
    EXCEPTION
      WHEN OTHERS THEN
        -- If parsing fails, just log it
        RAISE WARNING 'Failed to parse Edge Function response: %', SQLERRM;
    END;
  END IF;
  
  -- Log the request for monitoring
  RAISE LOG 'Scheduled publish job triggered: request_id=%, timestamp=%', response_id, execution_start;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail - allows cron to continue running
    RAISE WARNING 'Error calling publish-scheduled-posts Edge Function: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.cron_job_results TO authenticated;
GRANT EXECUTE ON FUNCTION publish_scheduled_linkedin_posts() TO postgres;


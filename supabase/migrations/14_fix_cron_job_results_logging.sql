-- Fix the publish_scheduled_linkedin_posts function to properly store results in cron_job_results
-- The issue was missing Authorization header in the HTTP request

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
  wait_count integer := 0;
  max_wait_attempts integer := 10; -- Wait up to 10 seconds for response
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
    timeout_milliseconds := 300000  -- 5 minute timeout for batch processing
  ) INTO response_id;
  
  -- Store initial record immediately
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
  
  -- Wait for response to be available (with timeout)
  WHILE wait_count < max_wait_attempts LOOP
    SELECT content INTO response_content
    FROM net._http_response
    WHERE id = response_id
    LIMIT 1;
    
    -- If we got a response, break out of the loop
    IF response_content IS NOT NULL THEN
      EXIT;
    END IF;
    
    -- Wait 1 second before trying again
    PERFORM pg_sleep(1);
    wait_count := wait_count + 1;
  END LOOP;
  
  -- Parse response and update the record
  IF response_content IS NOT NULL THEN
    BEGIN
      response_data := response_content::jsonb;
      
      execution_end := now();
      execution_time_ms := EXTRACT(EPOCH FROM (execution_end - execution_start)) * 1000;
      
      -- Update the record with actual results
      UPDATE public.cron_job_results
      SET 
        total_posts = COALESCE((response_data->>'total')::integer, 0),
        successful_posts = COALESCE((response_data->>'successful')::integer, 0),
        failed_posts = COALESCE((response_data->>'failed')::integer, 0),
        failures = response_data->'failures',
        execution_time_ms = execution_time_ms
      WHERE response_id = response_id
        AND job_name = 'publish-scheduled-linkedin-posts'
        AND run_time = execution_start;
        
      RAISE LOG 'Scheduled publish job completed: total=%, successful=%, failed=%, duration=%ms', 
        COALESCE((response_data->>'total')::integer, 0),
        COALESCE((response_data->>'successful')::integer, 0),
        COALESCE((response_data->>'failed')::integer, 0),
        execution_time_ms;
        
    EXCEPTION
      WHEN OTHERS THEN
        -- If parsing fails, log it and update with error info
        UPDATE public.cron_job_results
        SET 
          failures = jsonb_build_object('error', 'Failed to parse response: ' || SQLERRM)
        WHERE response_id = response_id
          AND job_name = 'publish-scheduled-linkedin-posts'
          AND run_time = execution_start;
          
        RAISE WARNING 'Failed to parse Edge Function response: %', SQLERRM;
    END;
  ELSE
    -- No response received within timeout
    UPDATE public.cron_job_results
    SET 
      failures = jsonb_build_object('error', 'No response received within timeout')
    WHERE response_id = response_id
      AND job_name = 'publish-scheduled-linkedin-posts'
      AND run_time = execution_start;
      
    RAISE WARNING 'Edge Function did not respond within timeout';
  END IF;
  
  -- Log the request for monitoring
  RAISE LOG 'Scheduled publish job triggered: request_id=%, timestamp=%', response_id, execution_start;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail - allows cron to continue running
    -- Also try to insert error record if possible
    BEGIN
      INSERT INTO public.cron_job_results (
        job_name,
        run_time,
        total_posts,
        successful_posts,
        failed_posts,
        failures
      ) VALUES (
        'publish-scheduled-linkedin-posts',
        execution_start,
        0,
        0,
        0,
        jsonb_build_object('error', 'Function error: ' || SQLERRM)
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- If we can't even insert error record, just log it
        NULL;
    END;
    
    RAISE WARNING 'Error in publish_scheduled_linkedin_posts function: %', SQLERRM;
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION publish_scheduled_linkedin_posts() TO postgres;

-- Add helpful comment
COMMENT ON FUNCTION publish_scheduled_linkedin_posts() IS 
'Enhanced version that calls Edge Function and stores detailed results in cron_job_results table. Includes proper error handling and response parsing.';

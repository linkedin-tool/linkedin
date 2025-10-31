-- Function to get cron job ID by name
CREATE OR REPLACE FUNCTION get_cron_job_id(job_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id
  FROM cron.job
  WHERE jobname = job_name
  LIMIT 1;
  
  RETURN job_id;
END;
$$;

-- Function to get queue status for publish-scheduled-linkedin-posts
CREATE OR REPLACE FUNCTION get_queue_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  job_id bigint;
  result jsonb;
BEGIN
  -- Get cron job ID
  SELECT jobid INTO job_id
  FROM cron.job
  WHERE jobname = 'publish-scheduled-linkedin-posts'
  LIMIT 1;
  
  IF job_id IS NULL THEN
    RETURN jsonb_build_object(
      'stats', jsonb_build_object(
        'totalRuns', 0,
        'successfulRuns', 0,
        'failedRuns', 0,
        'lastRun', null,
        'lastRunStatus', null,
        'runsLast24Hours', 0,
        'successRate', 0,
        'averageDuration', null
      ),
      'recentRuns', '[]'::jsonb
    );
  END IF;
  
  -- Build result with stats and recent runs
  SELECT jsonb_build_object(
    'stats', stats_data,
    'recentRuns', recent_runs_data
  ) INTO result
  FROM (
    -- Stats
    SELECT jsonb_build_object(
      'totalRuns', COUNT(*),
      'successfulRuns', COUNT(*) FILTER (WHERE status = 'succeeded'),
      'failedRuns', COUNT(*) FILTER (WHERE status != 'succeeded' AND status != 'running'),
      'lastRun', MAX(start_time),
      'lastRunStatus', (SELECT status FROM cron.job_run_details WHERE jobid = job_id ORDER BY start_time DESC LIMIT 1),
      'runsLast24Hours', COUNT(*) FILTER (WHERE start_time > NOW() - INTERVAL '24 hours'),
      'successRate', CASE 
        WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'succeeded')::float / COUNT(*)::float * 100)::numeric, 1)
        ELSE 0
      END,
      'averageDuration', CASE
        WHEN COUNT(*) FILTER (WHERE end_time IS NOT NULL) > 0 THEN
          ROUND((AVG(EXTRACT(EPOCH FROM (end_time - start_time))) FILTER (WHERE end_time IS NOT NULL))::numeric, 2)
        ELSE null
      END
    ) as stats_data,
    -- Recent runs (last 50)
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'jobid', jobid,
          'runid', runid::text,
          'status', status,
          'start_time', start_time,
          'end_time', end_time,
          'return_message', return_message,
          'command', command
        )
        ORDER BY start_time DESC
      )
      FROM cron.job_run_details
      WHERE jobid = job_id
      ORDER BY start_time DESC
      LIMIT 50
    ) as recent_runs_data
    FROM cron.job_run_details
    WHERE jobid = job_id
  ) subq;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_cron_job_id(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_queue_status() TO authenticated;

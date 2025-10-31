-- Update get_queue_status to use cron_job_results for detailed information
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
  
  -- Build result with stats from cron_job_results (more detailed) and recent runs
  SELECT jsonb_build_object(
    'stats', stats_data,
    'recentRuns', recent_runs_data
  ) INTO result
  FROM (
    -- Stats from cron_job_results (combine with cron.job_run_details for cron status)
    SELECT jsonb_build_object(
      'totalRuns', COUNT(DISTINCT cj.run_time),
      'successfulRuns', COUNT(DISTINCT cj.run_time) FILTER (WHERE cjd.status = 'succeeded'),
      'failedRuns', COUNT(DISTINCT cj.run_time) FILTER (WHERE cjd.status != 'succeeded' AND cjd.status != 'running'),
      'lastRun', MAX(cj.run_time),
      'lastRunStatus', (SELECT status FROM cron.job_run_details WHERE jobid = job_id ORDER BY start_time DESC LIMIT 1),
      'runsLast24Hours', COUNT(DISTINCT cj.run_time) FILTER (WHERE cj.run_time > NOW() - INTERVAL '24 hours'),
      'successRate', CASE 
        WHEN COUNT(DISTINCT cj.run_time) > 0 THEN 
          ROUND((COUNT(DISTINCT cj.run_time) FILTER (WHERE cjd.status = 'succeeded')::float / COUNT(DISTINCT cj.run_time)::float * 100)::numeric, 1)
        ELSE 0
      END,
      'averageDuration', CASE
        WHEN COUNT(DISTINCT cj.run_time) FILTER (WHERE cj.execution_time_ms IS NOT NULL) > 0 THEN
          ROUND((AVG(cj.execution_time_ms) FILTER (WHERE cj.execution_time_ms IS NOT NULL))::numeric, 2)
        ELSE null
      END,
      'totalPostsProcessed', COALESCE(SUM(cj.total_posts), 0),
      'totalPostsSuccessful', COALESCE(SUM(cj.successful_posts), 0),
      'totalPostsFailed', COALESCE(SUM(cj.failed_posts), 0)
    ) as stats_data,
    -- Recent runs with detailed information from cron_job_results
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'run_time', cj.run_time,
          'status', COALESCE(cjd.status, 'unknown'),
          'total_posts', cj.total_posts,
          'successful_posts', cj.successful_posts,
          'failed_posts', cj.failed_posts,
          'execution_time_ms', cj.execution_time_ms,
          'failures', cj.failures,
          'cron_start_time', cjd.start_time,
          'cron_end_time', cjd.end_time
        )
        ORDER BY cj.run_time DESC
      )
      FROM cron_job_results cj
      LEFT JOIN cron.job_run_details cjd 
        ON cjd.jobid = job_id 
        AND ABS(EXTRACT(EPOCH FROM (cjd.start_time - cj.run_time))) < 5  -- Match within 5 seconds
      WHERE cj.job_name = 'publish-scheduled-linkedin-posts'
      ORDER BY cj.run_time DESC
      LIMIT 50
    ) as recent_runs_data
    FROM cron_job_results cj
    LEFT JOIN cron.job_run_details cjd 
      ON cjd.jobid = job_id 
      AND ABS(EXTRACT(EPOCH FROM (cjd.start_time - cj.run_time))) < 5  -- Match within 5 seconds
    WHERE cj.job_name = 'publish-scheduled-linkedin-posts'
  ) subq;
  
  RETURN result;
END;
$$;


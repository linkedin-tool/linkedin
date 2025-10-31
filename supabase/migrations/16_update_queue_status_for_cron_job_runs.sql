-- Update get_queue_status to use the new cron_job_runs table
CREATE OR REPLACE FUNCTION get_queue_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Build result with stats from cron_job_runs table
  SELECT jsonb_build_object(
    'stats', stats_data,
    'recentRuns', recent_runs_data
  ) INTO result
  FROM (
    -- Stats from cron_job_runs
    SELECT jsonb_build_object(
      'totalRuns', COUNT(*),
      'successfulRuns', COUNT(*) FILTER (WHERE status = 'completed'),
      'failedRuns', COUNT(*) FILTER (WHERE status = 'failed'),
      'lastRun', MAX(started_at),
      'lastRunStatus', (SELECT status FROM cron_job_runs ORDER BY started_at DESC LIMIT 1),
      'runsLast24Hours', COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '24 hours'),
      'successRate', CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE status = 'completed')::float / COUNT(*)::float * 100)::numeric, 1)
        ELSE 0
      END,
      'averageDuration', CASE
        WHEN COUNT(*) FILTER (WHERE execution_time_ms IS NOT NULL) > 0 THEN
          ROUND((AVG(execution_time_ms) FILTER (WHERE execution_time_ms IS NOT NULL))::numeric, 2)
        ELSE null
      END,
      'totalPostsProcessed', COALESCE(SUM(total_posts), 0),
      'totalPostsSuccessful', COALESCE(SUM(successful_posts), 0),
      'totalPostsFailed', COALESCE(SUM(failed_posts), 0)
    ) as stats_data,
    -- Recent runs with detailed information
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'run_time', started_at,
          'status', status,
          'total_posts', total_posts,
          'successful_posts', successful_posts,
          'failed_posts', failed_posts,
          'execution_time_ms', execution_time_ms,
          'error_message', error_message,
          'window_start', window_start,
          'window_end', window_end,
          'cron_start_time', started_at,
          'cron_end_time', completed_at
        )
        ORDER BY started_at DESC
      )
      FROM cron_job_runs
      WHERE job_name = 'publish-scheduled-posts'
      ORDER BY started_at DESC
      LIMIT 50
    ) as recent_runs_data
    FROM cron_job_runs
    WHERE job_name = 'publish-scheduled-posts'
  ) subq;
  
  -- If no data, return empty structure
  IF result IS NULL THEN
    RETURN jsonb_build_object(
      'stats', jsonb_build_object(
        'totalRuns', 0,
        'successfulRuns', 0,
        'failedRuns', 0,
        'lastRun', null,
        'lastRunStatus', null,
        'runsLast24Hours', 0,
        'successRate', 0,
        'averageDuration', null,
        'totalPostsProcessed', 0,
        'totalPostsSuccessful', 0,
        'totalPostsFailed', 0
      ),
      'recentRuns', '[]'::jsonb
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_queue_status() TO authenticated;

-- Function to get upcoming scheduled posts
CREATE OR REPLACE FUNCTION get_upcoming_posts(hours_ahead INTEGER DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'scheduled_for', scheduled_for,
      'post_count', post_count,
      'time_label', CASE
        WHEN scheduled_for <= NOW() + INTERVAL '1 hour' THEN 'Inden for 1 time'
        WHEN scheduled_for <= NOW() + INTERVAL '6 hours' THEN 'Inden for 6 timer'
        WHEN scheduled_for <= NOW() + INTERVAL '24 hours' THEN 'Inden for 24 timer'
        ELSE 'Senere'
      END
    )
    ORDER BY scheduled_for ASC
  ) INTO result
  FROM (
    SELECT 
      scheduled_for,
      COUNT(*) as post_count
    FROM linkedin_posts
    WHERE status = 'scheduled'
      AND scheduled_for IS NOT NULL
      AND scheduled_for > NOW()
      AND scheduled_for <= NOW() + (hours_ahead || ' hours')::INTERVAL
    GROUP BY scheduled_for
    ORDER BY scheduled_for ASC
    LIMIT 50
  ) subq;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_upcoming_posts(INTEGER) TO authenticated;

COMMENT ON FUNCTION get_upcoming_posts(INTEGER) IS 
'Returns a list of upcoming scheduled posts grouped by scheduled_for time, for the next N hours (default 24).';


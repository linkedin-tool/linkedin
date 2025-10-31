-- Create cron_job_runs table for tracking Edge Function execution
CREATE TABLE cron_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL DEFAULT 'publish-scheduled-posts',
  status TEXT NOT NULL DEFAULT 'running',
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  total_posts INTEGER DEFAULT 0,
  successful_posts INTEGER DEFAULT 0,
  failed_posts INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for better query performance
CREATE INDEX idx_cron_job_runs_started_at ON cron_job_runs(started_at DESC);
CREATE INDEX idx_cron_job_runs_job_name ON cron_job_runs(job_name);
CREATE INDEX idx_cron_job_runs_status ON cron_job_runs(status);

-- Add RLS policy (allow service role to read/write)
ALTER TABLE cron_job_runs ENABLE ROW LEVEL SECURITY;

-- Policy for service role (Edge Functions)
CREATE POLICY "Service role can manage cron_job_runs" ON cron_job_runs
  FOR ALL USING (auth.role() = 'service_role');

-- Policy for authenticated users to read their own data (for dashboard)
CREATE POLICY "Users can read cron_job_runs" ON cron_job_runs
  FOR SELECT USING (auth.role() = 'authenticated');

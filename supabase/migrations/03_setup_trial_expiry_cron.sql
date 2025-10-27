-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a cron job to run every hour and check for expired trials
-- This runs at minute 0 of every hour (xx:00)
SELECT cron.schedule(
  'expire-free-trials',           -- job name
  '0 * * * *',                   -- cron expression: every hour at minute 0
  'SELECT expire_free_trials();'  -- SQL command to execute
);

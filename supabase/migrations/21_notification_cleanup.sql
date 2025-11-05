-- Function to clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to mark old notifications as read (older than 7 days)
CREATE OR REPLACE FUNCTION mark_old_notifications_read()
RETURNS void AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, updated_at = NOW()
    WHERE created_at < NOW() - INTERVAL '7 days' 
    AND is_read = false;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily at 2 AM
SELECT cron.schedule(
    'cleanup-old-notifications',
    '0 2 * * *', -- Daily at 2 AM
    'SELECT cleanup_old_notifications();'
);

-- Schedule marking old notifications as read to run daily at 3 AM
SELECT cron.schedule(
    'mark-old-notifications-read',
    '0 3 * * *', -- Daily at 3 AM
    'SELECT mark_old_notifications_read();'
);

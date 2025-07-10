-- Fix notifications table structure and add missing policies

-- First, let's clean up the duplicate read columns - keep 'read' and remove 'is_read'
ALTER TABLE public.notifications DROP COLUMN IF EXISTS is_read;

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications table
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications for users"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- Enable real-time subscriptions for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications(user_id, read);

-- Grant necessary permissions
GRANT ALL ON public.notifications TO postgres, authenticated, service_role;

-- Add comments for documentation
COMMENT ON TABLE public.notifications IS 'User notifications for applications, offers, interviews, and system messages';
COMMENT ON COLUMN public.notifications.read IS 'Whether the notification has been read by the user';
COMMENT ON COLUMN public.notifications.read_at IS 'Timestamp when the notification was read';
COMMENT ON COLUMN public.notifications.channel IS 'Channel through which notification was sent (in-app, email, sms)'; 
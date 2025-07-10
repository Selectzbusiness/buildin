-- Fix notification_preferences table structure and add missing policies

-- Enable RLS on notification_preferences table
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_preferences table
CREATE POLICY "Users can view their own notification preferences"
    ON public.notification_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
    ON public.notification_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
    ON public.notification_preferences FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notification preferences"
    ON public.notification_preferences FOR DELETE
    USING (user_id = auth.uid());

-- Enable real-time subscriptions for notification_preferences table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_preferences;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx ON public.notification_preferences(user_id);

-- Grant necessary permissions
GRANT ALL ON public.notification_preferences TO postgres, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE notification_preferences_id_seq TO postgres, authenticated, service_role;

-- Add comments for documentation
COMMENT ON TABLE public.notification_preferences IS 'User preferences for notification delivery channels and types';
COMMENT ON COLUMN public.notification_preferences.notify_email IS 'Whether to send notifications via email';
COMMENT ON COLUMN public.notification_preferences.notify_sms IS 'Whether to send notifications via SMS';
COMMENT ON COLUMN public.notification_preferences.notify_inapp IS 'Whether to show in-app notifications';
COMMENT ON COLUMN public.notification_preferences.job_alerts IS 'Whether to receive job alert notifications';
COMMENT ON COLUMN public.notification_preferences.application_updates IS 'Whether to receive application update notifications';
COMMENT ON COLUMN public.notification_preferences.marketing IS 'Whether to receive marketing notifications'; 
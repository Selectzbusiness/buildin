-- Fix notifications table RLS policies to allow proper notification creation
-- This migration addresses the 409 conflict error when creating notifications

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "System can insert notifications for users" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create improved RLS policies for notifications table
-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

-- Allow users to update their own notifications
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

-- Allow authenticated users to insert notifications for any user
-- This is needed for employers to create notifications for job seekers
CREATE POLICY "Authenticated users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create additional indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS notifications_internship_application_id_idx ON public.notifications(internship_application_id);
CREATE INDEX IF NOT EXISTS notifications_application_id_idx ON public.notifications(application_id);

-- Grant necessary permissions
GRANT ALL ON public.notifications TO postgres, authenticated, service_role;

-- Add comments for documentation
COMMENT ON TABLE public.notifications IS 'User notifications for applications, offers, interviews, and system messages';
COMMENT ON COLUMN public.notifications.internship_application_id IS 'Reference to internship application for internship-related notifications';
COMMENT ON COLUMN public.notifications.application_id IS 'Reference to job application for job-related notifications'; 
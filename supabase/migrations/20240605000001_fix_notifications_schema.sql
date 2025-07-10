-- Fix notifications table schema to ensure proper support for both job and internship notifications
-- This migration ensures the table structure matches the expected schema

-- First, ensure the notifications table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  user_id uuid not null,
  title text not null,
  message text not null,
  type text not null,
  application_id uuid null,
  job_offer_id uuid null,
  interview_id uuid null,
  read_at timestamp with time zone null,
  action_url text null,
  emailed boolean null default false,
  channel text null default 'in-app'::text,
  read boolean not null default false,
  internship_application_id uuid null,
  constraint notifications_pkey primary key (id),
  constraint notifications_internship_application_id_fkey foreign KEY (internship_application_id) references internship_applications (id) on delete CASCADE,
  constraint notifications_interview_id_fkey foreign KEY (interview_id) references interviews (id) on delete CASCADE,
  constraint notifications_application_id_fkey foreign KEY (application_id) references applications (id) on delete CASCADE,
  constraint notifications_job_offer_id_fkey foreign KEY (job_offer_id) references job_offers (id) on delete CASCADE,
  constraint notifications_type_check check (
    (
      type = any (
        array[
          'application'::text,
          'offer'::text,
          'interview'::text,
          'message'::text,
          'system'::text
        ]
      )
    )
  ),
  constraint only_one_application_id check (
    (
      (
        (application_id is not null)
        and (internship_application_id is null)
      )
      or (
        (application_id is null)
        and (internship_application_id is not null)
      )
      or (
        (application_id is null)
        and (internship_application_id is null)
      )
    )
  )
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF not exists notifications_user_id_idx on public.notifications using btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF not exists notifications_created_at_idx on public.notifications using btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF not exists notifications_read_idx on public.notifications using btree (read) TABLESPACE pg_default;
CREATE INDEX IF not exists notifications_user_read_idx on public.notifications using btree (user_id, read) TABLESPACE pg_default;
CREATE INDEX IF not exists notifications_internship_application_id_idx on public.notifications using btree (internship_application_id) TABLESPACE pg_default;
CREATE INDEX IF not exists notifications_application_id_idx on public.notifications using btree (application_id) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.notifications TO postgres, authenticated, service_role;

-- Add comments for documentation
COMMENT ON TABLE public.notifications IS 'User notifications for applications, offers, interviews, and system messages';
COMMENT ON COLUMN public.notifications.read IS 'Whether the notification has been read by the user';
COMMENT ON COLUMN public.notifications.read_at IS 'Timestamp when the notification was read';
COMMENT ON COLUMN public.notifications.channel IS 'Channel through which notification was sent (in-app, email, sms)';
COMMENT ON COLUMN public.notifications.internship_application_id IS 'Reference to internship application for internship-related notifications';
COMMENT ON COLUMN public.notifications.application_id IS 'Reference to job application for job-related notifications'; 
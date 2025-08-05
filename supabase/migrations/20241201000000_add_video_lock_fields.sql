-- Add video lock functionality to prevent video deletion for 20 days
-- This migration adds functions and policies to enforce the 20-day video lock period

-- Function to check if video can be deleted (20 days after first upload)
CREATE OR REPLACE FUNCTION public.can_delete_video(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    first_upload_date TIMESTAMP WITH TIME ZONE;
    days_since_upload INTEGER;
BEGIN
    -- Get the first video upload date for the user
    SELECT first_video_uploaded_at INTO first_upload_date
    FROM public.profiles
    WHERE auth_id = user_id;
    
    -- If no first upload date, allow deletion (no video was ever uploaded)
    IF first_upload_date IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Calculate days since first upload
    days_since_upload := EXTRACT(DAY FROM (NOW() - first_upload_date));
    
    -- Allow deletion if 20 days have passed
    RETURN days_since_upload >= 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining lock days
CREATE OR REPLACE FUNCTION public.get_video_lock_remaining_days(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    first_upload_date TIMESTAMP WITH TIME ZONE;
    days_since_upload INTEGER;
    remaining_days INTEGER;
BEGIN
    -- Get the first video upload date for the user
    SELECT first_video_uploaded_at INTO first_upload_date
    FROM public.profiles
    WHERE auth_id = user_id;
    
    -- If no first upload date, return 0 (no lock)
    IF first_upload_date IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate days since first upload
    days_since_upload := EXTRACT(DAY FROM (NOW() - first_upload_date));
    
    -- Calculate remaining days (max 20, minimum 0)
    remaining_days := GREATEST(0, 20 - days_since_upload);
    
    RETURN remaining_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if video is locked
CREATE OR REPLACE FUNCTION public.is_video_locked(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT public.can_delete_video(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing trigger function to handle video replacement
CREATE OR REPLACE FUNCTION public.set_first_video_uploaded_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set first_video_uploaded_at if it's null and we're setting a video URL
    IF NEW.intro_video_url IS NOT NULL AND OLD.intro_video_url IS NULL AND NEW.first_video_uploaded_at IS NULL THEN
        NEW.first_video_uploaded_at = NOW();
    END IF;
    
    -- If user is replacing video (old URL exists, new URL exists), keep the original first_video_uploaded_at
    -- This ensures the 20-day lock period continues from the first upload, not from each replacement
    IF NEW.intro_video_url IS NOT NULL AND OLD.intro_video_url IS NOT NULL THEN
        NEW.first_video_uploaded_at = OLD.first_video_uploaded_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a policy to prevent video deletion during lock period
-- This will be enforced at the application level, but we can also add a database constraint

-- Add a comment to update the existing column description
COMMENT ON COLUMN public.profiles.first_video_uploaded_at IS 'Timestamp of when the user first uploaded a video. Used for 20-day deletion restriction. Users can replace videos but cannot delete them until 20 days have passed.'; 
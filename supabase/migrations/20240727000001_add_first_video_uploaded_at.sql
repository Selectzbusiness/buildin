-- Add first_video_uploaded_at column to track when user first uploaded a video
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_video_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_video_uploaded_at 
ON public.profiles USING btree (first_video_uploaded_at) 
TABLESPACE pg_default;

-- Create a function to safely update the first_video_uploaded_at only if it's null
CREATE OR REPLACE FUNCTION public.set_first_video_uploaded_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set first_video_uploaded_at if it's null and we're setting a video URL
    IF NEW.intro_video_url IS NOT NULL AND OLD.intro_video_url IS NULL AND NEW.first_video_uploaded_at IS NULL THEN
        NEW.first_video_uploaded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function before update
CREATE TRIGGER set_first_video_uploaded_at_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.intro_video_url IS DISTINCT FROM OLD.intro_video_url)
EXECUTE FUNCTION public.set_first_video_uploaded_at();

-- Add comment to the column
COMMENT ON COLUMN public.profiles.first_video_uploaded_at IS 'Timestamp of when the user first uploaded a video. Used for 30-day deletion restriction.';

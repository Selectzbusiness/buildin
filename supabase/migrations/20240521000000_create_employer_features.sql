-- Create employer_credits table
CREATE TABLE IF NOT EXISTS employer_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    credits_balance INTEGER DEFAULT 0 NOT NULL,
    total_purchased INTEGER DEFAULT 0 NOT NULL,
    total_used INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(employer_id)
);

-- Create employer_saved_videos table
CREATE TABLE IF NOT EXISTS employer_saved_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(employer_id, job_seeker_id)
);

-- Create employer_profile_views table (for tracking who viewed what)
CREATE TABLE IF NOT EXISTS employer_profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    credits_used INTEGER DEFAULT 1 NOT NULL,
    UNIQUE(employer_id, job_seeker_id)
);

-- Enable RLS on all tables
ALTER TABLE employer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_saved_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employer_credits
CREATE POLICY "Employers can view their own credits"
    ON employer_credits FOR SELECT
    USING (employer_id = auth.uid());

CREATE POLICY "Employers can update their own credits"
    ON employer_credits FOR UPDATE
    USING (employer_id = auth.uid());

CREATE POLICY "Employers can insert their own credits"
    ON employer_credits FOR INSERT
    WITH CHECK (employer_id = auth.uid());

-- RLS Policies for employer_saved_videos
CREATE POLICY "Employers can view their saved videos"
    ON employer_saved_videos FOR SELECT
    USING (employer_id = auth.uid());

CREATE POLICY "Employers can save videos"
    ON employer_saved_videos FOR INSERT
    WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Employers can delete their saved videos"
    ON employer_saved_videos FOR DELETE
    USING (employer_id = auth.uid());

-- RLS Policies for employer_profile_views
CREATE POLICY "Employers can view their profile view history"
    ON employer_profile_views FOR SELECT
    USING (employer_id = auth.uid());

CREATE POLICY "Employers can insert profile views"
    ON employer_profile_views FOR INSERT
    WITH CHECK (employer_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS employer_credits_employer_id_idx ON employer_credits(employer_id);
CREATE INDEX IF NOT EXISTS employer_saved_videos_employer_id_idx ON employer_saved_videos(employer_id);
CREATE INDEX IF NOT EXISTS employer_saved_videos_job_seeker_id_idx ON employer_saved_videos(job_seeker_id);
CREATE INDEX IF NOT EXISTS employer_profile_views_employer_id_idx ON employer_profile_views(employer_id);
CREATE INDEX IF NOT EXISTS employer_profile_views_job_seeker_id_idx ON employer_profile_views(job_seeker_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employer_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for employer_credits
CREATE TRIGGER update_employer_credits_updated_at
    BEFORE UPDATE ON employer_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_employer_credits_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.employer_credits TO postgres, authenticated, service_role;
GRANT ALL ON public.employer_saved_videos TO postgres, authenticated, service_role;
GRANT ALL ON public.employer_profile_views TO postgres, authenticated, service_role; 
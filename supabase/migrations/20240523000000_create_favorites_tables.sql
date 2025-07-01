-- Create job_favorites table
CREATE TABLE IF NOT EXISTS job_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, job_id)
);

-- Create internship_favorites table
CREATE TABLE IF NOT EXISTS internship_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    internship_id UUID REFERENCES internships(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, internship_id)
);

-- Enable RLS on both tables
ALTER TABLE job_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_favorites
CREATE POLICY "Users can view their own job favorites"
    ON job_favorites FOR SELECT
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

CREATE POLICY "Users can create their own job favorites"
    ON job_favorites FOR INSERT
    WITH CHECK (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

CREATE POLICY "Users can delete their own job favorites"
    ON job_favorites FOR DELETE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

-- RLS Policies for internship_favorites
CREATE POLICY "Users can view their own internship favorites"
    ON internship_favorites FOR SELECT
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

CREATE POLICY "Users can create their own internship favorites"
    ON internship_favorites FOR INSERT
    WITH CHECK (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

CREATE POLICY "Users can delete their own internship favorites"
    ON internship_favorites FOR DELETE
    USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = user_id));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS job_favorites_user_id_idx ON job_favorites(user_id);
CREATE INDEX IF NOT EXISTS job_favorites_job_id_idx ON job_favorites(job_id);
CREATE INDEX IF NOT EXISTS internship_favorites_user_id_idx ON internship_favorites(user_id);
CREATE INDEX IF NOT EXISTS internship_favorites_internship_id_idx ON internship_favorites(internship_id);

-- Grant necessary permissions
GRANT ALL ON public.job_favorites TO postgres, authenticated, service_role;
GRANT ALL ON public.internship_favorites TO postgres, authenticated, service_role; 
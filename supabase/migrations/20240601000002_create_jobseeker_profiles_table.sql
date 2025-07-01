-- Create jobseeker_profiles table with all profile fields
CREATE TABLE IF NOT EXISTS jobseeker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    location TEXT,
    
    -- Professional Information
    title TEXT,
    experience TEXT,
    summary TEXT,
    
    -- Social Links
    linkedin TEXT,
    github TEXT,
    portfolio TEXT,
    website TEXT,
    twitter TEXT,
    
    -- Additional Information
    date_of_birth TEXT,
    bio TEXT,
    preferred_work_type TEXT,
    salary_expectation TEXT,
    availability TEXT,
    
    -- Arrays/JSONB Fields
    skills JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    work_experience JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    social_links JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE jobseeker_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Jobseeker profiles are viewable by everyone"
    ON jobseeker_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own jobseeker profile"
    ON jobseeker_profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own jobseeker profile"
    ON jobseeker_profiles FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own jobseeker profile"
    ON jobseeker_profiles FOR DELETE
    USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_jobseeker_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_jobseeker_profiles_updated_at
    BEFORE UPDATE ON jobseeker_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_jobseeker_profiles_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS jobseeker_profiles_user_id_idx ON jobseeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_full_name_idx ON jobseeker_profiles(full_name);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_title_idx ON jobseeker_profiles(title);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_location_idx ON jobseeker_profiles(location);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_created_at_idx ON jobseeker_profiles(created_at);

-- Create GIN indexes for JSONB fields for better query performance
CREATE INDEX IF NOT EXISTS jobseeker_profiles_skills_idx ON jobseeker_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_education_idx ON jobseeker_profiles USING GIN(education);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_work_experience_idx ON jobseeker_profiles USING GIN(work_experience);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_languages_idx ON jobseeker_profiles USING GIN(languages);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_certifications_idx ON jobseeker_profiles USING GIN(certifications);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_projects_idx ON jobseeker_profiles USING GIN(projects);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_achievements_idx ON jobseeker_profiles USING GIN(achievements);
CREATE INDEX IF NOT EXISTS jobseeker_profiles_social_links_idx ON jobseeker_profiles USING GIN(social_links);

-- Grant necessary permissions
GRANT ALL ON public.jobseeker_profiles TO postgres, authenticated, service_role;

-- Add comments for documentation
COMMENT ON TABLE jobseeker_profiles IS 'Comprehensive jobseeker profile information including personal details, work experience, education, skills, and social links';
COMMENT ON COLUMN jobseeker_profiles.skills IS 'Array of skill objects: [{"name": "Java"}, {"name": "Python"}]';
COMMENT ON COLUMN jobseeker_profiles.education IS 'Array of education objects: [{"degree": "B.Tech", "institution": "IIT", "year": "2022", "field": "CS"}]';
COMMENT ON COLUMN jobseeker_profiles.work_experience IS 'Array of work experience objects with company, position, dates, description, achievements, and technologies';
COMMENT ON COLUMN jobseeker_profiles.languages IS 'Array of language strings: ["English", "Hindi"]';
COMMENT ON COLUMN jobseeker_profiles.certifications IS 'Array of certification objects: [{"name": "AWS", "issuer": "Amazon", "date": "2023", "url": "..."}]';
COMMENT ON COLUMN jobseeker_profiles.projects IS 'Array of project objects: [{"name": "Project", "description": "...", "url": "...", "technologies": ["React", "Node"]}]';
COMMENT ON COLUMN jobseeker_profiles.achievements IS 'Array of achievement strings: ["Award 1", "Award 2"]';
COMMENT ON COLUMN jobseeker_profiles.social_links IS 'Array of social link objects: [{"platform": "LinkedIn", "url": "..."}]'; 
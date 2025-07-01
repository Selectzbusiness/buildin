-- REVERT TO PROFILES TABLE
-- This script deletes the jobseeker_profiles table and adds missing fields to the existing profiles table

-- Step 1: Drop the jobseeker_profiles table and its dependencies
DROP TABLE IF EXISTS jobseeker_profiles CASCADE;

-- Step 2: Add missing fields to the existing profiles table
-- These fields will support the LinkedIn-style experience section

-- Add work_experience field (JSONB array for detailed work history)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]';

-- Add languages field (TEXT array for language proficiencies) - keep as TEXT[] to match existing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- Add certifications field (JSONB array for professional certifications)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';

-- Add projects field (JSONB array for portfolio projects)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]';

-- Add achievements field (JSONB array for awards and accomplishments)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]';

-- Add social_links field (JSONB array for professional social links)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]';

-- Add personal information fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_work_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary_expectation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability TEXT;

-- Add additional social media fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter TEXT;

-- Step 3: Create GIN indexes for JSONB fields for better query performance
CREATE INDEX IF NOT EXISTS profiles_work_experience_idx ON profiles USING GIN(work_experience);
CREATE INDEX IF NOT EXISTS profiles_certifications_idx ON profiles USING GIN(certifications);
CREATE INDEX IF NOT EXISTS profiles_projects_idx ON profiles USING GIN(projects);
CREATE INDEX IF NOT EXISTS profiles_achievements_idx ON profiles USING GIN(achievements);
CREATE INDEX IF NOT EXISTS profiles_social_links_idx ON profiles USING GIN(social_links);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN profiles.work_experience IS 'Array of work experience objects: [{"company": "Company", "position": "Position", "location": "Location", "start_date": "2020-01", "end_date": "2023-01", "current": false, "description": "...", "achievements": ["Achievement 1"], "technologies": ["React", "Node.js"]}]';
COMMENT ON COLUMN profiles.education IS 'Array of education objects: [{"degree": "B.Tech", "institution": "IIT", "year": "2022", "field": "CS"}]';
COMMENT ON COLUMN profiles.skills IS 'Array of skill objects: [{"name": "Java"}, {"name": "Python"}]';
COMMENT ON COLUMN profiles.languages IS 'Array of language strings: ["English", "Hindi"]';
COMMENT ON COLUMN profiles.certifications IS 'Array of certification objects: [{"name": "AWS", "issuer": "Amazon", "date": "2023", "url": "..."}]';
COMMENT ON COLUMN profiles.projects IS 'Array of project objects: [{"name": "Project", "description": "...", "url": "...", "technologies": ["React", "Node"]}]';
COMMENT ON COLUMN profiles.achievements IS 'Array of achievement strings: ["Award 1", "Award 2"]';
COMMENT ON COLUMN profiles.social_links IS 'Array of social link objects: [{"platform": "LinkedIn", "url": "..."}]';

-- Step 5: Update any existing profiles with sample data (optional)
-- This will add sample work experience to existing profiles for testing
UPDATE profiles 
SET work_experience = '[
  {
    "company": "Sample Company",
    "position": "Software Developer",
    "location": "Remote",
    "start_date": "2022-01",
    "end_date": "2023-12",
    "current": false,
    "description": "Developed web applications using React and Node.js",
    "achievements": ["Improved performance by 50%", "Led team of 3 developers"],
    "technologies": ["React", "Node.js", "PostgreSQL"]
  }
]'::jsonb
WHERE work_experience IS NULL OR work_experience = '[]'::jsonb;

-- Add sample education if not exists
UPDATE profiles 
SET education = '[
  {
    "degree": "Bachelor of Technology",
    "institution": "Sample University",
    "year": "2022",
    "field": "Computer Science"
  }
]'::jsonb
WHERE education IS NULL OR education = '[]'::jsonb;

-- Add sample skills if not exists
UPDATE profiles 
SET skills = '[
  {"name": "JavaScript"},
  {"name": "React"},
  {"name": "Node.js"},
  {"name": "PostgreSQL"}
]'::jsonb
WHERE skills IS NULL OR skills = '[]'::jsonb;

-- Add sample languages if not exists (using TEXT[] syntax)
UPDATE profiles 
SET languages = ARRAY['English', 'Hindi']
WHERE languages IS NULL OR languages = '{}';

-- Add sample social links if not exists
UPDATE profiles 
SET social_links = '[
  {"platform": "LinkedIn", "url": "https://linkedin.com/in/sample"},
  {"platform": "GitHub", "url": "https://github.com/sample"}
]'::jsonb
WHERE social_links IS NULL OR social_links = '[]'::jsonb;

-- Step 6: Show the final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    CASE 
        WHEN data_type = 'jsonb' THEN 'JSONB Array'
        WHEN data_type = 'ARRAY' THEN 'TEXT Array'
        ELSE data_type 
    END as description
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position; 
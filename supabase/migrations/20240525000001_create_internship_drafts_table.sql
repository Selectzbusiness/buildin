-- Create internship_drafts table for storing draft internship postings
CREATE TABLE IF NOT EXISTS internship_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Internship Details (Step 1)
    internship_title TEXT,
    internship_description TEXT,
    internship_type TEXT CHECK (internship_type IN ('onsite', 'remote', 'hybrid')),
    city TEXT,
    area TEXT,
    pincode TEXT,
    street_address TEXT,
    
    -- Duration & Schedule (Step 2)
    duration_months INTEGER, -- 1, 2, 3, 6, 12 months
    custom_duration TEXT,
    start_date DATE,
    end_date DATE,
    flexible_start BOOLEAN DEFAULT FALSE,
    work_schedule TEXT[], -- Full-time, Part-time, Flexible
    hours_per_week INTEGER,
    custom_hours TEXT,
    
    -- Compensation & Benefits (Step 3)
    stipend_type TEXT CHECK (stipend_type IN ('paid', 'unpaid', 'performance_based', 'academic_credit')),
    stipend_amount DECIMAL(12,2),
    stipend_frequency TEXT CHECK (stipend_frequency IN ('monthly', 'weekly', 'one_time', 'project_based')),
    academic_credit_available BOOLEAN DEFAULT FALSE,
    academic_credit_details TEXT,
    benefits TEXT[], -- Array of benefits
    custom_benefits TEXT,
    travel_allowance BOOLEAN DEFAULT FALSE,
    travel_allowance_amount DECIMAL(12,2),
    
    -- Requirements & Eligibility (Step 4)
    education_level TEXT, -- High School, Undergraduate, Graduate, PhD
    current_year TEXT[], -- 1st year, 2nd year, 3rd year, 4th year, Graduate
    minimum_gpa DECIMAL(3,2),
    gpa_required BOOLEAN DEFAULT FALSE,
    academic_background TEXT[], -- Computer Science, Engineering, Business, etc.
    custom_academic_background TEXT,
    experience_level TEXT CHECK (experience_level IN ('no_experience', 'beginner', 'intermediate', 'advanced')),
    skills_required TEXT[], -- Array of required skills
    custom_skills TEXT,
    languages TEXT[], -- Array of languages
    custom_language TEXT,
    
    -- Learning & Development (Step 5)
    learning_objectives TEXT,
    mentorship_available BOOLEAN DEFAULT FALSE,
    mentorship_details TEXT,
    training_provided BOOLEAN DEFAULT FALSE,
    training_details TEXT,
    project_based BOOLEAN DEFAULT FALSE,
    project_details TEXT,
    career_development BOOLEAN DEFAULT FALSE,
    career_development_details TEXT,
    
    -- Application & Process (Step 6)
    application_deadline DATE,
    application_process TEXT,
    required_documents TEXT[], -- Resume, Cover Letter, Portfolio, Transcript, etc.
    custom_required_documents TEXT,
    interview_process TEXT,
    notification_email TEXT,
    
    -- Draft metadata
    draft_name TEXT, -- User can name their draft
    current_step INTEGER DEFAULT 0, -- Track which step they were on
    is_complete BOOLEAN DEFAULT FALSE, -- Whether all required fields are filled
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Constraints
    CONSTRAINT valid_internship_email CHECK (notification_email IS NULL OR notification_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_internship_pincode CHECK (pincode IS NULL OR pincode ~ '^[0-9]{6}$'),
    CONSTRAINT valid_internship_duration CHECK (duration_months IS NULL OR duration_months > 0),
    CONSTRAINT valid_internship_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
    CONSTRAINT valid_internship_deadline CHECK (application_deadline IS NULL OR application_deadline > NOW()),
    CONSTRAINT valid_internship_gpa CHECK (minimum_gpa IS NULL OR (minimum_gpa >= 0 AND minimum_gpa <= 4.0))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_internship_drafts_user_id ON internship_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_internship_drafts_company_id ON internship_drafts(company_id);
CREATE INDEX IF NOT EXISTS idx_internship_drafts_expires_at ON internship_drafts(expires_at);
CREATE INDEX IF NOT EXISTS idx_internship_drafts_created_at ON internship_drafts(created_at);

-- Create function to auto-delete expired internship drafts
CREATE OR REPLACE FUNCTION delete_expired_internship_drafts()
RETURNS void AS $$
BEGIN
    DELETE FROM internship_drafts WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to check internship draft count per user
CREATE OR REPLACE FUNCTION check_internship_draft_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already has 5 internship drafts
    IF (SELECT COUNT(*) FROM internship_drafts WHERE user_id = NEW.user_id) >= 5 THEN
        RAISE EXCEPTION 'Maximum 5 internship drafts allowed per user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce internship draft limit
CREATE TRIGGER enforce_internship_draft_limit
    BEFORE INSERT ON internship_drafts
    FOR EACH ROW
    EXECUTE FUNCTION check_internship_draft_limit();

-- Create function to update updated_at timestamp for internship drafts
CREATE OR REPLACE FUNCTION update_internship_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at for internship drafts
CREATE TRIGGER update_internship_drafts_updated_at
    BEFORE UPDATE ON internship_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_internship_drafts_updated_at();

-- Create RLS policies for internship drafts
ALTER TABLE internship_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own internship drafts
CREATE POLICY "Users can view own internship drafts" ON internship_drafts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own internship drafts
CREATE POLICY "Users can create own internship drafts" ON internship_drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own internship drafts
CREATE POLICY "Users can update own internship drafts" ON internship_drafts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own internship drafts
CREATE POLICY "Users can delete own internship drafts" ON internship_drafts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON internship_drafts TO authenticated; 
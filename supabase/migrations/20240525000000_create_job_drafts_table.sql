-- Create job_drafts table for storing draft job postings
CREATE TABLE IF NOT EXISTS job_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Job Details (Step 1)
    job_title TEXT,
    job_title_description TEXT,
    job_type TEXT CHECK (job_type IN ('onsite', 'remote', 'hybrid')),
    city TEXT,
    area TEXT,
    pincode TEXT,
    street_address TEXT,
    
    -- Employment & Schedule (Step 2)
    employment_types TEXT[], -- Array of employment types
    schedules TEXT[], -- Array of schedules
    custom_schedule TEXT,
    has_planned_start_date BOOLEAN DEFAULT FALSE,
    planned_start_date DATE,
    number_of_hires TEXT,
    custom_number_of_hires TEXT,
    recruitment_timeline TEXT,
    
    -- Compensation (Step 3)
    pay_type TEXT,
    min_pay DECIMAL(12,2),
    max_pay DECIMAL(12,2),
    pay_rate TEXT,
    supplemental_pay TEXT[], -- Array of supplemental pay types
    custom_supplemental_pay TEXT,
    benefits TEXT[], -- Array of benefits
    custom_benefits TEXT,
    
    -- Requirements (Step 4)
    education TEXT,
    language TEXT[], -- Array of languages
    custom_language TEXT,
    experience TEXT,
    industries TEXT[], -- Array of industries
    custom_industry TEXT,
    age TEXT,
    gender TEXT,
    skills TEXT[], -- Array of skills
    custom_skills TEXT,
    job_profile_description TEXT,
    notification_emails TEXT,
    application_deadline DATE,
    
    -- Draft metadata
    draft_name TEXT, -- User can name their draft
    current_step INTEGER DEFAULT 0, -- Track which step they were on
    is_complete BOOLEAN DEFAULT FALSE, -- Whether all required fields are filled
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (notification_emails IS NULL OR notification_emails ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_pincode CHECK (pincode IS NULL OR pincode ~ '^[0-9]{6}$'),
    CONSTRAINT valid_pay_range CHECK (min_pay IS NULL OR max_pay IS NULL OR min_pay <= max_pay),
    CONSTRAINT valid_deadline CHECK (application_deadline IS NULL OR application_deadline > NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_drafts_user_id ON job_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_job_drafts_company_id ON job_drafts(company_id);
CREATE INDEX IF NOT EXISTS idx_job_drafts_expires_at ON job_drafts(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_drafts_created_at ON job_drafts(created_at);

-- Create function to auto-delete expired drafts
CREATE OR REPLACE FUNCTION delete_expired_drafts()
RETURNS void AS $$
BEGIN
    DELETE FROM job_drafts WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run every day at 2 AM to delete expired drafts
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('delete-expired-drafts', '0 2 * * *', 'SELECT delete_expired_drafts();');

-- Create function to check draft count per user
CREATE OR REPLACE FUNCTION check_draft_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already has 5 drafts
    IF (SELECT COUNT(*) FROM job_drafts WHERE user_id = NEW.user_id) >= 5 THEN
        RAISE EXCEPTION 'Maximum 5 drafts allowed per user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce draft limit
CREATE TRIGGER enforce_draft_limit
    BEFORE INSERT ON job_drafts
    FOR EACH ROW
    EXECUTE FUNCTION check_draft_limit();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_job_drafts_updated_at
    BEFORE UPDATE ON job_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE job_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own drafts
CREATE POLICY "Users can view own drafts" ON job_drafts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own drafts
CREATE POLICY "Users can create own drafts" ON job_drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own drafts
CREATE POLICY "Users can update own drafts" ON job_drafts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own drafts
CREATE POLICY "Users can delete own drafts" ON job_drafts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions (removed the sequence grant since we use UUID)
GRANT ALL ON job_drafts TO authenticated; 
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, service_role;

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'jobseeker',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "User profiles are viewable by everyone"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth_id = auth.uid());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (auth_id, full_name, email, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'jobseeker')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO postgres, authenticated, service_role;
GRANT ALL ON public.user_profiles_id_seq TO postgres, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, service_role;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    size TEXT,
    location TEXT,
    website TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Companies are viewable by everyone"
    ON companies FOR SELECT
    USING (true);

CREATE POLICY "Companies can be created by authenticated users"
    ON companies FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Companies can be updated by their owners"
    ON companies FOR UPDATE
    USING (auth_id = auth.uid());

CREATE POLICY "Companies can be deleted by their owners"
    ON companies FOR DELETE
    USING (auth_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON public.companies TO postgres, authenticated, service_role;
GRANT ALL ON public.companies_id_seq TO postgres, authenticated, service_role;

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    job_type TEXT NOT NULL,
    location JSONB NOT NULL,
    employment_types TEXT[] NOT NULL,
    schedules TEXT[] NOT NULL,
    custom_schedule TEXT,
    planned_start_date DATE,
    number_of_hires TEXT NOT NULL,
    recruitment_timeline TEXT NOT NULL,
    pay_type TEXT NOT NULL,
    min_amount DECIMAL,
    max_amount DECIMAL,
    amount DECIMAL,
    pay_rate TEXT,
    supplemental_pay TEXT[],
    custom_supplemental_pay TEXT,
    benefits TEXT[],
    custom_benefit TEXT,
    minimum_education TEXT NOT NULL,
    language_requirement TEXT NOT NULL,
    experience_type TEXT NOT NULL,
    minimum_experience TEXT NOT NULL,
    industries TEXT[] NOT NULL,
    min_age INTEGER,
    max_age INTEGER,
    gender TEXT NOT NULL,
    skills TEXT[],
    job_profile_description TEXT,
    notification_emails TEXT[],
    send_individual_emails BOOLEAN DEFAULT false,
    require_resume BOOLEAN DEFAULT true,
    allow_candidate_contact BOOLEAN DEFAULT false,
    application_deadline DATE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create internships table
CREATE TABLE IF NOT EXISTS internships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    duration TEXT NOT NULL,
    stipend TEXT NOT NULL,
    requirements TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    responsibilities TEXT,
    perks TEXT[] DEFAULT '{}',
    application_deadline DATE,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Jobs are viewable by everyone"
    ON jobs FOR SELECT
    USING (true);

CREATE POLICY "Jobs can be created by authenticated users"
    ON jobs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Jobs can be updated by company owners"
    ON jobs FOR UPDATE
    USING (
        company_id IN (
            SELECT id FROM companies
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Jobs can be deleted by company owners"
    ON jobs FOR DELETE
    USING (
        company_id IN (
            SELECT id FROM companies
            WHERE auth_id = auth.uid()
        )
    );

-- Internships policies
CREATE POLICY "Internships are viewable by everyone"
    ON internships FOR SELECT
    USING (true);

CREATE POLICY "Internships can be created by authenticated users"
    ON internships FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Internships can be updated by company owners"
    ON internships FOR UPDATE
    USING (
        company_id IN (
            SELECT id FROM companies
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Internships can be deleted by company owners"
    ON internships FOR DELETE
    USING (
        company_id IN (
            SELECT id FROM companies
            WHERE auth_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX jobs_company_id_idx ON jobs(company_id);
CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_created_at_idx ON jobs(created_at);

CREATE INDEX internships_company_id_idx ON internships(company_id);
CREATE INDEX internships_status_idx ON internships(status);
CREATE INDEX internships_created_at_idx ON internships(created_at);

-- Grant necessary permissions
GRANT ALL ON public.jobs TO postgres, authenticated, service_role;
GRANT ALL ON public.jobs_id_seq TO postgres, authenticated, service_role;
GRANT ALL ON public.internships TO postgres, authenticated, service_role;
GRANT ALL ON public.internships_id_seq TO postgres, authenticated, service_role; 
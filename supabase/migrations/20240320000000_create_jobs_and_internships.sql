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
  id uuid not null default gen_random_uuid (),
  auth_id uuid null,
  name text null,
  logo_url text null,
  created_at timestamp with time zone null default now(),
  description text null,
  industry text null,
  size text null,
  location text null,
  website text null,
  updated_at timestamp with time zone null default now(),
  founded_year integer null,
  company_type character varying(100) null,
  social_links jsonb null,
  culture text null,
  benefits text null,
  bio text null,
  constraint companies_pkey1 primary key (id),
  constraint unique_auth_id unique (auth_id),
  constraint companies_auth_id_fkey1 foreign KEY (auth_id) references users (id)
) TABLESPACE pg_default;

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
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text null,
  job_type text null,
  location jsonb null,
  pay_type text null,
  min_amount numeric null,
  max_amount numeric null,
  amount numeric null,
  pay_rate text null,
  status text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  company_id uuid null,
  requirements text null,
  experience_level text null,
  allow_candidate_contact boolean null default false,
  application_deadline date null,
  benefits text[] null,
  custom_benefit text null,
  custom_schedule text null,
  custom_supplemental_pay text null,
  employment_types text[] null,
  experience_type text null,
  gender text null,
  industries text[] null,
  job_profile_description text null,
  language_requirement text null,
  max_age integer null,
  min_age integer null,
  minimum_education text null,
  minimum_experience integer null,
  notification_emails text[] null,
  number_of_hires integer null,
  planned_start_date date null,
  recruitment_timeline text null,
  require_resume boolean null default false,
  schedules text[] null,
  send_individual_emails boolean null default false,
  skills text[] null,
  supplemental_pay text[] null,
  employer_org_id uuid null,
  resume_required boolean not null default false,
  video_required boolean not null default false,
  openings integer null default 1,
  applicants integer null default 0,
  constraint jobs_pkey primary key (id),
  constraint jobs_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create internships table
CREATE TABLE IF NOT EXISTS internships (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  title text not null,
  description text not null,
  type text not null,
  location jsonb not null,
  duration text not null,
  stipend jsonb not null,
  requirements text[] null default '{}'::text[],
  skills text[] null default '{}'::text[],
  responsibilities text[] null default '{}'::text[],
  perks text[] null default '{}'::text[],
  application_deadline timestamp with time zone null,
  start_date timestamp with time zone null,
  end_date timestamp with time zone null,
  status text not null default 'active'::text,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint internships_pkey primary key (id),
  constraint internships_company_id_fkey foreign KEY (company_id) references companies (id) on delete CASCADE
) TABLESPACE pg_default;

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
-- Add custom questions fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- Add custom questions fields to internships table  
ALTER TABLE public.internships 
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- Update applications table to include resume, video, and answers
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update internship_applications table to include answers
ALTER TABLE public.internship_applications 
ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_job_seeker_id ON public.applications(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON public.applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_internship_applications_job_seeker_id ON public.internship_applications(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_applied_at ON public.internship_applications(applied_at); 
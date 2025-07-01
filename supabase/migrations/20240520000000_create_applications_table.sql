-- Create the applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  job_seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' -- e.g., submitted, viewed, shortlisted, rejected
);

-- RLS Policies for applications table
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Allow job seekers to create applications for themselves
CREATE POLICY "Job seekers can create their own applications"
ON public.applications FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_id FROM profiles WHERE id = job_seeker_id));

-- Allow job seekers to view their own applications
CREATE POLICY "Job seekers can view their own applications"
ON public.applications FOR SELECT
USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = job_seeker_id));

-- Allow employers to view applications for their jobs (via company relationship)
CREATE POLICY "Employers can view applications for their jobs"
ON public.applications FOR SELECT
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE c.auth_id = auth.uid()
  )
);

-- Allow employers to update the status of applications for their jobs
CREATE POLICY "Employers can update application status for their jobs"
ON public.applications FOR UPDATE
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE c.auth_id = auth.uid()
  )
)
WITH CHECK (
  job_id IN (
    SELECT j.id FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE c.auth_id = auth.uid()
  )
); 
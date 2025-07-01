-- Create the internship_applications table
CREATE TABLE IF NOT EXISTS public.internship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE NOT NULL,
  job_seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'pending', 'reviewed', 'shortlisted', 'rejected', 'accepted', 'withdrawn')),
  resume_url TEXT,
  video_url TEXT,
  cover_letter TEXT,
  additional_notes TEXT
);

-- RLS Policies for internship_applications table
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

-- Allow job seekers to create applications for themselves
CREATE POLICY "Job seekers can create their own internship applications"
ON public.internship_applications FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_id FROM profiles WHERE id = job_seeker_id));

-- Allow job seekers to view their own internship applications
CREATE POLICY "Job seekers can view their own internship applications"
ON public.internship_applications FOR SELECT
USING (auth.uid() = (SELECT auth_id FROM profiles WHERE id = job_seeker_id));

-- Allow employers to view internship applications for their internships (via company relationship)
CREATE POLICY "Employers can view internship applications for their internships"
ON public.internship_applications FOR SELECT
USING (
  internship_id IN (
    SELECT i.id FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE c.auth_id = auth.uid()
  )
);

-- Allow employers to update the status of internship applications for their internships
CREATE POLICY "Employers can update internship application status for their internships"
ON public.internship_applications FOR UPDATE
USING (
  internship_id IN (
    SELECT i.id FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE c.auth_id = auth.uid()
  )
)
WITH CHECK (
  internship_id IN (
    SELECT i.id FROM internships i
    JOIN companies c ON i.company_id = c.id
    WHERE c.auth_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS internship_applications_internship_id_idx ON public.internship_applications(internship_id);
CREATE INDEX IF NOT EXISTS internship_applications_job_seeker_id_idx ON public.internship_applications(job_seeker_id);
CREATE INDEX IF NOT EXISTS internship_applications_status_idx ON public.internship_applications(status);
CREATE INDEX IF NOT EXISTS internship_applications_applied_at_idx ON public.internship_applications(applied_at); 
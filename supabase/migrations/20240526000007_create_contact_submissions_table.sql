-- Create contact_submissions table for storing contact form messages
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create contact submissions (public form)
CREATE POLICY "Anyone can create contact submissions"
ON public.contact_submissions FOR INSERT
WITH CHECK (true);

-- Allow admins to view all contact submissions
CREATE POLICY "Admins can view all contact submissions"
ON public.contact_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update contact submissions
CREATE POLICY "Admins can update contact submissions"
ON public.contact_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS contact_submissions_status_idx ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS contact_submissions_priority_idx ON public.contact_submissions(priority);
CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx ON public.contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS contact_submissions_assigned_to_idx ON public.contact_submissions(assigned_to);

-- Grant necessary permissions
GRANT ALL ON public.contact_submissions TO postgres, authenticated, service_role; 
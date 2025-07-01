-- Fix the applications status check constraint to allow all valid status values
-- First, drop the existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_status_check' 
        AND table_name = 'applications'
    ) THEN
        ALTER TABLE public.applications DROP CONSTRAINT applications_status_check;
    END IF;
END $$;

-- Add a new check constraint that allows all the status values we use
ALTER TABLE public.applications 
ADD CONSTRAINT applications_status_check 
CHECK (status IN ('submitted', 'pending', 'reviewed', 'shortlisted', 'rejected', 'accepted', 'withdrawn', 'New'));

-- Update any existing applications with invalid status to 'submitted'
UPDATE public.applications 
SET status = 'submitted' 
WHERE status NOT IN ('submitted', 'pending', 'reviewed', 'shortlisted', 'rejected', 'accepted', 'withdrawn', 'New'); 
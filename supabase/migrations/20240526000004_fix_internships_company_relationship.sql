-- Fix internships table to add missing company_id foreign key
-- First check if company_id column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'internships' 
        AND column_name = 'company_id'
    ) THEN
        -- Add company_id column
        ALTER TABLE public.internships 
        ADD COLUMN company_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE public.internships 
        ADD CONSTRAINT internships_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS internships_company_id_idx ON public.internships(company_id);
    END IF;
END $$;

-- If company_id column exists but foreign key constraint is missing, add it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'internships' 
        AND column_name = 'company_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'internships' 
        AND constraint_name = 'internships_company_id_fkey'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE public.internships 
        ADD CONSTRAINT internships_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS internships_company_id_idx ON public.internships(company_id);
    END IF;
END $$; 
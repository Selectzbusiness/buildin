-- Check existing company data
SELECT id, name, industry, location FROM companies WHERE id = 'd215e89a-aac5-47cc-a43c-2b1766094e4c';

-- Check if there are existing jobs for this company
SELECT COUNT(*) as existing_jobs_count FROM jobs WHERE company_id = 'd215e89a-aac5-47cc-a43c-2b1766094e4c';

-- Show existing jobs if any
SELECT id, title, location, min_amount, max_amount, status FROM jobs WHERE company_id = 'd215e89a-aac5-47cc-a43c-2b1766094e4c'; 
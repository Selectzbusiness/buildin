# Supabase Setup for Phase 3 - Employer Reverse Hiring & Credit System

## Overview
This document outlines the Supabase setup required for the employer reverse hiring and credit system features.

## Database Tables

### 1. Run Migrations
Execute these migration files in your Supabase SQL editor:

1. `20240521000000_create_employer_features.sql` - Creates employer credits, saved videos, and profile views tables
2. `20240521000001_create_profile_access_function.sql` - Creates database functions for profile access and credits

### 2. Tables Created

#### `employer_credits`
- Tracks employer credit balance and usage
- Fields: `employer_id`, `credits_balance`, `total_purchased`, `total_used`

#### `employer_saved_videos`
- Tracks videos saved by employers
- Fields: `employer_id`, `job_seeker_id`, `saved_at`

#### `employer_profile_views`
- Tracks which profiles employers have viewed (after credit deduction)
- Fields: `employer_id`, `job_seeker_id`, `viewed_at`, `credits_used`

### 3. Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:
- Employers can only access their own data
- Proper INSERT/UPDATE/DELETE permissions

## Edge Functions

### 1. Deploy Edge Functions
Deploy these functions to your Supabase project:

#### `access_job_seeker_profile`
- **Purpose**: Handles credit deduction and profile access
- **Endpoint**: `/functions/v1/access_job_seeker_profile`
- **Method**: POST
- **Body**: `{ employer_id, job_seeker_id }`

#### `check_profile_access`
- **Purpose**: Checks if employer has access to a profile
- **Endpoint**: `/functions/v1/check_profile_access`
- **Method**: POST
- **Body**: `{ employer_id, job_seeker_id }`

### 2. Deploy Commands
```bash
# Navigate to your project directory
cd job-connect

# Deploy edge functions
supabase functions deploy access_job_seeker_profile
supabase functions deploy check_profile_access
```

## Database Functions

### 1. `check_profile_access(employer_id, job_seeker_id)`
- Returns `BOOLEAN` indicating if employer has access
- Used by frontend to verify access before showing profile

### 2. `get_employer_credits(employer_id)`
- Returns credit balance and usage statistics
- Used by frontend to display credit information

## Storage Setup

### 1. Bucket Configuration
Ensure you have a storage bucket for jobseeker videos:

```sql
-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('jobseeker-videos', 'jobseeker-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for jobseeker videos
CREATE POLICY "Jobseeker videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'jobseeker-videos');

CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'jobseeker-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Environment Variables

### 1. Frontend Configuration
Ensure your frontend has the correct Supabase configuration in `src/config/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 2. Required Environment Variables
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing the Setup

### 1. Test Database Functions
```sql
-- Test profile access function
SELECT check_profile_access('employer-uuid', 'jobseeker-uuid');

-- Test credits function
SELECT * FROM get_employer_credits('employer-uuid');
```

### 2. Test Edge Functions
```bash
# Test access function
curl -X POST https://your-project.supabase.co/functions/v1/access_job_seeker_profile \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"employer_id": "uuid", "job_seeker_id": "uuid"}'

# Test check access function
curl -X POST https://your-project.supabase.co/functions/v1/check_profile_access \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"employer_id": "uuid", "job_seeker_id": "uuid"}'
```

## Features Enabled

After setup, the following features will be available:

1. **Job Seeker Video Reels** (`/employer/reels`)
   - Browse jobseeker videos with search/filter
   - "View Full Profile" with credit confirmation
   - "Save Video" functionality

2. **Saved Videos** (`/employer/saved-videos`)
   - View all saved jobseeker videos
   - Access full profiles of saved videos

3. **Credit Management** (`/employer/credits`)
   - View current credit balance
   - Purchase credits (simulated)
   - View usage history

4. **Full Profile View** (`/employer/job-seeker-profile/:id`)
   - Read-only jobseeker profile display
   - Access controlled by credit system
   - Modern, responsive UI

## Troubleshooting

### Common Issues

1. **Edge Function Not Found**
   - Ensure functions are deployed: `supabase functions deploy function-name`
   - Check function URLs in Supabase dashboard

2. **RLS Policy Errors**
   - Verify RLS is enabled on tables
   - Check policy syntax and permissions

3. **Credit Deduction Fails**
   - Ensure `employer_credits` table exists
   - Check credit balance before deduction

4. **Profile Access Denied**
   - Verify `employer_profile_views` table exists
   - Check if profile was previously unlocked

### Support
For issues with Supabase setup, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

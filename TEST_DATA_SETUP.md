# Test Data Setup for Phase 3 Features

## Overview
This guide helps you set up test data to test the Phase 3 reverse hiring features.

## Step 1: Add Test Jobseeker Profiles

Run this SQL in your Supabase dashboard to add test profiles with videos:

```sql
-- Insert test jobseeker profiles with intro videos
INSERT INTO profiles (auth_id, full_name, title, location, intro_video_url, desired_location, desired_roles, summary, experience, skills, education) VALUES
(
  gen_random_uuid(), -- You'll need to replace this with actual auth IDs
  'Sarah Johnson',
  'Frontend Developer',
  'San Francisco, CA',
  'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', -- Sample video URL
  'Remote, San Francisco, New York',
  ARRAY['Frontend Developer', 'React Developer', 'UI Developer'],
  'Passionate frontend developer with 3+ years of experience building modern web applications. Specialized in React, TypeScript, and responsive design.',
  '3-5 years',
  ARRAY[{"name": "React"}, {"name": "TypeScript"}, {"name": "JavaScript"}, {"name": "CSS"}, {"name": "HTML"}],
  ARRAY[{"degree": "Bachelor of Science", "institution": "Stanford University", "year": "2020", "field": "Computer Science"}]
),
(
  gen_random_uuid(),
  'Michael Chen',
  'Backend Engineer',
  'Seattle, WA',
  'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
  'Seattle, Remote, Austin',
  ARRAY['Backend Engineer', 'Python Developer', 'API Developer'],
  'Experienced backend engineer with expertise in Python, Node.js, and cloud technologies. Built scalable APIs and microservices.',
  '5-7 years',
  ARRAY[{"name": "Python"}, {"name": "Node.js"}, {"name": "PostgreSQL"}, {"name": "AWS"}, {"name": "Docker"}],
  ARRAY[{"degree": "Master of Science", "institution": "University of Washington", "year": "2019", "field": "Software Engineering"}]
),
(
  gen_random_uuid(),
  'Emily Rodriguez',
  'UX Designer',
  'Austin, TX',
  'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
  'Austin, Remote, San Francisco',
  ARRAY['UX Designer', 'Product Designer', 'UI/UX Designer'],
  'Creative UX designer focused on user-centered design principles. Experience with Figma, user research, and design systems.',
  '2-4 years',
  ARRAY[{"name": "Figma"}, {"name": "Sketch"}, {"name": "User Research"}, {"name": "Prototyping"}, {"name": "Design Systems"}],
  ARRAY[{"degree": "Bachelor of Arts", "institution": "University of Texas", "year": "2021", "field": "Design"}]
);
```

## Step 2: Add Test Employer Credits

```sql
-- Add test credits for your employer account (replace with your actual user ID)
INSERT INTO employer_credits (employer_id, credits_balance, total_purchased, total_used) VALUES
(
  'your-employer-user-id-here', -- Replace with your actual user ID
  10, -- Starting credits
  10, -- Total purchased
  0   -- Total used
);
```

## Step 3: Test the Features

### 1. Job Seeker Reels (`/employer/reels`)
- Browse the test jobseeker videos
- Try the search/filter functionality
- Click "View Full Profile" to test credit deduction
- Click "Save Video" to test saving functionality

### 2. Saved Videos (`/employer/saved-videos`)
- View your saved videos
- Test "View Full Profile" for saved videos

### 3. Credits (`/employer/credits`)
- Check your credit balance
- View usage history
- Test the "Buy Credits" functionality (simulated)

### 4. Full Profile View (`/employer/job-seeker-profile/:id`)
- Access unlocked profiles
- View all profile information
- Test the enhanced UI

## Step 4: Sample Video URLs

For testing, you can use these sample video URLs:

```sql
-- Update profiles with working video URLs
UPDATE profiles 
SET intro_video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
WHERE intro_video_url LIKE '%sample-videos%';
```

## Troubleshooting

### No Videos Showing
- Check if profiles have `intro_video_url` values
- Ensure the video URLs are accessible
- Verify the profiles table structure

### Credit Issues
- Check if `employer_credits` table exists
- Verify your user ID is correct
- Check RLS policies

### Access Denied
- Ensure you're logged in as an employer
- Check if company profile is complete
- Verify database functions are working

## Next Steps

After testing:
1. ✅ Verify all features work correctly
2. ✅ Test credit deduction and access control
3. ✅ Check mobile responsiveness
4. ✅ Move to Phase 4 (Video Upload functionality) 
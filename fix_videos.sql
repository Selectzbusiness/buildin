-- Fix: Update existing profiles with working video URLs for testing
-- This will make the videos show up in the jobseeker reels

-- Update profiles that don't have intro_video_url or have empty ones
UPDATE profiles 
SET intro_video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    video_thumbnail_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
WHERE intro_video_url IS NULL OR intro_video_url = '';

-- Check the results
SELECT id, full_name, intro_video_url, video_thumbnail_url 
FROM profiles 
WHERE intro_video_url IS NOT NULL AND intro_video_url != ''; 
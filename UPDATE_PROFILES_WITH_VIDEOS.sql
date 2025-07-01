-- Update existing profiles with working video URLs for testing
-- This will make the videos show up in the jobseeker reels

-- Step 1: Add missing fields to profiles table if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]';

-- Step 2: Update profiles that don't have intro_video_url or have empty ones
UPDATE profiles 
SET 
    username = COALESCE(username, 'test_user_' || id::text),
    full_name = COALESCE(full_name, 'Test User ' || id::text),
    title = COALESCE(title, 'Software Developer'),
    intro_video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    video_thumbnail_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    desired_location = COALESCE(desired_location, 'Remote, San Francisco'),
    desired_roles = COALESCE(desired_roles, ARRAY['Software Developer', 'Frontend Developer'])
WHERE intro_video_url IS NULL 
   OR intro_video_url = '' 
   OR intro_video_url = 'null';

-- Step 3: Check the results
SELECT id, username, full_name, title, intro_video_url, video_thumbnail_url, desired_location, desired_roles 
FROM profiles 
WHERE intro_video_url IS NOT NULL 
  AND intro_video_url != ''
  AND intro_video_url != 'null'
ORDER BY id;

-- Alternative: Update specific profiles by ID if you know them
-- UPDATE profiles 
-- SET intro_video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
--     video_thumbnail_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
-- WHERE id IN ('your-profile-id-1', 'your-profile-id-2');

-- If you want to add more variety, you can use different sample videos:
-- Sample Video 1: Big Buck Bunny (longer, good quality)
-- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

-- Sample Video 2: Elephants Dream (shorter)
-- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4

-- Sample Video 3: For Bigger Blazes (medium length)
-- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4

-- Sample Video 4: For Bigger Escape (short)
-- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscape.mp4

-- Sample Video 5: For Bigger Fun (medium)
-- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4

-- Sample Video 6: For Bigger Joyrides (short)
-- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4

-- Sample Video 7: For Bigger Meltdowns (medium)
-- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4

-- Sample Video 8: Sintel (longer, high quality)
-- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4

-- Sample Video 9: Subaru Outback On Street And Dirt (short)
-- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4

-- Sample Video 10: Tears of Steel (longer, sci-fi)
-- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4 
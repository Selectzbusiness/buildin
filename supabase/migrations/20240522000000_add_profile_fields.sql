-- Add missing fields to profiles table
-- This migration adds the fields that are expected by the frontend

-- Add username field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Add full_name field  
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add title field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;

-- Add location field (separate from desired_location)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Add summary field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add experience field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience TEXT;

-- Add skills field (JSONB array)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';

-- Add education field (JSONB array)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]';

-- Add video_thumbnail_url field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_full_name_idx ON profiles(full_name);
CREATE INDEX IF NOT EXISTS profiles_title_idx ON profiles(title);
CREATE INDEX IF NOT EXISTS profiles_location_idx ON profiles(location); 
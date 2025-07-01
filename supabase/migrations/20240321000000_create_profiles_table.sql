-- Create profiles table for job seekers
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    intro_video_url TEXT,
    resume_url TEXT,
    desired_roles TEXT[] DEFAULT '{}',
    desired_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth_id = auth.uid());

CREATE POLICY "Users can delete their own profile"
    ON profiles FOR DELETE
    USING (auth_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.profiles TO postgres, authenticated, service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_auth_id_idx ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at); 
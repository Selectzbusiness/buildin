-- Drop the unused user_profiles table
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop the trigger and function that were creating user_profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure users table exists with correct schema
CREATE TABLE IF NOT EXISTS public.users (
  id uuid not null,
  email text not null,
  full_name text not null,
  role text not null,
  company_id uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  auth_id uuid null,
  avatar_url text null,
  roles text[] not null default array['jobseeker'::text],
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint users_role_check check (
    (
      role = any (
        array[
          'jobseeker'::text,
          'employer'::text,
          'admin'::text
        ]
      )
    )
  )
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (id = auth.uid());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, auth_id, roles)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'jobseeker'),
        NEW.id,
        ARRAY[COALESCE(NEW.raw_user_meta_data->>'role', 'jobseeker')]
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.users TO postgres, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, service_role;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_auth_id_idx ON users(auth_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);

-- Migrate existing users from profiles table to users table
-- This will create user records for users who have profiles but no users record
INSERT INTO public.users (id, email, full_name, role, auth_id, roles, created_at, updated_at)
SELECT 
    p.auth_id as id,
    COALESCE(p.email, '') as email,
    COALESCE(p.full_name, '') as full_name,
    'jobseeker' as role,
    p.auth_id,
    ARRAY['jobseeker'] as roles,
    COALESCE(p.created_at, NOW()) as created_at,
    COALESCE(p.updated_at, NOW()) as updated_at
FROM public.profiles p
WHERE p.auth_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = p.auth_id
);

-- Update auth_id field for existing users where it's null
UPDATE public.users 
SET auth_id = id 
WHERE auth_id IS NULL; 
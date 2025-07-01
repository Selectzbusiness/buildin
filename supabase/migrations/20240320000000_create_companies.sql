-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    size TEXT,
    location TEXT,
    website TEXT,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Companies are viewable by everyone"
    ON companies FOR SELECT
    USING (true);

CREATE POLICY "Companies can be created by authenticated users"
    ON companies FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Companies can be updated by owners"
    ON companies FOR UPDATE
    USING (auth_id = auth.uid());

CREATE POLICY "Companies can be deleted by owners"
    ON companies FOR DELETE
    USING (auth_id = auth.uid());

-- Create indexes
CREATE INDEX companies_auth_id_idx ON companies(auth_id);
CREATE INDEX companies_created_at_idx ON companies(created_at); 
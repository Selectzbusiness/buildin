const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables again to ensure they're available
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Debug logging
console.log('Supabase Configuration Check:', {
  envPath: envPath,
  url: supabaseUrl ? 'exists' : 'missing',
  key: supabaseKey ? 'exists' : 'missing',
  urlLength: supabaseUrl ? supabaseUrl.length : 0,
  keyLength: supabaseKey ? supabaseKey.length : 0
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials:', {
    url: supabaseUrl,
    key: supabaseKey ? 'exists' : 'missing',
    envPath: envPath,
    cwd: __dirname
  });
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client created successfully');
  module.exports = supabase;
} catch (error) {
  console.error('Error creating Supabase client:', error);
  throw error;
}
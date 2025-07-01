import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Debug logging
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl)
  console.error('Supabase Anon Key:', supabaseAnonKey)
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client with error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'job-connect-auth',
    storage: window.localStorage
  },
  db: {
    schema: 'public'
  },
  global: {
    fetch: (...args) => fetch(...args)
  }
})

// Test the connection
supabase.auth.getSession().then(
  ({ data: { session }, error }) => {
    if (error) {
      console.error('Supabase connection error:', error)
    } else {
      console.log('Supabase connected successfully')
    }
  }
)

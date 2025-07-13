import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl)
  console.error('Supabase Anon Key:', supabaseAnonKey)
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

const preferencesStorage = {
  getItem: async (key: string) => {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key });
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'job-connect-auth',
    storage: preferencesStorage,
  },
  db: {
    schema: 'public'
  },
  global: {
    fetch: (...args) => fetch(...args)
  }
})

supabase.auth.getSession().then(
  ({ data: { session }, error }) => {
    if (error) {
      console.error('Supabase connection error:', error)
    } else {
      console.log('Supabase connected successfully')
    }
  }
)

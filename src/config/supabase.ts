import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl);
  console.error('Supabase Anon Key:', supabaseAnonKey);
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
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

// Robust platform detection
const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform();
const storage = isNative ? preferencesStorage : localStorage;
console.log('Supabase Auth Storage:', isNative ? 'Capacitor Preferences (native)' : 'localStorage (web)');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'job-connect-auth',
    storage,
  },
  db: {
    schema: 'public',
  },
  global: {
    fetch: (...args) => fetch(...args),
  },
});

supabase.auth.getSession().then(
  ({ data: { session }, error }) => {
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connected successfully');
    }
  }
);

// Only attach to window in the browser
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.supabase = supabase;
}

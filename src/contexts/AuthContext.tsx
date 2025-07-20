import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { supabase } from '../config/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string;
  // Job Seeker Fields
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  title?: string;
  experience?: string;
  summary?: string;
  skills?: { name: string }[];
  education?: { degree: string; institution: string; year: string; field: string; }[];
  work_experience?: { company: string; position: string; location: string; start_date: string; end_date: string; current: boolean; description: string; achievements: string[]; technologies: string[] }[];
  date_of_birth?: string;
  website?: string;
  twitter?: string;
  bio?: string;
  preferred_work_type?: string;
  salary_expectation?: string;
  availability?: string;
  languages?: string[];
  certifications: Array<{ name: string; issuer: string; date: string; photo_url: string; certificate_url: string }>;
  projects: Array<{ name: string; description: string; url: string; github: string; technologies: string[] }>;
  achievements?: string[];
  social_links?: { platform: string; url: string }[];
  // Legacy fields for backward compatibility
  auth_id?: string;
  roles?: string[];
  email?: string;
  resume_url?: string;
  intro_video_url?: string;
  two_factor_enabled?: boolean;
  company_id?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: (sessionParam?: Session) => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  setProfile: () => {},
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let authListener: any = null;

    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error restoring session:', error);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setSessionRestored(true);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
        setSessionRestored(true);
      } catch (err) {
        console.error('UNHANDLED ERROR in restoreSession:', err);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          setSessionRestored(true);
        }
      }
    };

    // Set up auth state change listener
    const setupAuthListener = () => {
      authListener = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          if (event === 'SIGNED_OUT' || !session?.user) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(session.user);
            if (session.user) {
              await fetchProfile(session.user.id);
            }
            setLoading(false);
          }
        }
      );
    };

    // Start session restoration immediately
    restoreSession().then(() => {
      if (mounted) {
        setupAuthListener();
      }
    });

    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for userId:', userId);
      // Fetch from profiles table where auth_id = userId
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', userId)
        .single();
      console.log('fetchProfile result:', { data, error });

      if (!data) {
        // Try to get the Auth user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        const authUser = authData?.user;
        console.log('Auth user:', authUser, 'Auth error:', authError);

        if (authUser) {
          // Try to insert the profile
          console.log('Attempting to insert user profile...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              auth_id: authUser.id,
              full_name: authUser.user_metadata?.full_name || '',
            }]);
          if (insertError) {
            console.error('Error inserting user profile:', insertError);
          } else {
            // Try to fetch again
            ({ data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('auth_id', userId)
              .single());
            console.log('fetchProfile after insert:', { data, error });
          }
        } else {
          console.error('No auth user found, cannot insert profile.');
        }
      }

      if (data) {
        setProfile({
          ...data,
          user_id: data.auth_id, // Map auth_id to user_id for compatibility
          id: data.id, // This is the profiles.id (primary key)
          certifications: data.certifications || [],
          projects: data.projects || [],
          // Use actual roles from database, fallback to jobseeker if none
          roles: data.roles || ['jobseeker']
        });
        return;
      }
      if (error) {
        console.error('Error fetching user profile:', error);
      }
      setProfile(null);
    } catch (err) {
      console.error('UNHANDLED ERROR in fetchProfile:', err);
    }
  };

  const refreshProfile = async (sessionParam?: Session) => {
    console.log('refreshProfile called with session:', sessionParam);
    let session: Session | undefined = sessionParam;
    if (!session) {
      session = (await supabase.auth.getSession()).data.session || undefined;
    }
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const logout = async () => {
    try {
      // Check if there's an active session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Error signing out:', error);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    // Always clear local state
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    setUser,
    profile,
    loading: loading || !sessionRestored, // Show loading until session is restored
    refreshProfile,
    setProfile,
    logout,
  };

  // Always render children, let components handle loading
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext); 
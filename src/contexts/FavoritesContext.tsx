import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

interface FavoritesContextType {
  savedJobs: Set<string>;
  savedInternships: Set<string>;
  loading: boolean;
  toggleJobFavorite: (jobId: string) => Promise<boolean>;
  toggleInternshipFavorite: (internshipId: string) => Promise<boolean>;
  isJobSaved: (jobId: string) => boolean;
  isInternshipSaved: (internshipId: string) => boolean;
  loadFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, user } = useContext(AuthContext);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [savedInternships, setSavedInternships] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Function to ensure profile exists
  const ensureProfileExists = async () => {
    if (!user) return null;
    
    // First try to get existing profile
    let { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();
    
    if (existingProfile) {
      return existingProfile;
    }
    
    // If no profile exists, create one
    console.log('Creating new profile for user:', user.id);
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{
        auth_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        roles: user.user_metadata?.roles || ['jobseeker'],
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating profile:', createError);
      return null;
    }
    
    console.log('Created new profile:', newProfile);
    return newProfile;
  };

  // Load saved jobs and internships
  const loadFavorites = async () => {
    const currentProfile = await ensureProfileExists();
    if (!currentProfile) return;
    
    try {
      setLoading(true);
      
      // Load saved jobs
      const { data: jobFavorites, error: jobError } = await supabase
        .from('job_favorites')
        .select('job_id')
        .eq('user_id', currentProfile.id);
      
      if (jobError) throw jobError;
      
      // Load saved internships
      const { data: internshipFavorites, error: internshipError } = await supabase
        .from('internship_favorites')
        .select('internship_id')
        .eq('user_id', currentProfile.id);
      
      if (internshipError) throw internshipError;
      
      setSavedJobs(new Set(jobFavorites?.map(fav => fav.job_id) || []));
      setSavedInternships(new Set(internshipFavorites?.map(fav => fav.internship_id) || []));
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  // Load favorites when user changes
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setSavedJobs(new Set());
      setSavedInternships(new Set());
    }
  }, [user]);

  // Toggle job favorite
  const toggleJobFavorite = async (jobId: string): Promise<boolean> => {
    const currentProfile = await ensureProfileExists();
    if (!currentProfile) {
      toast.error('Please log in to save jobs');
      return false;
    }

    const isCurrentlySaved = savedJobs.has(jobId);
    
    // Optimistic update
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (isCurrentlySaved) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });

    try {
      if (isCurrentlySaved) {
        // Remove from favorites
        const { error } = await supabase
          .from('job_favorites')
          .delete()
          .eq('job_id', jobId)
          .eq('user_id', currentProfile.id);
        
        if (error) throw error;
        toast('Removed from favorites');
      } else {
        // Check if already exists before inserting
        const { data: existing, error: checkError } = await supabase
          .from('job_favorites')
          .select('id')
          .eq('job_id', jobId)
          .eq('user_id', currentProfile.id)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        if (existing) {
          console.log('Job favorite already exists, updating state only');
          // Already exists, just update the state
          toast.success('Job saved to favorites!');
        } else {
          // Add to favorites
          const { error } = await supabase
            .from('job_favorites')
            .insert({ job_id: jobId, user_id: currentProfile.id });
          
          if (error) throw error;
          toast.success('Job saved to favorites!');
        }
      }
      
      return !isCurrentlySaved;
    } catch (error) {
      console.error('Error toggling job favorite:', error);
      
      // Revert optimistic update
      setSavedJobs(prev => {
        const newSet = new Set(prev);
        if (isCurrentlySaved) {
          newSet.add(jobId);
        } else {
          newSet.delete(jobId);
        }
        return newSet;
      });
      
      toast.error('Failed to update favorites');
      return isCurrentlySaved;
    }
  };

  // Toggle internship favorite
  const toggleInternshipFavorite = async (internshipId: string): Promise<boolean> => {
    const currentProfile = await ensureProfileExists();
    if (!currentProfile) {
      toast.error('Please log in to save internships');
      return false;
    }

    const isCurrentlySaved = savedInternships.has(internshipId);
    
    // Optimistic update
    setSavedInternships(prev => {
      const newSet = new Set(prev);
      if (isCurrentlySaved) {
        newSet.delete(internshipId);
      } else {
        newSet.add(internshipId);
      }
      return newSet;
    });

    try {
      if (isCurrentlySaved) {
        // Remove from favorites
        const { error } = await supabase
          .from('internship_favorites')
          .delete()
          .eq('internship_id', internshipId)
          .eq('user_id', currentProfile.id);
        
        if (error) throw error;
        toast('Removed from favorites');
      } else {
        // Check if already exists before inserting
        const { data: existing, error: checkError } = await supabase
          .from('internship_favorites')
          .select('id')
          .eq('internship_id', internshipId)
          .eq('user_id', currentProfile.id)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        if (existing) {
          console.log('Internship favorite already exists, updating state only');
          // Already exists, just update the state
          toast.success('Internship saved to favorites!');
        } else {
          // Add to favorites
          const { error } = await supabase
            .from('internship_favorites')
            .insert({ internship_id: internshipId, user_id: currentProfile.id });
          
          if (error) throw error;
          toast.success('Internship saved to favorites!');
        }
      }
      
      return !isCurrentlySaved;
    } catch (error) {
      console.error('Error toggling internship favorite:', error);
      
      // Revert optimistic update
      setSavedInternships(prev => {
        const newSet = new Set(prev);
        if (isCurrentlySaved) {
          newSet.add(internshipId);
        } else {
          newSet.delete(internshipId);
        }
        return newSet;
      });
      
      toast.error('Failed to update favorites');
      return isCurrentlySaved;
    }
  };

  // Check if job is saved
  const isJobSaved = (jobId: string): boolean => {
    return savedJobs.has(jobId);
  };

  // Check if internship is saved
  const isInternshipSaved = (internshipId: string): boolean => {
    return savedInternships.has(internshipId);
  };

  const value: FavoritesContextType = {
    savedJobs,
    savedInternships,
    loading,
    toggleJobFavorite,
    toggleInternshipFavorite,
    isJobSaved,
    isInternshipSaved,
    loadFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}; 
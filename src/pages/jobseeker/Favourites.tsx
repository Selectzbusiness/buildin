import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiBookmark, FiBriefcase, FiBookOpen, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useIsMobile from '../../hooks/useIsMobile';
import JobCardNew from '../../components/JobCardNew';
import { InternshipCard } from '../../components/InternshipCard';

const TABS = [
  { id: 'jobs', label: 'Saved Jobs', icon: FiBriefcase },
  { id: 'internships', label: 'Saved Internships', icon: FiBookOpen },
];

// Favorites management functions that can be used across the app
export const useFavoritesManagement = () => {
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

  // Toggle job favorite
  const toggleJobFavorite = async (jobId: string): Promise<boolean> => {
    const currentProfile = await ensureProfileExists();
    if (!currentProfile) {
      toast.error('Please log in to save jobs');
      return false;
    }

    console.log('Full profile object:', currentProfile);
    console.log('Profile ID being used:', currentProfile.id);
    console.log('Profile auth_id:', currentProfile.auth_id);
    console.log('Job ID being saved:', jobId);

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
          console.log('Inserting job favorite with:', { job_id: jobId, user_id: currentProfile.id });
          const { error } = await supabase
            .from('job_favorites')
            .insert({ job_id: jobId, user_id: currentProfile.id });
          
          if (error) {
            console.error('Supabase error details:', error);
            throw error;
          }
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

    console.log('Profile ID being used for internship:', currentProfile.id);
    console.log('Internship ID being saved:', internshipId);

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
          console.log('Inserting internship favorite with:', { internship_id: internshipId, user_id: currentProfile.id });
          const { error } = await supabase
            .from('internship_favorites')
            .insert({ internship_id: internshipId, user_id: currentProfile.id });
          
          if (error) {
            console.error('Supabase error details for internship:', error);
            throw error;
          }
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

  return {
    savedJobs,
    savedInternships,
    loading,
    toggleJobFavorite,
    toggleInternshipFavorite,
    isJobSaved,
    isInternshipSaved,
    loadFavorites
  };
};

const Favourites: React.FC = () => {
  const { profile } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'jobs' | 'internships'>('jobs');
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [savedInternships, setSavedInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const fetchFavorites = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch saved jobs
      const { data: jobFavs, error: jobFavsError } = await supabase
        .from('job_favorites')
        .select('id, job_id, jobs:job_id(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (jobFavsError) throw jobFavsError;
      setSavedJobs(jobFavs || []);
      // Fetch saved internships
      const { data: internshipFavs, error: internshipFavsError } = await supabase
        .from('internship_favorites')
        .select('id, internship_id, internships:internship_id(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (internshipFavsError) throw internshipFavsError;
      setSavedInternships(internshipFavs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [profile]);

  const handleUnsaveJob = async (jobId: string) => {
    if (!profile) return;
    setUnsavingId(jobId);
    try {
      const { error } = await supabase
        .from('job_favorites')
        .delete()
        .eq('job_id', jobId)
        .eq('user_id', profile.id);
      if (error) throw error;
      setSavedJobs(prev => prev.filter(fav => fav.job_id !== jobId));
      toast.success('Job removed from favorites');
    } catch (err) {
      toast.error('Failed to remove job from favorites');
    } finally {
      setUnsavingId(null);
    }
  };

  const handleUnsaveInternship = async (internshipId: string) => {
    if (!profile) return;
    setUnsavingId(internshipId);
    try {
      const { error } = await supabase
        .from('internship_favorites')
        .delete()
        .eq('internship_id', internshipId)
        .eq('user_id', profile.id);
      if (error) throw error;
      setSavedInternships(prev => prev.filter(fav => fav.internship_id !== internshipId));
      toast.success('Internship removed from favorites');
    } catch (err) {
      toast.error('Failed to remove internship from favorites');
    } finally {
      setUnsavingId(null);
    }
  };

  const renderLocation = (location: any): string => {
    if (!location) return 'Location not specified';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      if (location.city && location.area) {
        return `${location.city}, ${location.area}`;
      }
      if (location.city) return location.city;
      if (location.area) return location.area;
      return 'Location not specified';
    }
    return 'Location not specified';
  };

  return (
    isMobile ? (
      <div className="min-h-screen bg-white pb-4">
        <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-2 border-b border-[#e3f0fa]">
          <h1 className="text-xl font-bold text-[#185a9d] mb-2 flex items-center gap-2"><FiBookmark /> Favourites</h1>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`flex-1 px-3 py-2 rounded-full font-semibold flex items-center justify-center gap-2 transition-all duration-200 text-sm whitespace-nowrap ${activeTab === tab.id ? 'bg-[#185a9d] text-white shadow' : 'bg-[#f1f5f9] text-gray-700 hover:bg-[#e3f0fa]'}`}
                  onClick={() => setActiveTab(tab.id as 'jobs' | 'internships')}
                >
                  <Icon /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-2 pt-2">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#185a9d] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your favorites...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-16">{error}</div>
          ) : (
            <div>
              {activeTab === 'jobs' && (
                <div>
                  {savedJobs.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-base">No saved jobs yet.</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {savedJobs.map((fav) => (
                        <JobCardNew key={fav.id} job={{
                          id: fav.job_id,
                          title: fav.jobs?.title || 'Job Title',
                          company: fav.jobs?.company || 'Company Name',
                          location: fav.jobs?.location,
                          type: fav.jobs?.job_type || 'Job',
                          salary: fav.jobs?.salary || '',
                          description: fav.jobs?.description || '',
                          postedDate: fav.jobs?.created_at || '',
                          requirements: fav.jobs?.requirements || [],
                          status: fav.jobs?.status || 'active',
                          experience: fav.jobs?.experience || '',
                          companies: fav.jobs?.companies,
                          companyLogo: fav.jobs?.companyLogo,
                          skills: fav.jobs?.skills || [],
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'internships' && (
                <div>
                  {savedInternships.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-base">No saved internships yet.</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {savedInternships.map((fav) => (
                        <InternshipCard key={fav.id} internship={{
                          id: fav.internship_id,
                          title: fav.internships?.title || 'Internship Title',
                          description: fav.internships?.description || '',
                          internship_type: fav.internships?.internship_type || 'Internship',
                          location: fav.internships?.location,
                          stipend_type: fav.internships?.stipend_type || '',
                          min_amount: fav.internships?.min_amount || 0,
                          max_amount: fav.internships?.max_amount || 0,
                          amount: fav.internships?.amount || 0,
                          pay_rate: fav.internships?.pay_rate || '',
                          duration: fav.internships?.duration || '',
                          company: fav.internships?.company || 'Company Name',
                          companyLogo: fav.internships?.companyLogo,
                          skills: fav.internships?.skills || [],
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="min-h-screen bg-[#f1f5f9] py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-[#185a9d] mb-8 flex items-center gap-2"><FiBookmark /> Favourites</h1>
          <div className="mb-6 flex gap-2 border-b border-[#e3f0fa]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`px-4 py-2 font-semibold rounded-t-lg flex items-center gap-2 transition-all duration-200 ${activeTab === tab.id ? 'bg-white text-[#185a9d] border-b-2 border-[#185a9d]' : 'text-gray-500 hover:text-[#185a9d] bg-transparent'}`}
                  onClick={() => setActiveTab(tab.id as 'jobs' | 'internships')}
                >
                  <Icon /> {tab.label}
                </button>
              );
            })}
          </div>
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185a9d] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your favorites...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-16">{error}</div>
          ) : (
            <div>
              {activeTab === 'jobs' && (
                <div>
                  {savedJobs.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">No saved jobs yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {savedJobs.map((fav) => (
                        <div key={fav.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#185a9d] cursor-pointer hover:underline" onClick={() => navigate(`/jobs/${fav.job_id}`)}>{fav.jobs?.title || 'Job Title'}</h3>
                            <div className="text-gray-500 text-sm mb-1">{fav.jobs?.company || 'Company Name'} • {renderLocation(fav.jobs?.location)}</div>
                            <div className="text-xs text-gray-400">Posted: {fav.jobs?.created_at ? new Date(fav.jobs.created_at).toLocaleDateString() : 'Recently'}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#e3f0fa] text-[#185a9d]">{fav.jobs?.job_type || 'Job'}</span>
                            <button
                              onClick={() => handleUnsaveJob(fav.job_id)}
                              disabled={unsavingId === fav.job_id}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                              aria-label="Remove from favorites"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'internships' && (
                <div>
                  {savedInternships.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">No saved internships yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {savedInternships.map((fav) => (
                        <div key={fav.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#185a9d] cursor-pointer hover:underline" onClick={() => navigate(`/internships/${fav.internship_id}`)}>{fav.internships?.title || 'Internship Title'}</h3>
                            <div className="text-gray-500 text-sm mb-1">{fav.internships?.company || 'Company Name'} • {renderLocation(fav.internships?.location)}</div>
                            <div className="text-xs text-gray-400">Posted: {fav.internships?.created_at ? new Date(fav.internships.created_at).toLocaleDateString() : 'Recently'}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#e3f0fa] text-[#185a9d]">{fav.internships?.internship_type || 'Internship'}</span>
                            <button
                              onClick={() => handleUnsaveInternship(fav.internship_id)}
                              disabled={unsavingId === fav.internship_id}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                              aria-label="Remove from favorites"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default Favourites; 
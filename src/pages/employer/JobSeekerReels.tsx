import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../../contexts/AuthContext';
import ReelsInterface from '../../components/ReelsInterface';
import useIsMobile from '../../hooks/useIsMobile';

interface JobSeekerReel {
  auth_id: string;
  intro_video_url: string;
  video_thumbnail_url?: string;
  desired_location: string;
  desired_roles?: string[];
  username?: string;
  full_name?: string;
  title?: string;
}

const JobSeekerReels: React.FC = () => {
  const [reels, setReels] = useState<JobSeekerReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'reels'>('reels'); // Default to reels view
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isMobile = useIsMobile();

  const fetchSavedVideos = async () => {
    if (!user) return;
    
    // Get saved videos with profile auth_id
    const { data, error } = await supabase
      .from('employer_saved_videos')
      .select(`
        job_seeker_id,
        profiles!inner(auth_id)
      `)
      .eq('employer_id', user.id);

    if (!error && data) {
      const authIds = data.map((item: any) => item.profiles.auth_id);
      setSavedVideoIds(authIds);
    }
  };

  useEffect(() => {
    fetchReels();
    fetchSavedVideos();
  }, [user]); // Re-run when user changes

  const fetchReels = async (role?: string, location?: string) => {
    setLoading(true);
    console.log('🔍 Fetching reels with filters:', { role, location });
    
    let query = supabase
      .from('profiles')
      .select('auth_id, intro_video_url, video_thumbnail_url, desired_location, desired_roles, username, full_name, title')
      .not('intro_video_url', 'is', null)
      .not('intro_video_url', 'eq', '')
      .not('intro_video_url', 'eq', 'null');
    
    if (role) {
      // Array contains operator for Postgres arrays
      query = query.contains('desired_roles', [role]);
    }
    if (location) {
      query = query.ilike('desired_location', `%${location}%`);
    }
    
    console.log('📡 Executing query...');
    const { data, error } = await query.order('auth_id');
    
    if (error) {
      console.error('❌ Error fetching reels:', error);
      toast.error('Failed to load reels');
      setLoading(false);
      return;
    }
    
    console.log('✅ Reels fetched successfully:', data);
    console.log('📊 Number of reels found:', data?.length || 0);
    
    // Debug: Log each reel
    if (data && data.length > 0) {
      data.forEach((reel, index) => {
        console.log(`🎬 Reel ${index + 1}:`, {
          auth_id: reel.auth_id,
          username: reel.username,
          full_name: reel.full_name,
          title: reel.title,
          video_url: reel.intro_video_url,
          location: reel.desired_location,
          roles: reel.desired_roles
        });
      });
    }
    
    setReels((data || []).map((reel: any) => ({
      ...reel,
      auth_id: reel.auth_id
    })));
    setLoading(false);
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReels(roleFilter, locationFilter);
  };

  const handleClearFilters = () => {
    setRoleFilter('');
    setLocationFilter('');
    fetchReels();
  };

  const handleViewProfile = (id: string) => {
    setShowConfirm(id);
  };

  const confirmViewProfile = async (jobSeekerAuthId: string) => {
    setViewingId(jobSeekerAuthId);
    setShowConfirm(null);
    if (!user) {
      toast.error('You must be logged in as an employer.');
      setViewingId(null);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('access_job_seeker_profile', {
        employer_id: user.id,
        job_seeker_id: jobSeekerAuthId
      });
      if (error) {
        // Fallback: manually check credits and create access record
        const { data: credits, error: creditsError } = await supabase
          .from('employer_credits')
          .select('credits_balance')
          .eq('employer_id', user.id)
          .single();
        if (creditsError || !credits || credits.credits_balance < 1) {
          toast.error('Insufficient credits. Please purchase more credits.');
          setViewingId(null);
          return;
        }
        await supabase.from('employer_credits')
          .update({ credits_balance: credits.credits_balance - 1 })
          .eq('employer_id', user.id);
        await supabase.from('employer_profile_views')
          .insert([{
            employer_id: user.id,
            job_seeker_id: jobSeekerAuthId,
            credits_used: 1
          }]);
      }
      setViewingId(null);
      navigate(`/employer/job-seeker-profile/${jobSeekerAuthId}`);
    } catch (err) {
      toast.error('Failed to unlock profile. Please try again.');
      setViewingId(null);
    }
  };

  const handleSaveVideo = async (jobSeekerAuthId: string) => {
    setSavingId(jobSeekerAuthId);
    if (!user) {
      toast.error('You must be logged in as an employer.');
      setSavingId(null);
      return;
    }

    try {
      // First, get the profile ID from the auth_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', jobSeekerAuthId)
        .single();

      if (profileError || !profileData) {
        toast.error('Profile not found.');
        setSavingId(null);
        return;
      }

      const isCurrentlySaved = savedVideoIds.includes(jobSeekerAuthId);

      if (isCurrentlySaved) {
        // Unsave the video
        const { error } = await supabase
          .from('employer_saved_videos')
          .delete()
          .eq('employer_id', user.id)
          .eq('job_seeker_id', profileData.id);

        if (error) {
          toast.error('Failed to unsave video.');
          setSavingId(null);
          return;
        }

        setSavedVideoIds(prev => prev.filter(id => id !== jobSeekerAuthId));
        toast.success('Video unsaved!');
      } else {
        // Save the video
    const { error } = await supabase.from('employer_saved_videos').insert([
      {
        employer_id: user.id,
            job_seeker_id: profileData.id,
        saved_at: new Date().toISOString()
      }
    ]);

    if (error) {
          // Unique constraint violation (already saved)
          if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate')) {
            toast.success('Video already saved!');
            setSavedVideoIds(prev => prev.includes(jobSeekerAuthId) ? prev : [...prev, jobSeekerAuthId]);
          } else {
      toast.error(error.message || 'Failed to save video.');
          }
          setSavingId(null);
          return;
        }

        setSavedVideoIds(prev => [...prev, jobSeekerAuthId]);
        toast.success('Video saved!');
      }

      setSavingId(null);
    } catch (error) {
      console.error('Error toggling video save:', error);
      toast.error('Failed to update video save status.');
      setSavingId(null);
    }
  };

  // If in reels mode and we have videos, show the reels interface
  if (viewMode === 'reels' && reels.length > 0 && !loading) {
    return (
      <ReelsInterface
        reels={reels}
        onSaveVideo={handleSaveVideo}
        onViewProfile={handleViewProfile}
        savingId={savingId}
        viewingId={viewingId}
        showConfirm={showConfirm}
        onConfirmViewProfile={confirmViewProfile}
        onCancelViewProfile={() => setShowConfirm(null)}
        savedVideoIds={savedVideoIds}
      />
    );
  }

  // --- MOBILE UI ---
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] pb-20 flex flex-col items-center">
        <div className="w-full max-w-md mx-auto px-2 pt-4">
          <h1 className="text-xl font-bold text-[#185a9d] mb-3 text-center">Job Seeker Reels</h1>
          {/* Search/Filter Bar */}
          <form onSubmit={handleFilter} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Role/Designation"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
            />
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
            />
            <button type="submit" className="px-3 py-2 bg-[#185a9d] text-white rounded-lg font-semibold text-sm">Search</button>
            <button type="button" onClick={handleClearFilters} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm">Clear</button>
          </form>
          {loading ? (
            <div className="w-full flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#185a9d]"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reels.length === 0 && (
                <div className="text-center text-gray-500 py-12">No job seeker videos available yet.</div>
              )}
              {reels.map((reel) => (
                <div key={reel.auth_id} className="bg-white rounded-xl border border-[#e3f0fa] shadow p-3 flex flex-col items-center">
                  <video
                    src={reel.intro_video_url}
                    poster={reel.video_thumbnail_url}
                    controls
                    className="rounded-lg w-full max-h-64 bg-black mb-2"
                    preload="metadata"
                  />
                  <div className="w-full flex flex-col items-center mb-2">
                    <span className="text-gray-700 font-medium text-sm">{reel.full_name || reel.username || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{reel.title}</span>
                    <span className="text-xs text-gray-500">{reel.desired_location || 'Not specified'}</span>
                    {reel.desired_roles && reel.desired_roles.length > 0 && (
                      <span className="text-xs text-gray-400">Roles: {reel.desired_roles.join(', ')}</span>
                    )}
                  </div>
                  <div className="flex gap-2 w-full">
                    <button
                      className="flex-1 py-2 rounded-lg bg-[#185a9d] text-white text-xs font-semibold shadow"
                      onClick={() => handleViewProfile(reel.auth_id)}
                      disabled={viewingId === reel.auth_id}
                    >
                      {viewingId === reel.auth_id ? 'Processing...' : 'View Profile'}
                    </button>
                    <button
                      className="flex-1 py-2 rounded-lg bg-gray-100 text-[#185a9d] text-xs font-semibold shadow"
                      onClick={() => handleSaveVideo(reel.auth_id)}
                      disabled={savingId === reel.auth_id}
                    >
                      {savingId === reel.auth_id ? 'Saving...' : 'Save Video'}
                    </button>
                  </div>
                  {/* Confirmation Dialog */}
                  {showConfirm === reel.auth_id && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                      <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full flex flex-col items-center">
                        <h2 className="text-base font-semibold mb-3 text-gray-900">Use 1 credit to view full profile?</h2>
                        <p className="text-gray-600 mb-4 text-center text-xs">This action will deduct 1 credit from your balance. Are you sure you want to continue?</p>
                        <div className="flex gap-2 w-full justify-center">
                          <button
                            className="flex-1 py-2 rounded-lg bg-[#185a9d] text-white text-xs font-semibold shadow"
                            onClick={() => confirmViewProfile(reel.auth_id)}
                          >
                            Yes
                          </button>
                          <button
                            className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 text-xs font-semibold shadow"
                            onClick={() => setShowConfirm(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center py-12 px-2">
      <div className="w-full max-w-4xl">
        {/* Header with View Mode Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#185a9d] mb-4 md:mb-0">Job Seeker Video Reels</h1>
          
          {/* View Mode Toggle */}
          <div className="flex bg-white rounded-full shadow-md p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-[#185a9d] text-white shadow-sm hover:bg-[#43cea2]'
                  : 'text-gray-600 hover:text-[#185a9d] hover:bg-[#e3f0fa]'
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setViewMode('reels')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === 'reels'
                  ? 'bg-[#185a9d] text-white shadow-sm hover:bg-[#43cea2]'
                  : 'text-gray-600 hover:text-[#185a9d] hover:bg-[#e3f0fa]'
              }`}
            >
              🎬 Reels View
            </button>
          </div>
        </div>

      {/* Search/Filter Bar */}
      <form
        onSubmit={handleFilter}
          className="w-full flex flex-col md:flex-row gap-4 mb-8 items-center justify-center"
      >
        <input
          type="text"
          placeholder="Role/Designation (e.g. Designer, Engineer)"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
            className="flex-1 px-6 py-3 rounded-full border border-[#e3f0fa] bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#43cea2] focus:border-[#43cea2] transition-all"
        />
        <input
          type="text"
          placeholder="Location (city, state, or remote)"
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
            className="flex-1 px-6 py-3 rounded-full border border-[#e3f0fa] bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#43cea2] focus:border-[#43cea2] transition-all"
        />
        <button
          type="submit"
            className="px-6 py-3 bg-[#185a9d] text-white rounded-full font-semibold shadow hover:bg-[#43cea2] transition-colors duration-200"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleClearFilters}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold shadow hover:bg-gray-200 transition-colors duration-200"
        >
          Clear
        </button>
      </form>

      {loading ? (
        <div className="w-full flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185a9d]"></div>
        </div>
      ) : (
          <div className="w-full flex flex-col gap-8">
          {reels.length === 0 && (
            <div className="text-center text-gray-500 py-16">No job seeker videos available yet.</div>
          )}
          {reels.map((reel) => (
              <div key={reel.auth_id} className="bg-[#f4f8fb] rounded-2xl border border-[#e3f0fa] shadow-lg p-4 flex flex-col items-center">
              <div className="w-full flex flex-col items-center">
                <video
                  src={reel.intro_video_url}
                  poster={reel.video_thumbnail_url}
                  controls
                  className="rounded-xl w-full max-h-96 bg-black mb-4"
                  preload="metadata"
                  onError={(e) => {
                    console.error('❌ Video failed to load:', reel.intro_video_url);
                    const videoElement = e.target as HTMLVideoElement;
                    videoElement.style.display = 'none';
                    // Show error message
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 mb-4';
                    errorDiv.innerHTML = `
                      <div class="text-center">
                        <div class="text-2xl mb-2">🎬</div>
                        <div>Video unavailable</div>
                        <div class="text-sm">${reel.username || reel.full_name || 'Unknown User'}</div>
                      </div>
                    `;
                    videoElement.parentNode?.insertBefore(errorDiv, videoElement.nextSibling);
                  }}
                />
                <div className="flex flex-col items-center w-full">
                  <span className="text-gray-700 font-medium mb-1">Desired Location:</span>
                  <span className="text-lg text-gray-900 mb-2">{reel.desired_location || 'Not specified'}</span>
                  {reel.desired_roles && reel.desired_roles.length > 0 && (
                    <span className="text-sm text-gray-500 mb-2">Roles: {reel.desired_roles.join(', ')}</span>
                  )}
                </div>
                <div className="flex gap-4 mt-2 w-full justify-center">
                  <button
                      className="px-6 py-2 bg-[#185a9d] text-white rounded-full font-semibold shadow hover:bg-[#43cea2] transition-colors duration-200 disabled:opacity-60"
                    onClick={() => handleViewProfile(reel.auth_id)}
                    disabled={viewingId === reel.auth_id}
                  >
                    {viewingId === reel.auth_id ? 'Processing...' : 'View Full Profile'}
                  </button>
                  <button
                      className="px-6 py-2 bg-white border border-[#43cea2] text-[#185a9d] rounded-full font-semibold shadow hover:bg-[#e3f0fa] transition-colors duration-200 disabled:opacity-60"
                    onClick={() => handleSaveVideo(reel.auth_id)}
                    disabled={savingId === reel.auth_id}
                  >
                    {savingId === reel.auth_id ? 'Saving...' : 'Save Video'}
                  </button>
                </div>
              </div>
              {/* Confirmation Dialog */}
              {showConfirm === reel.auth_id && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Use 1 credit to view full profile?</h2>
                    <p className="text-gray-600 mb-6 text-center">This action will deduct 1 credit from your balance. Are you sure you want to continue?</p>
                    <div className="flex gap-4 w-full justify-center">
                      <button
                          className="px-6 py-2 bg-[#185a9d] text-white rounded-full font-semibold hover:bg-[#43cea2] transition-colors duration-200"
                        onClick={() => confirmViewProfile(reel.auth_id)}
                      >
                        Yes, Continue
                      </button>
                      <button
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors duration-200"
                        onClick={() => setShowConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default JobSeekerReels; 
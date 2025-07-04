import React, { useContext, useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import useIsMobile from '../../hooks/useIsMobile';

interface SavedVideo {
  id: string;
  job_seeker_id: string;
  saved_at: string;
  intro_video_url: string;
  video_thumbnail_url?: string;
  desired_location: string;
  desired_roles?: string[];
  auth_id: string;
  username?: string;
  full_name?: string;
  title?: string;
}

const SavedJobSeekerVideos: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'reels' | 'grid'>('reels');
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [videoRef, videoInView] = useInView({ threshold: 0.5, triggerOnce: false });
  const minSwipeDistance = 50;
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchSavedVideos();
    // eslint-disable-next-line
  }, [user]);

  const fetchSavedVideos = async () => {
    if (!user) return;
    setLoading(true);
    // Join employer_saved_videos with profiles to get video info
    const { data, error } = await supabase
      .from('employer_saved_videos')
      .select(`
        id, 
        job_seeker_id, 
        saved_at,
        profiles:profiles!employer_saved_videos_job_seeker_id_fkey(auth_id, intro_video_url, video_thumbnail_url, desired_location, desired_roles, username, full_name, title)
      `)
      .eq('employer_id', user.id)
      .order('saved_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching saved videos:', error);
      toast.error('Failed to load saved videos');
      setLoading(false);
      return;
    }
    
    // Map to flat structure
    const mapped = (data || []).map((item: any) => ({
      id: item.id,
      job_seeker_id: item.job_seeker_id,
      saved_at: item.saved_at,
      intro_video_url: item.profiles?.intro_video_url,
      video_thumbnail_url: item.profiles?.video_thumbnail_url,
      desired_location: item.profiles?.desired_location,
      desired_roles: item.profiles?.desired_roles,
      auth_id: item.profiles?.auth_id || item.job_seeker_id,
      username: item.profiles?.username,
      full_name: item.profiles?.full_name,
      title: item.profiles?.title
    }));
    
    console.log('Saved videos data:', mapped); // Debug log
    setVideos(mapped);
    setLoading(false);
  };

  // Real-time filtered videos
  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const roleMatch = roleFilter.trim() === '' || (video.desired_roles && video.desired_roles.join(' ').toLowerCase().includes(roleFilter.toLowerCase()));
      const locationMatch = locationFilter.trim() === '' || (video.desired_location && video.desired_location.toLowerCase().includes(locationFilter.toLowerCase()));
      return roleMatch && locationMatch;
    });
  }, [videos, roleFilter, locationFilter]);

  // Reset index if filteredVideos changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [filteredVideos.length, roleFilter, locationFilter]);

  // Auto-switch to grid view on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setViewMode(() => 'grid');
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Only run on mount/unmount

  // Set initial view mode based on screen size
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setViewMode(isMobile ? 'reels' : 'grid');
  }, []);

  // Touch/swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;
    if (isUpSwipe && currentIndex < filteredVideos.length - 1) {
      setCurrentIndex(i => i + 1);
    } else if (isDownSwipe && currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < filteredVideos.length - 1) setCurrentIndex(i => i + 1);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, filteredVideos.length]);

  const handleRemoveVideo = async (videoId: string, authId: string) => {
    setRemovingId(videoId);
    if (!user) {
      toast.error('You must be logged in as an employer.');
      setRemovingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('employer_saved_videos')
        .delete()
        .eq('id', videoId);

      if (error) {
        toast.error('Failed to remove video.');
        setRemovingId(null);
        return;
      }

      // Remove from local state
      setVideos(prev => prev.filter(video => video.id !== videoId));
      toast.success('Video removed from saved list!');
      setRemovingId(null);
    } catch (error) {
      console.error('Error removing video:', error);
      toast.error('Failed to remove video.');
      setRemovingId(null);
    }
  };

  const handleViewProfile = (authId: string) => {
    setShowConfirm(authId);
  };

  const confirmViewProfile = async (authId: string) => {
    setViewingId(authId);
    setShowConfirm(null);
    if (!user) {
      toast.error('You must be logged in as an employer.');
      setViewingId(null);
      return;
    }
    const { data, error } = await supabase.rpc('access_job_seeker_profile', {
      employer_id: user.id,
      job_seeker_id: authId
    });
    if (error) {
      toast.error(error.message || 'Failed to unlock profile.');
      setViewingId(null);
      return;
    }
    setViewingId(null);
    navigate(`/employer/job-seeker-profile/${authId}`);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#f1f5f9] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#185a9d] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your saved videos...</p>
        </motion.div>
      </div>
    );
  }

  // Grid View for Desktop
  if (viewMode === 'grid' && filteredVideos.length > 0) {
  return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center py-12 px-2">
        {/* Header */}
        <div className="w-full flex justify-center pt-8 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">�� Saved Videos</h1>
            <p className="text-gray-600 mb-4">{filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} saved</p>
            
            {/* View Mode Toggle */}
            <div className="flex justify-center mb-6">
              <div className="flex bg-white rounded-full shadow-md p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gray-900 text-white shadow-sm hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  📋 Grid View
                </button>
                <button
                  onClick={() => setViewMode('reels')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode !== 'grid'
                      ? 'bg-gray-900 text-white shadow-sm hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  🎬 Reels View
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="w-full flex justify-center pb-6">
          <motion.div
            className={`flex items-center bg-[#f4f8fb] rounded-full shadow-lg px-2 py-1 gap-2 transition-all duration-300 border border-[#e3f0fa] ${searchFocused ? 'ring-2 ring-[#43cea2]' : ''}`}
            style={{ minWidth: 320, maxWidth: 480 }}
            onMouseEnter={() => setSearchFocused(true)}
            onMouseLeave={() => setSearchFocused(false)}
          >
            <input
              type="text"
              placeholder="Role / Designation"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`bg-transparent px-4 py-2 outline-none text-gray-900 text-base transition-all duration-200 w-32 ${searchFocused ? 'w-40' : ''}`}
              style={{ borderRight: '1px solid #e5e7eb' }}
            />
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`bg-transparent px-4 py-2 outline-none text-gray-900 text-base transition-all duration-200 w-32 ${searchFocused ? 'w-40' : ''}`}
            />
            <span className="px-2 text-gray-400">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            </span>
          </motion.div>
        </div>

        {/* Grid Layout */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#f4f8fb] rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-[#e3f0fa]"
              >
                {/* Video Container */}
                <div className="relative aspect-video bg-black">
                <video
                  src={video.intro_video_url}
                  poster={video.video_thumbnail_url}
                    className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                    onError={(e) => {
                      console.error('Video failed to load:', video.intro_video_url);
                      const videoElement = e.target as HTMLVideoElement;
                      videoElement.style.display = 'none';
                    }}
                  />
                  {/* Saved Badge */}
                  <div className="absolute top-2 right-2 bg-[#185a9d] text-white rounded-full px-2 py-1 text-xs font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    Saved
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {video.full_name || video.username || 'Job Seeker'}
                  </h3>
                  {video.title && (
                    <p className="text-sm text-gray-600 mb-2">{video.title}</p>
                  )}
                  <p className="text-sm text-gray-500 mb-1">
                    📍 {video.desired_location || 'Location not specified'}
                  </p>
                  {video.desired_roles && video.desired_roles.length > 0 && (
                    <p className="text-sm text-gray-400 mb-3">
                      🎯 {video.desired_roles.join(', ')}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleViewProfile(video.auth_id)}
                      disabled={viewingId === video.auth_id}
                      className="flex-1 px-3 py-2 bg-[#185a9d] text-white rounded-lg text-sm font-medium hover:bg-[#43cea2] transition-colors disabled:opacity-50"
                    >
                      {viewingId === video.auth_id ? 'Processing...' : 'View Profile'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRemoveVideo(video.id, video.auth_id)}
                      disabled={removingId === video.id}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {removingId === video.id ? '...' : '🗑️'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-sm w-full text-center"
              >
                <h2 className="text-xl font-bold mb-4 text-gray-900">Use 1 credit to view full profile?</h2>
                <p className="text-gray-600 mb-6">This action will deduct 1 credit from your balance.</p>
                <div className="flex gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => confirmViewProfile(showConfirm)}
                    className="px-6 py-2 bg-[#185a9d] text-white rounded-full font-semibold hover:bg-[#43cea2] transition-colors"
                  >
                    Continue
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowConfirm(null)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (filteredVideos.length === 0) {
    return (
      <div className="h-screen flex flex-col items-start justify-start bg-[#f1f5f9]">
        {/* Header */}
        <div className="w-full flex justify-center pt-8 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">�� Saved Videos</h1>
            <p className="text-gray-600">Your collection of favorite job seeker videos</p>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="w-full flex justify-center pb-4">
          <motion.div
            className={`flex items-center bg-[#f4f8fb] rounded-full shadow-lg px-2 py-1 gap-2 transition-all duration-300 border border-[#e3f0fa] ${searchFocused ? 'ring-2 ring-[#43cea2]' : ''}`}
            style={{ minWidth: 320, maxWidth: 480 }}
            onMouseEnter={() => setSearchFocused(true)}
            onMouseLeave={() => setSearchFocused(false)}
          >
            <input
              type="text"
              placeholder="Role / Designation"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`bg-transparent px-4 py-2 outline-none text-gray-900 text-base transition-all duration-200 w-32 ${searchFocused ? 'w-40' : ''}`}
              style={{ borderRight: '1px solid #e5e7eb' }}
            />
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`bg-transparent px-4 py-2 outline-none text-gray-900 text-base transition-all duration-200 w-32 ${searchFocused ? 'w-40' : ''}`}
            />
            <span className="px-2 text-gray-400">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            </span>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full">
          <motion.div 
            className="text-center text-gray-600"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-8xl mb-6">💾</div>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">No saved videos yet</h2>
            <p className="text-lg text-gray-500 mb-6">Start saving videos from Job Seeker Reels to see them here</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/employer/job-seeker-reels')}
              className="px-8 py-3 bg-[#185a9d] text-white rounded-full font-semibold shadow-lg hover:bg-[#43cea2] transition-all duration-200"
            >
              Explore Job Seeker Reels
            </motion.button>
          </motion.div>
                </div>
              </div>
    );
  }

  const currentVideo = filteredVideos[currentIndex];

  // --- MOBILE UI ---
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] pb-20 flex flex-col items-center">
        <div className="w-full max-w-md mx-auto px-2 pt-4">
          <h1 className="text-xl font-bold text-gray-900 mb-3 text-center">Saved Videos</h1>
          {/* Search/Filter Bar */}
          <form className="flex gap-2 mb-4">
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
          </form>
          {loading ? (
            <div className="w-full flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#185a9d]"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredVideos.length === 0 && (
                <div className="text-center text-gray-500 py-12">No saved videos yet.</div>
              )}
              {filteredVideos.map((video) => (
                <div key={video.id} className="bg-white rounded-xl border border-[#e3f0fa] shadow p-3 flex flex-col items-center">
                  <video
                    src={video.intro_video_url}
                    poster={video.video_thumbnail_url}
                    controls
                    className="rounded-lg w-full max-h-64 bg-black mb-2"
                    preload="metadata"
                  />
                  <div className="w-full flex flex-col items-center mb-2">
                    <span className="text-gray-800 font-medium text-sm">{video.full_name || video.username || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{video.title}</span>
                    <span className="text-xs text-gray-500">{video.desired_location || 'Not specified'}</span>
                    {video.desired_roles && video.desired_roles.length > 0 && (
                      <span className="text-xs text-gray-400">Roles: {video.desired_roles.join(', ')}</span>
                    )}
                  </div>
                  <div className="flex gap-2 w-full">
                    <button
                      className="flex-1 py-2 rounded-lg bg-[#185a9d] text-white text-xs font-semibold shadow"
                      onClick={() => handleViewProfile(video.auth_id)}
                      disabled={viewingId === video.auth_id}
                    >
                      {viewingId === video.auth_id ? 'Processing...' : 'View Profile'}
                    </button>
                    <button
                      className="flex-1 py-2 rounded-lg bg-red-100 text-red-600 text-xs font-semibold shadow"
                      onClick={() => handleRemoveVideo(video.id, video.auth_id)}
                      disabled={removingId === video.id}
                    >
                      {removingId === video.id ? '...' : 'Remove'}
                    </button>
                  </div>
                  {/* Confirmation Dialog */}
                  {showConfirm === video.auth_id && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                      <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full flex flex-col items-center">
                        <h2 className="text-base font-semibold mb-3 text-gray-900">Use 1 credit to view full profile?</h2>
                        <p className="text-gray-600 mb-4 text-center text-xs">This action will deduct 1 credit from your balance. Are you sure you want to continue?</p>
                        <div className="flex gap-2 w-full justify-center">
                          <button
                            className="flex-1 py-2 rounded-lg bg-[#185a9d] text-white text-xs font-semibold shadow"
                            onClick={() => confirmViewProfile(video.auth_id)}
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
    <div
      className="h-screen bg-[#f1f5f9] relative overflow-hidden flex flex-col"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="w-full flex justify-center pt-6 pb-2 z-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-1">�� Saved Videos</h1>
          <p className="text-sm text-gray-600 mb-3">{filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} saved</p>
          
          {/* View Mode Toggle */}
          <div className="flex justify-center mb-2">
            <div className="flex bg-white rounded-full shadow-md p-1">
                      <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📋 Grid
                      </button>
                      <button
                onClick={() => setViewMode('reels')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'reels'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🎬 Reels
                      </button>
                    </div>
                  </div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="w-full flex justify-center pb-4 z-20">
        <motion.div
          className={`flex items-center bg-[#f4f8fb] rounded-full shadow-lg px-2 py-1 gap-2 transition-all duration-300 border border-[#e3f0fa] ${searchFocused ? 'ring-2 ring-[#43cea2]' : ''}`}
          style={{ minWidth: 320, maxWidth: 480 }}
          onMouseEnter={() => setSearchFocused(true)}
          onMouseLeave={() => setSearchFocused(false)}
        >
          <input
            type="text"
            placeholder="Role / Designation"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`bg-transparent px-4 py-2 outline-none text-gray-900 text-base transition-all duration-200 w-32 ${searchFocused ? 'w-40' : ''}`}
            style={{ borderRight: '1px solid #e5e7eb' }}
          />
          <input
            type="text"
            placeholder="Location"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`bg-transparent px-4 py-2 outline-none text-gray-900 text-base transition-all duration-200 w-32 ${searchFocused ? 'w-40' : ''}`}
          />
          <span className="px-2 text-gray-400">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          </span>
        </motion.div>
                </div>

      {/* Main Video Display */}
      <div className="flex-1 flex items-center justify-center relative">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full max-w-md mx-auto"
        >
          {/* Video Player */}
          <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-900">
            <video
              ref={videoRef}
              src={currentVideo.intro_video_url}
              poster={currentVideo.video_thumbnail_url}
              className="w-full h-full object-cover"
              autoPlay={videoInView}
              loop
              muted
              playsInline
              onError={(e) => {
                console.error('Video failed to load:', currentVideo.intro_video_url);
                const videoElement = e.target as HTMLVideoElement;
                videoElement.style.display = 'none';
              }}
            />
            {/* Video Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* User Info */}
            <div className="absolute bottom-24 left-4 right-4 text-white">
              <h3 className="text-xl font-bold mb-2">
                {currentVideo.full_name || currentVideo.username || 'Job Seeker'}
              </h3>
              {currentVideo.title && (
                <p className="text-lg text-gray-200 mb-2">{currentVideo.title}</p>
              )}
              <p className="text-sm text-gray-300 mb-1">
                📍 {currentVideo.desired_location || 'Location not specified'}
              </p>
              {currentVideo.desired_roles && currentVideo.desired_roles.length > 0 && (
                <p className="text-sm text-gray-300">
                  🎯 {currentVideo.desired_roles.join(', ')}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-4 items-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRemoveVideo(currentVideo.id, currentVideo.auth_id)}
                disabled={removingId === currentVideo.id}
                className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold shadow-lg transition-all duration-200 text-lg bg-red-500 text-white hover:bg-red-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {removingId === currentVideo.id ? 'Removing...' : 'Remove'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleViewProfile(currentVideo.auth_id)}
                disabled={viewingId === currentVideo.auth_id}
                className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold shadow-lg transition-all duration-200 text-lg bg-[#185a9d] text-white hover:bg-[#43cea2]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {viewingId === currentVideo.auth_id ? 'Processing...' : 'View Full Profile'}
              </motion.button>
            </div>

            {/* Video Counter */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 text-white text-sm">
              {currentIndex + 1} / {filteredVideos.length}
            </div>

            {/* Saved Badge */}
            <div className="absolute top-4 right-4 bg-[#185a9d] text-white rounded-full px-3 py-1 text-sm font-semibold flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Saved
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Indicator */}
      {filteredVideos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {filteredVideos.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-[#185a9d] scale-125' 
                  : 'bg-[#e3f0fa] hover:bg-[#f4f8fb]'
              }`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows (Desktop) */}
      <div className="hidden md:block">
        {currentIndex > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentIndex(i => i - 1)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.button>
        )}
        {currentIndex < filteredVideos.length - 1 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentIndex(i => i + 1)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900">Use 1 credit to view full profile?</h2>
              <p className="text-gray-600 mb-6">This action will deduct 1 credit from your balance.</p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => confirmViewProfile(showConfirm)}
                  className="px-6 py-2 bg-[#185a9d] text-white rounded-full font-semibold hover:bg-[#43cea2] transition-colors"
                >
                  Continue
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowConfirm(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavedJobSeekerVideos; 
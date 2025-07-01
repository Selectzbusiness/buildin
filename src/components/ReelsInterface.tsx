import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabase';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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

interface ReelsInterfaceProps {
  reels: JobSeekerReel[];
  onSaveVideo: (jobSeekerAuthId: string) => Promise<void>;
  onViewProfile: (jobSeekerAuthId: string) => void;
  savingId: string | null;
  viewingId: string | null;
  showConfirm: string | null;
  onConfirmViewProfile: (jobSeekerAuthId: string) => void;
  onCancelViewProfile: () => void;
  savedVideoIds: string[];
}

const ReelsInterface: React.FC<ReelsInterfaceProps> = ({ 
  reels, 
  onSaveVideo, 
  onViewProfile, 
  savingId, 
  viewingId, 
  showConfirm, 
  onConfirmViewProfile, 
  onCancelViewProfile, 
  savedVideoIds
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [videoRef, videoInView] = useInView({ threshold: 0.5, triggerOnce: false });
  const minSwipeDistance = 50;

  // Real-time filtered reels
  const filteredReels = useMemo(() => {
    return reels.filter(reel => {
      const roleMatch = roleFilter.trim() === '' || (reel.desired_roles && reel.desired_roles.join(' ').toLowerCase().includes(roleFilter.toLowerCase()));
      const locationMatch = locationFilter.trim() === '' || (reel.desired_location && reel.desired_location.toLowerCase().includes(locationFilter.toLowerCase()));
      return roleMatch && locationMatch;
    });
  }, [reels, roleFilter, locationFilter]);

  // Reset index if filteredReels changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [filteredReels.length, roleFilter, locationFilter]);

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
    if (isUpSwipe && currentIndex < filteredReels.length - 1) {
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
        if (currentIndex < filteredReels.length - 1) setCurrentIndex(i => i + 1);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, filteredReels.length]);

  if (filteredReels.length === 0) {
    return (
      <div className="h-screen flex flex-col items-start justify-start bg-black">
        {/* Search Bar */}
        <div className="w-full flex justify-center pt-8 pb-4">
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
          <div className="text-center text-white opacity-70">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2">No job seeker videos available yet.</h2>
            <p className="text-gray-400">Try adjusting your search or filters.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentReel = filteredReels[currentIndex];

  return (
    <div
      className="h-screen bg-black relative overflow-hidden flex flex-col"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Search Bar */}
      <div className="w-full flex justify-center pt-8 pb-4 z-20">
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
      {/* Main Reel Display */}
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
              src={currentReel.intro_video_url}
              poster={currentReel.video_thumbnail_url}
              className="w-full h-full object-cover"
              autoPlay={videoInView}
              loop
              muted
              playsInline
              onError={(e) => {
                console.error('Video failed to load:', currentReel.intro_video_url);
                const videoElement = e.target as HTMLVideoElement;
                videoElement.style.display = 'none';
              }}
            />
            {/* Video Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* User Info */}
            <div className="absolute bottom-24 left-4 right-4 text-white">
              <h3 className="text-xl font-bold mb-2">
                {currentReel.full_name || currentReel.username || 'Job Seeker'}
              </h3>
              {currentReel.title && (
                <p className="text-lg text-gray-200 mb-2">{currentReel.title}</p>
              )}
              <p className="text-sm text-gray-300 mb-1">
                📍 {currentReel.desired_location || 'Location not specified'}
              </p>
              {currentReel.desired_roles && currentReel.desired_roles.length > 0 && (
                <p className="text-sm text-gray-300">
                  🎯 {currentReel.desired_roles.join(', ')}
                </p>
              )}
            </div>
            {/* Action Buttons */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-4 items-end">
              <button
                onClick={() => onSaveVideo(currentReel.auth_id)}
                disabled={savingId === currentReel.auth_id}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold shadow-lg transition-all duration-200 text-lg ${savedVideoIds.includes(currentReel.auth_id) ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
              >
                <svg className={`w-6 h-6 ${savedVideoIds.includes(currentReel.auth_id) ? 'fill-emerald-500' : 'fill-none stroke-emerald-500'}`} viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {savedVideoIds.includes(currentReel.auth_id) ? (savingId === currentReel.auth_id ? 'Saving...' : 'Saved') : (savingId === currentReel.auth_id ? 'Saving...' : 'Save')}
              </button>
              <button
                onClick={() => onViewProfile(currentReel.auth_id)}
                disabled={viewingId === currentReel.auth_id}
                className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold shadow-lg transition-all duration-200 text-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {viewingId === currentReel.auth_id ? 'Processing...' : 'View Full Profile'}
              </button>
            </div>
            {/* Video Counter */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 text-white text-sm">
              {currentIndex + 1} / {filteredReels.length}
            </div>
          </div>
        </motion.div>
      </div>
      {/* Progress Indicator */}
      {filteredReels.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {filteredReels.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
      {/* Navigation Arrows (Desktop) */}
      <div className="hidden md:block">
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex(i => i - 1)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
        {currentIndex < filteredReels.length - 1 && (
          <button
            onClick={() => setCurrentIndex(i => i + 1)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
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
                <button
                  onClick={() => onConfirmViewProfile(showConfirm)}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Continue
                </button>
                <button
                  onClick={onCancelViewProfile}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReelsInterface;
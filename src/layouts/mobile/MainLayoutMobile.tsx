import React, { useState, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import UploadsModal from '../../components/UploadsModal';
import NotificationCenter from '../../components/NotificationCenter';
import { FiUser, FiSettings, FiHeart, FiBriefcase, FiLogOut, FiArrowRight, FiHome, FiUpload, FiBell, FiBookOpen, FiMenu } from 'react-icons/fi';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useEffect } from 'react';
import AIAssistant from '../../components/AIAssistant';
import VideoVerifiedTag from '../../components/VideoVerifiedTag';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafeArea } from '../../hooks/useSafeArea';

const MainLayoutMobile: React.FC = () => {
  const { user, profile, setUser, setProfile, logout } = useContext(AuthContext) as any;
  const [showUploadsModal, setShowUploadsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAndroidApp, setIsAndroidApp] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const { statusBarHeight, bottomSafeArea, isNativePlatform } = useSafeArea();

  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      setIsAndroidApp(true);
    }
  }, []);

  // Handle Android hardware back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sub = CapacitorApp.addListener('backButton', () => {
      // Close transient overlays first
      if (showUploadsModal) {
        setShowUploadsModal(false);
        return;
      }
      if (showProfileMenu) {
        setShowProfileMenu(false);
        return;
      }
      // Navigate back if possible
      if (window.history.length > 1) {
        navigate(-1);
      }
    });
    return () => { sub.then((h) => h.remove()); };
  }, [showUploadsModal, showProfileMenu, navigate]);

  // Trigger animation when route changes
  useEffect(() => {
    setShouldAnimate(true);
    const timer = setTimeout(() => setShouldAnimate(false), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Real-time unread count for bell icon (independent of NotificationCenter)
  React.useEffect(() => {
    if (!profile?.auth_id) return;
    let subscription: any;
    let mounted = true;

    async function fetchUnread() {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, read')
        .eq('user_id', profile.auth_id)
        .eq('read', false);
      if (!error && data && mounted) setUnreadCount(data.length);
    }

    fetchUnread();
    subscription = supabase
      .channel('notifications-bell-main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.auth_id}` }, (payload: any) => {
        fetchUnread();
      })
      .subscribe();

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [profile?.auth_id]);

  // Updated bottom nav config
  const navItems = [
    {
      name: 'Home',
      icon: <FiHome className="w-6 h-6" style={{ color: '#10b981' }} />,
      path: '/',
    },
    {
      name: 'My Jobs',
      icon: <FiBriefcase className="w-6 h-6" style={{ color: '#185a9d' }} />,
      path: '/my-jobs',
    },
    {
      name: 'Uploads',
      icon: <FiUpload className="w-6 h-6" style={{ color: '#43cea2' }} />,
      action: () => setShowUploadsModal(true),
    },
    {
      name: 'Learning',
      icon: <FiBookOpen className="w-6 h-6" style={{ color: '#f59e42' }} />,
      path: '/learning',
    },
    {
      name: 'Menu',
      icon: <FiMenu className="w-6 h-6" style={{ color: '#6b7280' }} />,
      action: () => setShowProfileMenu(true),
    },
  ];

  // Animation variants for main content transitions
  const mainVariants = {
    default: { opacity: 1, y: 0 },
    home: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" as const } 
    },
    myJobs: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" as const } 
    },
    notificationsInitial: { opacity: 1, x: -100, scale: 1 },
    notifications: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
    learning: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" as const } 
    },
    upload: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" as const } 
    },
  };

  // Determine which animation to use based on route
  let mainAnim = 'default';
  let initialAnim: any = { opacity: 0, y: 60 };
  if (location.pathname === '/') {
    mainAnim = 'home';
  } else if (location.pathname === '/my-jobs') {
    mainAnim = 'myJobs';
  } else if (location.pathname === '/course-notifications') {
    mainAnim = 'notifications';
    initialAnim = { opacity: 1, x: -100, scale: 1 };
  } else if (location.pathname === '/learning') {
    mainAnim = 'learning';
  } else if (location.pathname === '/uploads' || showUploadsModal) {
    mainAnim = 'upload';
  }

  // Only animate if shouldAnimate is true
  const currentAnim = shouldAnimate ? mainAnim : 'default';
  const currentInitial = shouldAnimate ? initialAnim : { opacity: 1, y: 0 };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Status Bar Spacer for system icons */}
      <div style={{ height: 'env(safe-area-inset-top, 24px)' }} className="bg-white" />
      {/* Sticky Header with safe area padding */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100"
        style={{ paddingTop: 'env(safe-area-inset-top, 8px)' }}
      >
        {/* Removed logo and text for home page only */}
        <div className="flex items-center"></div>
        <div className="flex items-center gap-2">
          {profile && !!profile.intro_video_url && (
            <VideoVerifiedTag />
          )}
          {!profile && (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Login
            </button>
          )}
        </div>
      </div>
      {/* Main Content - full width */}
      <main className="flex-1 pb-20">
        <motion.div
          variants={mainVariants}
          initial={currentInitial}
          animate={currentAnim}
          className=""
        >
          <Outlet />
        </motion.div>
      </main>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 flex justify-between items-center px-2 h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {navItems.map((item, idx) => (
          <button
            key={item.name}
            className={`flex flex-col items-center justify-center flex-1 text-xs font-medium transition-colors duration-200 ${location.pathname === item.path ? 'text-[#185a9d]' : 'text-gray-600'}`}
            onClick={() => item.path ? navigate(item.path) : item.action && item.action()}
          >
            {item.icon}
            <span className="mt-1">{item.name}</span>
          </button>
        ))}
      </nav>
      
      {/* Bottom Safe Area Spacer */}
      {isNativePlatform && bottomSafeArea > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-white" 
          style={{ height: `${bottomSafeArea}px` }}
        ></div>
      )}
      {/* Uploads Modal */}
      <UploadsModal isOpen={showUploadsModal} onClose={() => setShowUploadsModal(false)} />
      
      {/* AI Assistant (mobile-friendly size and offset to avoid bottom nav) */}
      <AIAssistant size="small" offsetBottom={88} />
      {/* Profile Dropdown Modal */}
      {showProfileMenu && (
        <AnimatePresence>
          <motion.div
            key="menu-modal"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="font-semibold text-lg text-black">Menu</div>
              <button className="text-2xl text-gray-400" onClick={() => setShowProfileMenu(false)} aria-label="Close menu">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition shadow-sm">
                <FiUser className="w-6 h-6 text-emerald-500" />
                <span className="flex-1 text-base font-semibold text-black">Profile</span>
                <FiArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition shadow-sm">
                <FiSettings className="w-6 h-6 text-gray-500" />
                <span className="flex-1 text-base font-semibold text-black">Settings</span>
                <FiArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link to="/favourites" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition shadow-sm">
                <FiHeart className="w-6 h-6 text-pink-500" />
                <span className="flex-1 text-base font-semibold text-black">Favourites</span>
                <FiArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              {/* Switch to Employer Button */}
              <button onClick={async () => {
                setShowProfileMenu(false);
                if (!profile) {
                  navigate('/login');
                  return;
                }

                try {
                  // Check if user has company details
                  const { data: links, error: linkError } = await supabase
                    .from('employer_companies')
                    .select('company_id')
                    .eq('user_id', user?.id);

                  if (linkError) {
                    console.error('Error checking company profile:', linkError);
                    navigate('/employer/company-details');
                    return;
                  }

                  const companyIds = (links || []).map((l: any) => l.company_id);
                  let companyData = null;
                  if (companyIds.length > 0) {
                    const { data: companies, error: companiesError } = await supabase
                      .from('companies')
                      .select('*')
                      .in('id', companyIds)
                      .limit(1)
                      .single();
                    if (companiesError) {
                      console.error('Error fetching company profile:', companiesError);
                      navigate('/employer/company-details');
                      return;
                    }
                    companyData = companies;
                  }

                  if (companyData) {
                    // Company profile exists, redirect to employer dashboard
                    navigate('/employer/dashboard');
                  } else {
                    // No company profile, redirect to company details form
                    navigate('/employer/company-details');
                  }
                } catch (err) {
                  console.error('Error checking company profile:', err);
                  navigate('/employer/company-details');
                }
              }} className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition shadow-sm w-full text-left">
                <FiBriefcase className="w-6 h-6 text-blue-600" />
                <span className="flex-1 text-base font-semibold text-black">Post Jobs (Recruiter)</span>
                <FiArrowRight className="w-4 h-4 text-blue-400" />
              </button>
              <Link to="/course-notifications" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-4 p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition shadow-sm">
                <FiBell className="w-6 h-6 text-yellow-500" />
                <span className="flex-1 text-base font-semibold text-black">Course Notifications</span>
                <FiArrowRight className="w-4 h-4 text-yellow-400" />
              </Link>
              <button onClick={async () => {
                try {
                  await logout();
                  navigate('/login');
                  setShowProfileMenu(false);
                } catch (err) {
                  toast.error('Failed to sign out');
                }
              }} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-red-50 transition shadow-sm w-full text-left">
                <FiLogOut className="w-6 h-6 text-red-500" />
                <span className="flex-1 text-base font-semibold text-black">Sign Out</span>
                <FiArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default MainLayoutMobile; 
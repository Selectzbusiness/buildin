import React, { useState, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import UploadsModal from '../../components/UploadsModal';
import NotificationCenter from '../../components/NotificationCenter';
import { FiUser, FiSettings, FiHeart, FiBriefcase, FiLogOut, FiArrowRight, FiHome, FiUpload, FiBell } from 'react-icons/fi';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import VideoVerifiedTag from '../../components/VideoVerifiedTag';

const MainLayoutMobile: React.FC = () => {
  const { profile, setUser, setProfile } = useContext(AuthContext) as any;
  const [showUploadsModal, setShowUploadsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAndroidApp, setIsAndroidApp] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      setIsAndroidApp(true);
    }
  }, []);

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
      icon: <FiBriefcase className="w-6 h-6" style={{ color: '#6366f1' }} />,
      path: '/my-jobs',
    },
    {
      name: 'Uploads',
      icon: <FiUpload className="w-6 h-6" style={{ color: '#2563eb' }} />,
      action: () => setShowUploadsModal(true),
    },
    {
      name: 'Notifications',
      icon: (
        <span className="relative">
          <FiBell className="w-6 h-6" style={{ color: '#fbbf24' }} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold border-2 border-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </span>
      ),
      path: '/notifications',
    },
    {
      name: 'Profile',
      icon: <FiUser className="w-6 h-6" style={{ color: '#6b7280' }} />,
      action: () => setShowProfileMenu(true),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col safe-area-top" style={{ paddingTop: 'env(safe-area-inset-top, 32px)' }}>
      {/* Header with logo and login/signup button for mobile */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-2"
      >
        <div className="flex items-center">
          <img
            src="/selectz.logo.png"
            alt="Selectz Logo"
            className="w-7 h-7 mr-2 object-contain rounded-xl bg-white/20 backdrop-blur-sm shadow"
            style={{ background: 'rgba(24,90,157,0.08)' }}
          />
          <span className="text-lg font-bold text-[#185a9d] tracking-tight">Selectz</span>
        </div>
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
      {/* Main Content - Card style */}
      <main className="flex-1 pt-2 pb-20 px-2">
        <div className="card p-2 bg-white/90 shadow-lg rounded-2xl">
          <Outlet />
        </div>
      </main>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 flex justify-between items-center px-2 h-16">
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
      {/* Uploads Modal */}
      <UploadsModal isOpen={showUploadsModal} onClose={() => setShowUploadsModal(false)} />
      {/* Profile Dropdown Modal */}
      {showProfileMenu && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="font-semibold text-lg text-black">Menu</div>
            <button className="text-2xl text-gray-400" onClick={() => setShowProfileMenu(false)} aria-label="Close menu">&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="font-semibold text-lg text-black">{profile?.full_name || 'Profile'}</div>
              {profile?.intro_video_url && <VideoVerifiedTag />}
            </div>
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
            <Link to="/employer/dashboard" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition shadow-sm">
              <FiBriefcase className="w-6 h-6 text-blue-600" />
              <span className="flex-1 text-base font-semibold text-black">Post Jobs (Employer)</span>
              <FiArrowRight className="w-4 h-4 text-blue-400" />
            </Link>
            <button onClick={async () => {
              try {
                await supabase.auth.signOut();
                navigate('/login');
                setUser(null);
                setProfile(null);
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
        </div>
      )}
    </div>
  );
};

export default MainLayoutMobile; 
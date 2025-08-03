import React, { useContext, ReactElement } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FiMenu, FiX, FiUser, FiSettings, FiLogOut, FiArrowRight, FiBarChart2, FiCreditCard, FiVideo, FiBookmark, FiBriefcase, FiHome, FiBookOpen } from 'react-icons/fi';
import { useState } from 'react';
import { useSafeArea } from '../../hooks/useSafeArea';

const EmployerLayoutMobile: React.FC = () => {
  const { profile, setUser, setProfile, logout } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { statusBarHeight, bottomSafeArea, isNativePlatform } = useSafeArea();

  // Bottom nav items
  const navItems: {
    name: string;
    icon: ReactElement;
    path?: string;
    action?: () => void;
  }[] = [
    { name: 'Dashboard', icon: (
      <svg className="w-6 h-6 mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#185a9d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
    ), path: '/employer/dashboard' },
    { name: 'Reels', icon: (
      <svg className="w-6 h-6 mb-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#185a9d" strokeWidth="2"><rect x="3" y="5" width="15" height="14" rx="2"/><path d="M21 15V7a2 2 0 0 0-2-2h-2"/><polygon points="16 7 22 12 16 17 16 7"/></svg>
    ), path: '/employer/reels' },
    { name: 'Posted', icon: (
      <FiBriefcase className="w-6 h-6 mb-0.5" color="#185a9d" />
    ), path: '/employer/posted-mobile' },
    { name: 'Courses', icon: (
      <FiBookOpen className="w-6 h-6 mb-0.5" color="#185a9d" />
    ), path: '/employer/courses' },
    { name: 'Applications', icon: (
      <svg className="w-6 h-6 mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#185a9d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M16 3v4a1 1 0 0 0 1 1h4"></path></svg>
    ), path: '/employer/applications' },
    { name: 'Menu', icon: <FiMenu className="w-6 h-6 mb-0.5" color="#185a9d" />, action: () => setIsMenuOpen(true) },
  ];

  // Menu modal items (all remaining options)
  const menuNavItems = [
    { name: 'Saved Reels', path: '/employer/saved-videos', icon: <FiBookmark className="w-5 h-5 text-[#185a9d]" /> },
    { name: 'Billing', path: '/employer/billing', icon: <FiCreditCard className="w-5 h-5 text-[#185a9d]" /> },
    { name: 'Analytics', path: '/employer/analytics', icon: <FiBarChart2 className="w-5 h-5 text-[#185a9d]" /> },
    { name: 'Create Course', path: '/employer/course-create', icon: <FiBookOpen className="w-5 h-5 text-[#185a9d]" /> },
    { name: 'Course Analytics', path: '/employer/course-analytics', icon: <FiBarChart2 className="w-5 h-5 text-[#185a9d]" /> },
    { name: 'Course Settings', path: '/employer/course-settings', icon: <FiSettings className="w-5 h-5 text-[#185a9d]" /> },
    { name: 'Profile', path: '/employer/profile', icon: <FiUser className="w-5 h-5 text-[#185a9d]" /> },
    { name: 'Credits', path: '/employer/credits', icon: <FiCreditCard className="w-5 h-5 text-[#185a9d]" /> },
    { name: 'Settings', path: '/employer/settings', icon: <FiSettings className="w-5 h-5 text-[#185a9d]" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
      {/* Sticky Header with safe area padding */}
      <header
        className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#e3f0fa] flex items-center justify-between px-4 py-2 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top, 8px)' }}
      >
        <div className="flex items-center gap-2">
          <img
            src="/selectz.logo.png"
            alt="Selectz Logo"
            className="w-6 h-6 mr-1 object-contain rounded-xl bg-white/20 backdrop-blur-sm shadow"
            style={{ background: 'rgba(24,90,157,0.08)' }}
          />
          <span className="text-lg font-bold text-[#185a9d] tracking-tight">Selectz</span>
        </div>
        <button
          className="px-3 py-1 rounded-full bg-[#185a9d] text-white font-semibold text-xs shadow hover:bg-[#12406a] transition"
          onClick={() => navigate('/')}
        >
          Switch to Candidate
        </button>
      </header>
      {/* Main Content - Card style */}
      <main className="flex-1 pb-20 px-2">
        <div className="card p-2 bg-white/90 shadow-lg rounded-2xl">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 flex justify-between items-center px-2 h-16">
        {navItems.map((item, idx) => {
          const isActive = item.path ? window.location.pathname.startsWith(item.path) : false;
          return (
            <button
              key={item.name}
              className={`flex flex-col items-center justify-center flex-1 text-xs font-medium transition-colors duration-200 py-1 rounded-lg ${isActive ? 'bg-[#e3f0fa]' : ''} hover:bg-[#e3f0fa]`}
              onClick={() => item.path ? navigate(item.path) : item.action && item.action()}
              style={isActive ? { boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' } : {}}
            >
              {item.icon}
              <span className="mt-1 text-black">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <img
                src="/selectz.logo.png"
                alt="Selectz Logo"
                className="w-6 h-6 mr-1 object-contain rounded-xl bg-white/20 backdrop-blur-sm shadow"
                style={{ background: 'rgba(24,90,157,0.08)' }}
              />
              <span className="text-lg font-bold text-[#185a9d]">Selectz</span>
            </div>
            <button className="text-2xl text-gray-400" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">&times;</button>
          </div>
          <button
            className="m-4 mb-2 px-4 py-2 rounded-full bg-[#185a9d] text-white font-semibold text-sm shadow hover:bg-[#12406a] transition"
            onClick={() => { navigate('/'); setIsMenuOpen(false); }}
          >
            <span className="flex items-center gap-2"><FiArrowRight /> Switch to Candidate</span>
          </button>
          <nav className="flex flex-col p-4 gap-2 flex-1 overflow-y-auto">
            {menuNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50 hover:bg-[#e3f0fa] text-base font-semibold text-gray-700 shadow-sm transition group"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#e3f0fa] group-hover:bg-[#185a9d] group-hover:text-white transition">{item.icon}</span>
                <span className="flex-1 text-left">{item.name}</span>
                <FiArrowRight className="ml-auto text-gray-400 group-hover:text-[#185a9d] transition" />
              </button>
            ))}
            <button
                              onClick={async () => {
                  try {
                    await logout();
                    navigate('/login');
                    setIsMenuOpen(false);
                  } catch (err) {
                    alert('Failed to sign out');
                  }
                }}
              className="flex items-center gap-4 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-base font-semibold text-red-600 shadow-sm transition mt-4"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 group-hover:bg-red-200 transition"><FiLogOut className="w-5 h-5" /></span>
              <span className="flex-1 text-left">Sign Out</span>
              <FiArrowRight className="ml-auto text-red-300 group-hover:text-red-500 transition" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default EmployerLayoutMobile; 
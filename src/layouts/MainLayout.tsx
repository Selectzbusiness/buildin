import React, { useState, useRef, useEffect, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import UploadsModal from '../components/UploadsModal';
import AdvancedSearch from '../components/AdvancedSearch';
import NotificationCenter from '../components/NotificationCenter';
import MessagingSystem from '../components/MessagingSystem';
import AIAssistant from '../components/AIAssistant';
import useIsMobile from '../hooks/useIsMobile';
import MainLayoutMobile from './mobile/MainLayoutMobile';

const MainLayout: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUploadsModal, setShowUploadsModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 640);
  const closeDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  const handlePostJobsClick = () => {
    if (!profile) {
      navigate('/login');
    } else {
      navigate('/employer/dashboard');
    }
  };

  const handleUploadsClick = () => {
    setShowUploadsModal(true);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleDropdownMouseEnter = () => {
    if (closeDropdownTimeout.current) {
      clearTimeout(closeDropdownTimeout.current);
      closeDropdownTimeout.current = null;
    }
    setIsDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    if (isDesktop) {
      closeDropdownTimeout.current = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 150);
    }
  };

  if (isMobile) return <MainLayoutMobile />;

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
      {/* Header with logo for desktop only */}
      {!isMobile && (
        <div className="w-full flex items-center pt-6 pb-2 px-8">
          <img src="/selectz-logo.png" alt="Selectz Logo" className="w-10 h-10 mr-3" style={{objectFit: 'contain'}} />
          <span className="text-2xl font-extrabold tracking-tight select-none" style={{color: '#185a9d', letterSpacing: '0.01em'}}>Selectz</span>
        </div>
      )}
      {/* Navigation - Hidden on mobile */}
      <nav className="bg-white shadow-lg fixed w-full z-20 backdrop-blur-md rounded-b-2xl border-b border-[#e3f0fa] hidden md:block">
        <div className="w-full flex justify-center">
          <div className="max-w-7xl w-full px-4 flex justify-between h-16 items-center">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-3xl font-bold text-[#185a9d] tracking-tight hover:text-[#43cea2] transition-colors duration-200">
                  Selectz
                </Link>
              </div>
              {/* Desktop navigation - shifted to the right */}
              <div className="hidden md:flex md:items-center md:space-x-4 ml-auto">
                <Link
                  to="/"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out ${
                    isActive('/') 
                      ? 'text-[#185a9d] bg-[#e3f0fa] shadow-sm' 
                      : 'text-gray-700 hover:text-[#185a9d] hover:bg-[#e3f0fa] hover:shadow-sm'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/jobs"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out ${
                    isActive('/jobs') 
                      ? 'text-[#185a9d] bg-[#e3f0fa] shadow-sm' 
                      : 'text-gray-700 hover:text-[#185a9d] hover:bg-[#e3f0fa] hover:shadow-sm'
                  }`}
                >
                  Jobs
                </Link>
                <Link
                  to="/internships"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out ${
                    isActive('/internships') 
                      ? 'text-[#185a9d] bg-[#e3f0fa] shadow-sm' 
                      : 'text-gray-700 hover:text-[#185a9d] hover:bg-[#e3f0fa] hover:shadow-sm'
                  }`}
                >
                  Internships
                </Link>
                <button
                  onClick={handlePostJobsClick}
                  className="text-gray-700 hover:text-[#185a9d] px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover:bg-[#e3f0fa] active:bg-[#d1e7f7] rounded-md hover:shadow-sm"
                >
                  Post Jobs
                </button>
              </div>
            </div>

            {/* Right side navigation (User Menu) */}
            <div className="flex items-center space-x-2">
              {profile ? (
                <>
                  {/* Notification Bell */}
                  <button
                    className="relative px-3 py-2 text-gray-600 hover:text-[#185a9d] rounded-full transition-colors duration-200 hover:bg-[#e3f0fa] hover:shadow"
                    onClick={() => setShowNotifications((v) => !v)}
                    aria-label="Notifications"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {/* Notification badge can be added here if needed */}
                  </button>
                  <button
                    onClick={handleUploadsClick}
                    className="text-gray-700 hover:text-[#185a9d] px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover:bg-[#e3f0fa] active:bg-[#d1e7f7] rounded-md hover:shadow-sm"
                  >
                    Uploads
                  </button>
                  <div className="relative" ref={dropdownRef}
                    onMouseEnter={isDesktop ? handleDropdownMouseEnter : undefined}
                    onMouseLeave={isDesktop ? handleDropdownMouseLeave : undefined}
                  >
                    <button
                      type="button"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-[#e3f0fa] hover:bg-[#d1e7f7] focus:outline-none transition-colors duration-200 shadow-sm"
                      onClick={() => {
                        if (!isDesktop) setIsDropdownOpen((open) => !open);
                      }}
                      aria-haspopup="true"
                      aria-expanded={isDropdownOpen}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                    </button>
                    {isDropdownOpen && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-1 bg-white/90 backdrop-blur-md ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-[#e3f0fa]"
                        onMouseEnter={isDesktop ? handleDropdownMouseEnter : undefined}
                        onMouseLeave={isDesktop ? handleDropdownMouseLeave : undefined}
                      >
                        <div className="px-4 py-2 border-b border-[#e3f0fa]">
                          <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                        
                        {/* Simple Profile Link */}
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#e3f0fa] transition-colors duration-200 rounded-md"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        
                        <Link
                          to="#"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#e3f0fa] transition-colors duration-200 rounded-md"
                          onClick={(e) => { e.preventDefault(); setShowMessaging(true); setIsDropdownOpen(false); }}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Inbox
                        </Link>
                        <Link
                          to="/my-jobs"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          My Jobs
                        </Link>
                        <Link
                          to="/favourites"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Favourites
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-gray-50 transition-colors duration-200"
                          >
                            <svg className="w-5 h-5 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-[#185a9d] text-white hover:bg-[#185a9d] active:bg-[#0042a3] px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-16 pb-16 md:pb-0 w-full px-4">
        <Outlet />
      </main>

      {/* Uploads Modal */}
      <UploadsModal isOpen={showUploadsModal} onClose={() => setShowUploadsModal(false)} />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">About</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/about" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/help" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/privacy" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Connect</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="https://twitter.com" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="https://linkedin.com" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} Selectz. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Notification Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setShowNotifications(false)}
              aria-label="Close Notifications"
            >
              &times;
            </button>
            <NotificationCenter />
          </div>
        </div>
      )}

      {/* Messaging System Modal (Inbox) */}
      {showMessaging && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setShowMessaging(false)}
              aria-label="Close Messaging"
            >
              &times;
            </button>
            <MessagingSystem currentRole={profile?.company_id ? 'employer' : 'jobseeker'} />
          </div>
        </div>
      )}

      {/* AI Assistant */}
      <AIAssistant size="large" />
    </div>
  );
};

export default MainLayout;
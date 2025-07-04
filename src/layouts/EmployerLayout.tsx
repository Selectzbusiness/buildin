import React, { useState, useContext, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import AIAssistant from '../components/AIAssistant';
import toast from 'react-hot-toast';
import useIsMobile from '../hooks/useIsMobile';
import EmployerLayoutMobile from './mobile/EmployerLayoutMobile';

const EmployerLayout: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { profile, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkCompanyProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Skip check if already on company-details page
      if (location.pathname === '/employer/company-details' || 
          location.pathname === '/employer/reels' ||
          location.pathname === '/employer/saved-videos' ||
          location.pathname === '/employer/credits') {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (error || !data) {
          toast('Please complete your company profile to access employer features.');
          navigate('/employer/company-details');
          return;
        }
      } catch (err) {
        console.error('Error checking company profile:', err);
        toast('Error checking company profile. Please try again.');
        navigate('/employer/company-details');
      }
    };

    checkCompanyProfile();
  }, [user, navigate, location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (isMobile) return <EmployerLayoutMobile />;

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Top Navigation - Hidden on mobile */}
      <nav className="bg-white/90 backdrop-blur-md shadow-lg fixed w-full z-10 rounded-b-2xl border-b border-[#e3f0fa] hidden md:block">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <div>
                <Link to="/employer" className="text-3xl font-bold text-[#185a9d] tracking-tight hover:text-[#43cea2] transition-colors duration-200">
                  Selectz
                </Link>
              </div>
              <button
                onClick={() => navigate('/')}
                className="hidden md:block text-gray-600 hover:text-[#185a9d] transition-colors duration-200"
              >
                 Switch to Jobseeker
              </button>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <button
                  type="button"
                  className="bg-[#e3f0fa] rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#43cea2] transition-all duration-300 ease-in-out hover:bg-[#d1e7f7] shadow-sm"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-[#185a9d] flex items-center justify-center">
                    <span className="text-white font-medium">
                      {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>
                {isSettingsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 bg-white/90 backdrop-blur-md ring-1 ring-black ring-opacity-5 focus:outline-none border border-[#e3f0fa]">
                    <Link
                      to="/employer/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#e3f0fa] active:bg-[#d1e7f7] transition-colors duration-200 rounded-md"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/employer/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#e3f0fa] active:bg-[#d1e7f7] transition-colors duration-200 rounded-md"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#e3f0fa] active:bg-[#d1e7f7] transition-colors duration-200 rounded-md"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar and Main Content */}
      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white/90 backdrop-blur-md shadow-lg h-screen fixed rounded-r-2xl border-r border-[#e3f0fa]">
          <div className="p-4">
            <nav className="space-y-1">
              <Link
                to="/employer/dashboard"
                className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 ${
                  isActive('/employer/dashboard') ? 'text-black bg-[#e3f0fa] shadow' : 'text-gray-700 hover:bg-[#e3f0fa] hover:text-black hover:shadow'
                }`}
              >
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link
                to="/employer/jobs"
                className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 ${
                  isActive('/employer/jobs') ? 'text-black bg-[#e3f0fa] shadow' : 'text-gray-700 hover:bg-[#e3f0fa] hover:text-black hover:shadow'
                }`}
              >
                <span className="text-sm font-medium">Posted Jobs</span>
              </Link>
              <Link
                to="/employer/internships"
                className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 ${
                  isActive('/employer/internships') ? 'text-black bg-[#e3f0fa] shadow' : 'text-gray-700 hover:bg-[#e3f0fa] hover:text-black hover:shadow'
                }`}
              >
                <span className="text-sm font-medium">Posted Internships</span>
              </Link>
              <Link
                to="/employer/applications"
                className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 ${
                  isActive('/employer/applications') ? 'text-black bg-[#e3f0fa] shadow' : 'text-gray-700 hover:bg-[#e3f0fa] hover:text-black hover:shadow'
                }`}
              >
                <span className="text-sm font-medium">Applications</span>
              </Link>
              <Link
                to="/employer/billing"
                className="flex items-center px-4 py-3 text-gray-700 rounded-xl transition-colors duration-200 hover:bg-[#e3f0fa] hover:text-black hover:shadow"
              >
                <span className="text-sm font-medium">Billing</span>
              </Link>
              <Link
                to="/employer/analytics"
                className="flex items-center px-4 py-3 text-gray-700 rounded-xl transition-colors duration-200 hover:bg-[#e3f0fa] hover:text-black hover:shadow"
              >
                <span className="text-sm font-medium">Analytics</span>
              </Link>
              
              {/* Phase 3 Features - Reverse Hiring */}
              <div className="pt-4 border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reverse Hiring
                </div>
                <Link
                  to="/employer/reels"
                  className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 ${
                    isActive('/employer/reels') ? 'text-black bg-[#e3f0fa] shadow' : 'text-gray-700 hover:bg-[#e3f0fa] hover:text-black hover:shadow'
                  }`}
                >
                  <span className="text-sm font-medium">Job Seeker Reels</span>
                </Link>
                <Link
                  to="/employer/saved-videos"
                  className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 ${
                    isActive('/employer/saved-videos') ? 'text-black bg-[#e3f0fa] shadow' : 'text-gray-700 hover:bg-[#e3f0fa] hover:text-black hover:shadow'
                  }`}
                >
                  <span className="text-sm font-medium">Saved Videos</span>
                </Link>
                <Link
                  to="/employer/credits"
                  className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gradient-to-br from-[#43cea2] via-[#185a9d] to-[#2b5876] hover:text-gradient-to-r from-[#43cea2] to-[#185a9d] rounded-xl transition-colors duration-200 ${
                    isActive('/employer/credits') ? 'bg-gradient-to-br from-[#43cea2] via-[#185a9d] to-[#2b5876] text-gradient-to-r from-[#43cea2] to-[#185a9d]' : ''
                  }`}
                >
                  <span className="text-sm font-medium">Credits</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pb-16 md:pb-0">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">About</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/employer/about" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/employer/careers" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/employer/help" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/employer/contact" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/employer/privacy" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/employer/terms" className="text-base text-gray-500 hover:text-gray-900 transition-colors duration-200">
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

      {/* AI Assistant */}
      <AIAssistant size="large" />
    </div>
  );
};

export default EmployerLayout;
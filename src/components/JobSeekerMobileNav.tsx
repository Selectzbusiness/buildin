import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import ExploreIcon from './icons/ExploreIcon';
import InboxIcon from './icons/InboxIcon';
import ProfileIcon from './icons/ProfileIcon';

interface JobSeekerMobileNavProps {
  onInboxClick?: () => void;
}

const JobSeekerMobileNav: React.FC<JobSeekerMobileNavProps> = ({ onInboxClick }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handlePostJobsClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/employer/dashboard');
    }
    setIsMenuOpen(false); // Close menu after navigation
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    setIsMenuOpen(false); // Close menu after logout
  };

  const navItems = [
    { name: 'Home', icon: ExploreIcon, path: '/' },
    { name: 'Jobs', icon: ExploreIcon, path: '/jobs' },
    { name: 'Internships', icon: ExploreIcon, path: '/internships' },
    { name: 'Inbox', icon: InboxIcon, path: '/inbox' },
  ];

  const menuItems = [
    { name: 'Profile', icon: ProfileIcon, path: '/profile' },
    { name: 'Settings', icon: ProfileIcon, path: '/settings' },
    { name: 'Favourites', icon: ProfileIcon, path: '/favorites' },
    { name: 'My Jobs', icon: ProfileIcon, path: '/my-jobs' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
      <nav className="flex justify-around h-16 items-center">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center text-xs font-medium transition-colors duration-200 ${isActive(item.path) ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <item.icon />
            <span className="mt-1">{item.name}</span>
          </Link>
        ))}
        <button
          onClick={() => setIsMenuOpen(true)}
          className={`flex flex-col items-center justify-center text-xs font-medium transition-colors duration-200 ${isMenuOpen ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span className="mt-1">Menu</span>
        </button>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <nav className="flex flex-col p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(item.path) ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={handlePostJobsClick}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
            >
              Post Jobs
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default JobSeekerMobileNav; 
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ApplicationsIcon from './icons/ApplicationsIcon';
import BillingIcon from './icons/BillingIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';
import ProfileIcon from './icons/ProfileIcon';
import CompanyInfoIcon from './icons/CompanyInfoIcon';
import InboxIcon from './icons/InboxIcon';

// Placeholder icons for demonstration. You might want to create specific ones.
const DashboardIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
);

const PostedJobsIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M22 11.08V12a10 10 0 1 1-5.93-8.11"></path><path d="M22 4L12 14.01l-3-3"></path></svg>
);

const PostedInternshipsIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 2V6"></path><path d="M8 2V6"></path><line x1="1" y1="10" x2="23" y2="10"></line></svg>
);

const EmployerMobileNav: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const primaryNavItems = [
    { name: 'Dashboard', icon: DashboardIcon, path: '/employer/dashboard' },
    { name: 'Jobs', icon: PostedJobsIcon, path: '/employer/jobs' },
    { name: 'Internships', icon: PostedInternshipsIcon, path: '/employer/internships' },
    { name: 'Applications', icon: ApplicationsIcon, path: '/employer/applications' },
    { name: 'Inbox', icon: InboxIcon, path: '/employer/inbox' },
  ];

  const menuNavItems = [
    { name: 'Billing', icon: BillingIcon, path: '/employer/billing' },
    { name: 'Analytics', icon: AnalyticsIcon, path: '/employer/analytics' },
    { name: 'Profile', icon: ProfileIcon, path: '/employer/profile' },
    { name: 'Company Info', icon: CompanyInfoIcon, path: '/employer/company-info' },
    { name: 'Job Seeker Reels', icon: () => <span className="text-lg">🎥</span>, path: '/employer/reels' },
    { name: 'Saved Videos', icon: () => <span className="text-lg">💾</span>, path: '/employer/saved-videos' },
    { name: 'Credits', icon: () => <span className="text-lg">💳</span>, path: '/employer/credits' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
      <nav className="flex justify-around h-16 items-center">
        {primaryNavItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center text-xs font-medium transition-colors duration-200 ${isActive(item.path) ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {item.icon && <item.icon />}
            <span className="mt-1">{item.name}</span>
          </Link>
        ))}
        {/* Menu Button */}
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

      {/* Full-screen Modal for Menu */}
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
            {menuNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(item.path) ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default EmployerMobileNav; 
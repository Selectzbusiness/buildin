import React, { useState, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import UploadsModal from '../../components/UploadsModal';
import { FiUser, FiSettings, FiHeart, FiBriefcase, FiLogOut, FiArrowRight, FiHome, FiInbox, FiUpload } from 'react-icons/fi';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

const MainLayoutMobile: React.FC = () => {
  const { profile } = useContext(AuthContext) as any;
  const [showUploadsModal, setShowUploadsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
      name: 'Inbox',
      icon: <FiInbox className="w-6 h-6" style={{ color: '#f59e42' }} />,
      path: '/inbox',
    },
    {
      name: 'Profile',
      icon: <FiUser className="w-6 h-6" style={{ color: '#6b7280' }} />,
      action: () => setShowProfileMenu(true),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
      {/* Remove sticky header search bar. Only use Home page search bar. */}

      {/* Main Content - Card style */}
      <main className="flex-1 pt-2 pb-20 px-2">
        <div className="card p-2 bg-white/90 shadow-lg rounded-2xl">
          <Outlet />
        </div>
      </main>

      {/* Airbnb-style Bottom Navigation */}
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
            <div className="font-semibold text-lg text-black mb-4">{profile?.full_name || 'Profile'}</div>
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
            <button onClick={() => { navigate('/employer/dashboard'); setShowProfileMenu(false); }} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition shadow-sm w-full text-left">
              <FiBriefcase className="w-6 h-6 text-indigo-500" />
              <span className="flex-1 text-base font-semibold text-black">Post Jobs</span>
              <FiArrowRight className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={async () => {
              try {
                await supabase.auth.signOut();
                setShowProfileMenu(false);
                navigate('/login');
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
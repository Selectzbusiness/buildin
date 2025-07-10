import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheckCircle, FiXCircle, FiClock, FiVideo, FiMail, FiInfo } from 'react-icons/fi';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'application' | 'status_update' | 'system' | 'reminder';
  read: boolean;
  created_at: string;
  data?: any;
}

const NotificationCenter: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Set up real-time subscription
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(showAll ? 50 : 10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleClick = (notif: Notification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return (
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'status_update':
        return (
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="p-2 bg-gray-100 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'reminder':
        return (
          <div className="p-2 bg-yellow-100 rounded-lg">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-16 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile() ? "bg-[#f1f5f9] min-h-screen flex flex-col" : "bg-white rounded-2xl shadow-2xl p-0 animate-fade-in max-h-[80vh] overflow-y-auto w-full max-w-lg border border-gray-100"}>
      {/* Header */}
      {isMobile() ? (
        <header className="sticky top-0 z-10 bg-gradient-to-r from-[#e3f0fa] to-[#f8fafc] flex items-center gap-3 px-4 py-4 border-b border-gray-100 shadow-sm">
          <FiBell className="w-7 h-7 text-[#185a9d]" />
          <h1 className="text-2xl font-bold text-[#185a9d] tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-bounce font-semibold">
              {unreadCount}
            </span>
          )}
        </header>
      ) : (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#e3f0fa] to-[#f8fafc] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <FiBell className="w-7 h-7 text-[#185a9d]" />
            <h2 className="text-2xl font-bold text-[#185a9d] tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-bounce font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      )}
      <div className={isMobile() ? "flex-1 flex flex-col gap-2 p-0" : "space-y-0 divide-y divide-gray-100"}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <FiInfo className="w-12 h-12 text-gray-300 mb-4" />
            <div className="text-lg font-semibold text-gray-500 mb-2">No notifications yet</div>
            <div className="text-gray-400 text-sm">You'll see updates about your applications here.</div>
          </div>
        ) : (
          notifications.map((n, idx) => {
            // Determine status chip and icon
            let statusChip = null;
            let icon = <FiMail className="w-5 h-5 text-blue-400" />;
            if (/shortlist|accepted/i.test(n.title)) {
              statusChip = <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold ml-2">Accepted</span>;
              icon = <FiCheckCircle className="w-6 h-6 text-emerald-500" />;
            } else if (/reject/i.test(n.title)) {
              statusChip = <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold ml-2">Rejected</span>;
              icon = <FiXCircle className="w-6 h-6 text-red-500" />;
            } else if (/interview/i.test(n.title)) {
              statusChip = <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold ml-2">Interview</span>;
              icon = <FiClock className="w-6 h-6 text-blue-500" />;
            } else if (/video/i.test(n.title)) {
              statusChip = <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold ml-2">Video</span>;
              icon = <FiVideo className="w-6 h-6 text-orange-500" />;
            }
            return (
              <div
                key={n.id}
                className={isMobile()
                  ? `flex flex-col px-4 py-5 transition-all duration-200 group relative rounded-2xl shadow-sm bg-white border mb-2 cursor-pointer ${n.read ? 'border-gray-100 opacity-70' : 'border-red-400'} active:bg-blue-50`
                  : `flex flex-col px-6 py-5 transition-all duration-200 group relative rounded-2xl shadow-sm bg-white border mb-2 cursor-pointer ${n.read ? 'border-gray-100 opacity-70' : 'border-red-400'} hover:bg-blue-50`}
                tabIndex={0}
                onClick={() => handleClick(n)}
                onKeyDown={e => { if (e.key === 'Enter') handleClick(n); }}
                style={isMobile() ? { boxShadow: n.read ? 'none' : '0 2px 8px 0 rgba(239,68,68,0.1)' } : { boxShadow: n.read ? 'none' : '0 2px 8px 0 rgba(239,68,68,0.1)' }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold text-lg ${n.read ? 'text-gray-700' : 'text-[#185a9d]'}`}>{n.title}</span>
                      {statusChip}
                      {!n.read && <span className="ml-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold">New</span>}
                    </div>
                    <p className="text-gray-600 text-base mb-2 group-hover:text-gray-900 transition-colors duration-200">{n.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <FiClock className="w-4 h-4" />
                      <span>{formatTimeAgo(n.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
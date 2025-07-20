import React, { useEffect, useState, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AuthContext } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import useIsMobile from '../../hooks/useIsMobile';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function CourseNotifications() {
  const { user } = useContext(AuthContext);
  const user_id = user?.id;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user_id) fetchNotifications();
  }, [user_id]);

  async function fetchNotifications() {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('course_notifications')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
      // Mark all as read
      await supabase
        .from('course_notifications')
        .update({ read: true })
        .eq('user_id', user_id)
        .eq('read', false);
    } catch (err) {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden">
      <div className="relative z-10 max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900 animate-bounceIn">Course Notifications</h1>
        {error && <div className="text-red-500 mb-4 animate-fadeIn">{error}</div>}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185a9d] loading-shimmer"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-400 py-20 animate-fadeIn">No notifications yet.</div>
        ) : (
          <ul className="space-y-4 animate-fadeIn">
            <AnimatePresence>
              {notifications.map((n, i) => (
                <motion.li
                  key={n.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className={`glass-card rounded-xl p-4 shadow-lg flex flex-col gap-1 animate-fadeIn border border-gray-200 ${n.read ? 'bg-gray-100/80' : 'bg-blue-50/80'}`}
                >
                  <div className="font-semibold text-[#185a9d] animate-fadeIn">{n.type === 'enrollment' ? 'Enrollment' : n.type === 'approval' ? 'Approval' : 'Course Update'}</div>
                  <div className="text-gray-700 animate-fadeIn">{n.message}</div>
                  <div className="text-xs text-gray-400 mt-1 animate-fadeIn">{new Date(n.created_at).toLocaleString()}</div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
} 
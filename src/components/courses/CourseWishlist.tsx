import React, { useEffect, useState, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import useIsMobile from '../../hooks/useIsMobile';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function CourseWishlist() {
  const { user } = useContext(AuthContext);
  const user_id = user?.id;
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user_id) fetchWishlist();
  }, [user_id]);

  async function fetchWishlist() {
    setLoading(true);
    setError('');
    try {
      const { data: favData, error: favError } = await supabase
        .from('course_favorites')
        .select('course_id')
        .eq('user_id', user_id);
      if (favError) throw favError;
      const courseIds = (favData || []).map((f: any) => f.course_id);
      if (courseIds.length > 0) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);
        setCourses(courseData || []);
      } else {
        setCourses([]);
      }
      setWishlist(favData || []);
    } catch (err) {
      setError('Failed to load wishlist.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden">
      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900 animate-bounceIn">My Wishlist</h1>
        {error && <div className="text-red-500 mb-4 animate-fadeIn">{error}</div>}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185a9d] loading-shimmer"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center text-gray-400 py-20 animate-fadeIn">No courses in your wishlist yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            <AnimatePresence>
              {courses.map(course => (
                <motion.div
                  key={course.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover={{ scale: 1.04 }}
                  className="glass-card bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 cursor-pointer hover:scale-105 transition-all duration-200 animate-fadeIn border border-gray-200"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <img
                    src={course.cover_photo_url || '/default-course-cover.png'}
                    alt="Cover"
                    className="w-full h-40 object-cover rounded-xl border-2 border-[#185a9d]/20 shadow mb-2 animate-fadeIn"
                  />
                  <h2 className="text-xl font-bold text-[#185a9d] mb-1 truncate animate-fadeIn">{course.title}</h2>
                  <div className="text-gray-700 text-sm truncate mb-1 animate-fadeIn">{course.description}</div>
                  <div className="flex gap-2 items-center text-sm mb-1 animate-fadeIn">
                    <span className={`px-2 py-1 rounded-full font-semibold ${course.is_free ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{course.is_free ? 'Free' : `₹${course.price}`}</span>
                    <span className={`px-2 py-1 rounded-full font-semibold ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{course.status === 'published' ? 'Published' : 'Draft'}</span>
                  </div>
                  <div className="text-xs text-gray-500 animate-fadeIn">By Employer</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
} 
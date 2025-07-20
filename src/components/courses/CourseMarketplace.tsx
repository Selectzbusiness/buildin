import React, { useEffect, useState, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import useIsMobile from '../../hooks/useIsMobile';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function CourseMarketplace() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const user_id = user?.id;
  const [wishlist, setWishlist] = useState<string[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchCourses();
    if (user_id) fetchWishlist();
  }, [user_id]);

  async function fetchCourses() {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchWishlist() {
    const { data } = await supabase
      .from('course_favorites')
      .select('course_id')
      .eq('user_id', user_id);
    setWishlist((data || []).map((f: any) => f.course_id));
  }

  async function toggleWishlist(courseId: string) {
    if (!user_id) return;
    if (wishlist.includes(courseId)) {
      // Remove from wishlist
      await supabase
        .from('course_favorites')
        .delete()
        .eq('user_id', user_id)
        .eq('course_id', courseId);
      setWishlist(wishlist.filter(id => id !== courseId));
    } else {
      // Add to wishlist
      await supabase
        .from('course_favorites')
        .insert({ user_id, course_id: courseId });
      setWishlist([...wishlist, courseId]);
    }
  }

  function filteredCourses() {
    let filtered = courses;
    if (filter === 'free') filtered = filtered.filter(c => c.is_free);
    if (filter === 'paid') filtered = filtered.filter(c => !c.is_free);
    if (search.trim()) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return filtered;
  }

  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden">
      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900 animate-bounceIn">Courses</h1>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 animate-fadeIn">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#185a9d] bg-white search-bar-glow"
          />
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-xl font-semibold border-2 transition-all duration-200 ${filter === 'all' ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white border-[#185a9d]' : 'bg-gray-100 text-[#185a9d] border-[#185a9d]'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-xl font-semibold border-2 transition-all duration-200 ${filter === 'free' ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white border-[#185a9d]' : 'bg-gray-100 text-[#185a9d] border-[#185a9d]'}`}
              onClick={() => setFilter('free')}
            >
              Free
            </button>
            <button
              className={`px-4 py-2 rounded-xl font-semibold border-2 transition-all duration-200 ${filter === 'paid' ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white border-[#185a9d]' : 'bg-gray-100 text-[#185a9d] border-[#185a9d]'}`}
              onClick={() => setFilter('paid')}
            >
              Paid
            </button>
          </div>
        </div>
        {error && <div className="text-red-500 mb-4 animate-fadeIn">{error}</div>}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185a9d] loading-shimmer"></div>
          </div>
        ) : filteredCourses().length === 0 ? (
          <div className="text-center text-gray-400 py-20 animate-fadeIn">No courses found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            <AnimatePresence>
              {filteredCourses().map(course => (
                <motion.div
                  key={course.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover={{ scale: 1.04 }}
                  className="glass-card bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 cursor-pointer hover:scale-105 transition-all duration-200 relative animate-fadeIn border border-gray-200"
                  onClick={e => { if ((e.target as HTMLElement).closest('.wishlist-btn')) return; navigate(`/courses/${course.id}`); }}
                >
                  <button
                    className="wishlist-btn absolute top-4 right-4 text-2xl z-10"
                    onClick={e => { e.stopPropagation(); toggleWishlist(course.id); }}
                    aria-label={wishlist.includes(course.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {wishlist.includes(course.id) ? <FaHeart className="text-[#185a9d] animate-bounceIn" /> : <FaRegHeart className="text-gray-400 hover:text-[#185a9d] animate-fadeIn" />}
                  </button>
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
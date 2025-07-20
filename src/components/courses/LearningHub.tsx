import React, { useEffect, useState, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight, FaHeart, FaBell, FaBookOpen, FaUserGraduate, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import useIsMobile from '../../hooks/useIsMobile';
import { useRef } from 'react';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

const deepOceanBlue = 'linear-gradient(90deg, #185a9d 0%, #43cea2 100%)';

const heroVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function LearningHub() {
  const { user } = useContext(AuthContext);
  const user_id = user?.id;
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLearningData();
    fetchAllCourses();
    fetchNotificationsPreview();
  }, [user_id]);

  async function fetchLearningData() {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching featured courses...');
      // Featured: top 10 published courses
      const { data: featuredData, error: featuredError } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (featuredError) {
        console.error('Error fetching featured courses:', featuredError);
        setError('Failed to load featured courses');
      } else {
        console.log('Featured courses fetched:', featuredData);
        setFeatured(featuredData || []);
      }

      // My Courses
      if (user_id) {
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user_id);
        const courseIds = (enrollData || []).map((e: any) => e.course_id);
        if (courseIds.length > 0) {
          const { data: myCourseData } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds);
          setMyCourses(myCourseData || []);
        } else {
          setMyCourses([]);
        }
        // Wishlist
        const { data: favData } = await supabase
          .from('course_favorites')
          .select('course_id')
          .eq('user_id', user_id);
        const favIds = (favData || []).map((f: any) => f.course_id);
        if (favIds.length > 0) {
          const { data: wishData } = await supabase
            .from('courses')
            .select('*')
            .in('id', favIds);
          setWishlist(wishData || []);
        } else {
          setWishlist([]);
        }
      }
    } catch (err) {
      console.error('Error in fetchLearningData:', err);
      setError('Failed to load learning data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllCourses() {
    try {
      console.log('Fetching all courses...');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all courses:', error);
      } else {
        console.log('All courses fetched:', data);
        setAllCourses(data || []);
      }
    } catch (err) {
      console.error('Error in fetchAllCourses:', err);
    }
  }

  async function fetchNotificationsPreview() {
    if (!user_id) {
      setNotifications([]);
      setNotifLoading(false);
      return;
    }
    setNotifLoading(true);
    setNotifError('');
    try {
      const { data, error } = await supabase
        .from('course_notifications')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(2);
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      setNotifError('Failed to load notifications.');
    } finally {
      setNotifLoading(false);
    }
  }

  // Carousel auto-scroll logic
  useEffect(() => {
    if (!carouselRef.current) return;
    let interval: any;
    function autoScroll() {
      if (!carouselRef.current) return;
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
    interval = setInterval(autoScroll, 3500);
    return () => clearInterval(interval);
  }, [featured.length]);

  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden">
      {/* Four Main Action Buttons */}
      <div className={`max-w-7xl mx-auto px-2 md:px-8 ${isMobile ? 'grid grid-cols-2 gap-3' : 'flex flex-row gap-4'} mb-6 mt-6`}>
        <button
          className={`font-bold shadow-lg transition-all duration-200 rounded-xl border ${isMobile ? 'px-4 py-2 text-sm' : 'px-8 py-4 text-lg'} bg-gradient-to-r from-[#0f3d5f] via-[#185a9d] to-[#43cea2] text-white border-none`}
          onClick={() => navigate('/courses')}
        >
          Explore Courses <FaBookOpen className="inline ml-2" />
        </button>
        <button
          className={`font-bold shadow-lg transition-all duration-200 rounded-xl border ${isMobile ? 'px-4 py-2 text-sm' : 'px-8 py-4 text-lg'} bg-gradient-to-r from-[#0f3d5f] via-[#185a9d] to-[#43cea2] text-white border-none`}
          onClick={() => navigate('/my-courses')}
        >
          My Courses <FaUserGraduate className="inline ml-2" />
        </button>
        <button
          className={`font-bold shadow-lg transition-all duration-200 rounded-xl border ${isMobile ? 'px-4 py-2 text-sm' : 'px-8 py-4 text-lg'} bg-gradient-to-r from-[#0f3d5f] via-[#185a9d] to-[#43cea2] text-white border-none`}
          onClick={() => navigate('/my-wishlist')}
        >
          Wishlist <FaHeart className="inline ml-2" />
        </button>
        <button
          className={`font-bold shadow-lg transition-all duration-200 rounded-xl border ${isMobile ? 'px-4 py-2 text-sm' : 'px-8 py-4 text-lg'} bg-gradient-to-r from-[#0f3d5f] via-[#185a9d] to-[#43cea2] text-white border-none`}
          onClick={() => navigate('/course-notifications')}
        >
          Notifications <FaBell className="inline ml-2" />
        </button>
      </div>
      {/* Featured Courses Carousel */}
      <div className="max-w-7xl mx-auto px-2 md:px-8 mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Courses</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#185a9d]"></div>
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No featured courses available</div>
        ) : (
          <div className="relative">
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full shadow p-2 hidden md:block"
              onClick={() => carouselRef.current && carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' })}
              aria-label="Scroll Left"
            >
              <FaChevronLeft />
            </button>
            <div ref={carouselRef} className="overflow-x-auto flex gap-6 pb-2 hide-scrollbar scroll-smooth snap-x snap-mandatory">
              {featured.map(course => (
                <div
                  key={course.id}
                  className="min-w-[320px] max-w-[320px] h-[200px] md:h-[240px] rounded-2xl shadow-xl border border-gray-200 bg-white relative cursor-pointer group snap-start overflow-hidden flex items-end"
                  onClick={() => navigate(`/courses/${course.id}`)}
                  style={{ backgroundImage: `url(${course.cover_photo_url || '/default-course-cover.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0" />
                  <div className="relative z-10 p-4 w-full">
                    <h3 className="text-xl font-bold text-white drop-shadow mb-1 truncate group-hover:underline">{course.title}</h3>
                    <div className="flex items-center justify-between text-sm text-white/90">
                      <span>{course.instructor_name}</span>
                      <span className="font-semibold">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full shadow p-2 hidden md:block"
              onClick={() => carouselRef.current && carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' })}
              aria-label="Scroll Right"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
      {/* All Courses Vertical List */}
      <div className="max-w-7xl mx-auto px-2 md:px-8 mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">All Courses</h2>
        {allCourses.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No courses available</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {allCourses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col cursor-pointer overflow-hidden group hover:shadow-xl transition-shadow duration-200"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="h-40 w-full relative">
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(${course.cover_photo_url || '/default-course-cover.png'})`,
                      backgroundColor: '#f3f4f6'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <h3 className="text-lg font-bold text-white truncate group-hover:underline">{course.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-white/80">{course.instructor_name}</span>
                      <span className="text-sm font-semibold text-white">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{course.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{course.duration_hours}h</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-full">{course.difficulty_level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
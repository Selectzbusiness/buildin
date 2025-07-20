import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function CourseDetails() {
  const { user } = useContext(AuthContext);
  const user_id = user?.id;
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [wishlist, setWishlist] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user_id) fetchCourse();
    if (user_id && courseId) fetchWishlist();
  }, [courseId, user_id]);

  async function fetchCourse() {
    setLoading(true);
    setError('');
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (courseError) throw courseError;
      setCourse(courseData);
      // Fetch uploads if any
      const { data: uploadData } = await supabase
        .from('course_uploads')
        .select('*')
        .eq('course_id', courseId);
      setUploads(uploadData || []);
      // Check enrollment
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user_id)
        .single();
      setEnrolled(!!enrollData);
    } catch (err) {
      setError('Failed to load course.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    setEnrolling(true);
    setError('');
    try {
      // If paid, integrate Razorpay here (mock for now)
      if (!course.is_free) {
        // TODO: Integrate Razorpay payment
        await new Promise(res => setTimeout(res, 2000)); // Simulate payment
      }
      // Enroll user
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          course_id: courseId,
          user_id,
          paid: !course.is_free,
          status: 'active',
        });
      if (enrollError) throw enrollError;
      // Insert notification
      await supabase
        .from('course_notifications')
        .insert({
          user_id,
          course_id: courseId,
          type: 'enrollment',
          message: `You enrolled in ${course.title}`,
        });
      setEnrolled(true);
      setSuccess(true);
    } catch (err) {
      setError('Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  }

  async function fetchWishlist() {
    const { data } = await supabase
      .from('course_favorites')
      .select('id')
      .eq('user_id', user_id)
      .eq('course_id', courseId)
      .single();
    setWishlist(!!data);
  }

  async function toggleWishlist() {
    if (!user_id || !courseId) return;
    if (wishlist) {
      await supabase
        .from('course_favorites')
        .delete()
        .eq('user_id', user_id)
        .eq('course_id', courseId);
      setWishlist(false);
    } else {
      await supabase
        .from('course_favorites')
        .insert({ user_id, course_id: courseId });
      setWishlist(true);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-white">
        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-[#185a9d] loading-shimmer"></div>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500 text-center py-20 bg-white">{error}</div>;
  }
  if (!course) {
    return <div className="text-center text-gray-500 py-20 bg-white">Course not found.</div>;
  }

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center py-8 px-2 md:px-0">
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {!success && (
            <motion.div
              key="details"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="glass-card bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8 animate-fadeIn border border-gray-200"
            >
              <img
                src={course.cover_photo_url || '/default-course-cover.png'}
                alt="Cover"
                className="w-full h-56 object-cover rounded-2xl border-2 border-[#185a9d]/20 shadow mb-6 animate-fadeIn"
              />
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[#185a9d] animate-fadeIn">{course.title}</h1>
                <button
                  className="text-2xl wishlist-btn"
                  onClick={toggleWishlist}
                  aria-label={wishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {wishlist ? <FaHeart className="text-[#185a9d] animate-bounceIn" /> : <FaRegHeart className="text-gray-400 hover:text-[#185a9d] animate-fadeIn" />}
                </button>
              </div>
              <div className="text-gray-700 text-lg mb-4 animate-fadeIn">{course.description}</div>
              <div className="flex gap-4 mb-4 animate-fadeIn">
                <span className={`px-3 py-1 rounded-full font-semibold text-lg ${course.is_free ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{course.is_free ? 'Free' : `₹${course.price}`}</span>
                <span className={`px-3 py-1 rounded-full font-semibold text-lg ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{course.status === 'published' ? 'Published' : 'Draft'}</span>
              </div>
              {/* Content/Link */}
              {enrolled ? (
                <div className="mt-6 animate-fadeIn">
                  <h2 className="text-xl font-bold text-[#185a9d] mb-2">Course Access</h2>
                  {course.course_link && (
                    <a
                      href={course.course_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold shadow-lg hover:scale-105 transition-all duration-200 mb-4 animate-fadeIn"
                    >
                      Go to Course
                    </a>
                  )}
                  {uploads.length > 0 && (
                    <div className="mb-4 animate-fadeIn">
                      <h3 className="font-semibold mb-2">Course Files:</h3>
                      <ul className="list-disc ml-6">
                        {uploads.map((file, i) => (
                          <li key={i}>
                            <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-[#185a9d] underline">{file.file_url.split('/').pop()}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {course.redirect_link && (
                    <a
                      href={course.redirect_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-semibold shadow hover:bg-blue-200 transition-all duration-200 animate-fadeIn"
                    >
                      Go to Additional Resource
                    </a>
                  )}
                </div>
              ) : (
                <div className="mt-8 animate-fadeIn">
                  <button
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-bold text-xl shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed animate-fadeIn"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? (course.is_free ? 'Enrolling...' : 'Processing Payment...') : (course.is_free ? 'Enroll for Free' : `Buy for ₹${course.price}`)}
                  </button>
                  {error && <div className="text-red-500 mt-2 text-sm animate-fadeIn">{error}</div>}
                </div>
              )}
              {/* Reviews placeholder */}
              <div className="mt-10 animate-fadeIn">
                <h3 className="text-xl font-bold text-[#185a9d] mb-2">Reviews</h3>
                <div className="text-gray-400">(Reviews coming soon!)</div>
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="glass-card bg-white rounded-3xl shadow-2xl p-12 mb-8 flex flex-col items-center justify-center text-center animate-fadeIn border border-gray-200"
            >
              <div className="mb-6">
                <svg className="mx-auto mb-4" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="40" fill="#185a9d"/>
                  <path d="M24 42L36 54L56 34" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className="text-3xl font-bold text-[#185a9d] mb-2 animate-bounce">Congratulations!</h2>
                <p className="text-lg text-gray-700">You have successfully enrolled in this course.</p>
              </div>
              <button
                className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold text-lg shadow-lg hover:scale-105 transition-all duration-200 animate-fadeIn"
                onClick={() => navigate('/my-courses')}
              >
                Go to My Courses
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 
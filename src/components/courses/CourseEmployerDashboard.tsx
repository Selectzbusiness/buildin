import React, { useEffect, useState, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../contexts/AuthContext';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

const deepOceanBlue = 'linear-gradient(90deg, #185a9d 0%, #43cea2 100%)';

export default function CourseEmployerDashboard() {
  const { user } = useContext(AuthContext);
  const employer_id = user?.id;
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showEnrollments, setShowEnrollments] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employer_id) fetchCourses();
  }, [employer_id]);

  async function fetchCourses() {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('employer_id', employer_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCourses(data || []);
      // Fetch all enrollments for these courses
      const courseIds = (data || []).map((c: any) => c.id);
      if (courseIds.length > 0) {
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('*')
          .in('course_id', courseIds);
        setEnrollments(enrollData || []);
        // Fetch all reviews for these courses
        const { data: reviewData } = await supabase
          .from('course_reviews')
          .select('*')
          .in('course_id', courseIds);
        setReviews(reviewData || []);
      }
    } catch (err) {
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(courseId: string) {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (err) {
      setError('Failed to delete course.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePublishToggle(course: any) {
    setActionLoading(true);
    try {
      const newStatus = course.status === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('courses')
        .update({ status: newStatus })
        .eq('id', course.id);
      if (error) throw error;
      setCourses(courses.map(c => c.id === course.id ? { ...c, status: newStatus } : c));
    } catch (err) {
      setError('Failed to update course status.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleViewEnrollments(course: any) {
    setSelectedCourse(course);
    setShowEnrollments(true);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, user: user_id(*), payment_id')
        .eq('course_id', course.id);
      if (error) throw error;
      setEnrollments(data || []);
    } catch (err) {
      setError('Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  }

  // Analytics: total enrollments, revenue, completion rate, average rating
  function getCourseStats(course: any) {
    const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
    const totalEnrollments = courseEnrollments.length;
    const totalRevenue = courseEnrollments.reduce((sum, e) => sum + (e.paid ? (course.price || 0) : 0), 0);
    const completed = courseEnrollments.filter(e => e.completed_at).length;
    const completionRate = totalEnrollments > 0 ? Math.round((completed / totalEnrollments) * 100) : 0;
    const courseReviews = reviews.filter(r => r.course_id === course.id);
    const avgRating = courseReviews.length > 0 ? (courseReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / courseReviews.length).toFixed(1) : 'N/A';
    return { totalEnrollments, totalRevenue, completionRate, avgRating };
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-[#185a9d]">My Courses</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185a9d]"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center text-gray-500 py-20">No courses found. Create your first course!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {courses.map(course => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 relative"
            >
              <div className="flex gap-4 items-center">
                <img
                  src={course.cover_photo_url || '/default-course-cover.png'}
                  alt="Cover"
                  className="w-28 h-20 object-cover rounded-xl border-2 border-[#185a9d] shadow"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#185a9d] mb-1 truncate">{course.title}</h2>
                  <div className="text-gray-600 text-sm truncate mb-1">{course.description}</div>
                  <div className="flex gap-2 items-center text-sm">
                    <span className={`px-2 py-1 rounded-full font-semibold ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{course.status === 'published' ? 'Published' : 'Draft'}</span>
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">{course.is_free ? 'Free' : `₹${course.price}`}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold shadow hover:scale-105 transition-all duration-200"
                  onClick={() => handleViewEnrollments(course)}
                  disabled={actionLoading}
                >
                  View Enrollments
                </button>
                <button
                  className={`px-4 py-2 rounded-xl font-semibold shadow transition-all duration-200 ${course.status === 'published' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                  onClick={() => handlePublishToggle(course)}
                  disabled={actionLoading}
                >
                  {course.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-red-100 text-red-700 font-semibold shadow hover:bg-red-200 transition-all duration-200"
                  onClick={() => handleDelete(course.id)}
                  disabled={actionLoading}
                >
                  Delete
                </button>
              </div>
              {/* Analytics */}
              <div className="flex gap-6 mt-4 text-sm text-gray-700">
                <div>
                  <span className="font-semibold">Enrollments:</span> {getCourseStats(course).totalEnrollments}
                </div>
                <div>
                  <span className="font-semibold">Revenue:</span> ₹{getCourseStats(course).totalRevenue}
                </div>
                <div>
                  <span className="font-semibold">Completion:</span> {getCourseStats(course).completionRate}%
                </div>
                <div>
                  <span className="font-semibold">Avg. Rating:</span> {getCourseStats(course).avgRating} ⭐
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {/* Enrollments Modal */}
      <AnimatePresence>
        {showEnrollments && selectedCourse && (
          <motion.div
            key="enrollments-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowEnrollments(false)}
              >
                ×
              </button>
              <h2 className="text-2xl font-bold text-[#185a9d] mb-4">Enrollments for {selectedCourse.title}</h2>
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#185a9d]"></div>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center text-gray-500 py-10">No enrollments yet.</div>
              ) : (
                <table className="w-full text-left border mt-2">
                  <thead>
                    <tr className="bg-[#185a9d] text-white">
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Paid</th>
                      <th className="py-2 px-3">Approval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enr, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 px-3">{enr.user?.full_name || 'N/A'}</td>
                        <td className="py-2 px-3">{enr.user?.email || 'N/A'}</td>
                        <td className="py-2 px-3">{enr.status}</td>
                        <td className="py-2 px-3">{enr.paid ? 'Yes' : 'No'}</td>
                        <td className="py-2 px-3">{selectedCourse.manual_approval ? (enr.approved_by_employer ? 'Approved' : 'Pending') : 'Auto'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
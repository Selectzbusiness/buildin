import React, { useEffect, useState, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function MyCoursesDashboard() {
  const { user } = useContext(AuthContext);
  const user_id = user?.id;
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<{ [id: string]: any }>({});
  const [uploads, setUploads] = useState<{ [courseId: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user_id) fetchMyCourses();
  }, [user_id]);

  async function fetchMyCourses() {
    setLoading(true);
    setError('');
    try {
      // Get enrollments
      const { data: enrollData, error: enrollError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
      if (enrollError) throw enrollError;
      setEnrollments(enrollData || []);
      // Get all course details
      const courseIds = (enrollData || []).map((e: any) => e.course_id);
      if (courseIds.length > 0) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);
        const courseMap: { [id: string]: any } = {};
        (courseData || []).forEach((c: any) => { courseMap[c.id] = c; });
        setCourses(courseMap);
        // Get uploads for all courses
        const { data: uploadData } = await supabase
          .from('course_uploads')
          .select('*')
          .in('course_id', courseIds);
        const uploadMap: { [courseId: string]: any[] } = {};
        (uploadData || []).forEach((u: any) => {
          if (!uploadMap[u.course_id]) uploadMap[u.course_id] = [];
          uploadMap[u.course_id].push(u);
        });
        setUploads(uploadMap);
      }
    } catch (err) {
      setError('Failed to load your courses.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden">
      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-900 animate-bounceIn">My Courses</h1>
        {error && <div className="text-red-500 mb-4 animate-fadeIn">{error}</div>}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185a9d] loading-shimmer"></div>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center text-gray-400 py-20 animate-fadeIn">You have not enrolled in any courses yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            <AnimatePresence>
              {enrollments.map((enr, idx) => {
                const course = courses[enr.course_id];
                if (!course) return null;
                const courseUploads = uploads[enr.course_id] || [];
                const isUnlocked = !course.manual_approval || enr.approved_by_employer;
                return (
                  <motion.div
                    key={enr.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="glass-card bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 animate-fadeIn border border-gray-200"
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
                    <div className="mt-2 animate-fadeIn">
                      {isUnlocked ? (
                        <>
                          {course.course_link && (
                            <a
                              href={course.course_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold shadow-lg hover:scale-105 transition-all duration-200 mb-2 animate-fadeIn"
                            >
                              Go to Course
                            </a>
                          )}
                          {courseUploads.length > 0 && (
                            <div className="mb-2 animate-fadeIn">
                              <h3 className="font-semibold mb-1">Course Files:</h3>
                              <ul className="list-disc ml-6">
                                {courseUploads.map((file, i) => (
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
                        </>
                      ) : (
                        <div className="px-4 py-2 rounded-xl bg-yellow-100 text-yellow-700 font-semibold shadow mt-2 animate-fadeIn">Pending Approval</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
} 
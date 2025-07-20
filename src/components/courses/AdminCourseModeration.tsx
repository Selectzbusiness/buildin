import React, { useEffect, useState, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

const deepOceanBlue = 'linear-gradient(90deg, #185a9d 0%, #43cea2 100%)';

export default function AdminCourseModeration() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, employer:employer_id(full_name, email)')
        .or('status.eq.pending,status.is.null')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }

  async function handleModerate(courseId: string, approve: boolean) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: approve ? 'published' : 'rejected' })
        .eq('id', courseId);
      if (error) throw error;
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (err) {
      setError('Failed to update course status.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-[#185a9d]">Admin: Course Moderation</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185a9d]"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center text-gray-500 py-20">No courses pending moderation.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            >
              <img
                src={course.cover_photo_url || '/default-course-cover.png'}
                alt="Cover"
                className="w-full h-40 object-cover rounded-xl border-2 border-[#185a9d] shadow mb-2"
              />
              <h2 className="text-xl font-bold text-[#185a9d] mb-1 truncate">{course.title}</h2>
              <div className="text-gray-600 text-sm truncate mb-1">{course.description}</div>
              <div className="text-xs text-gray-500 mb-1">By: {course.employer?.full_name || 'Unknown'} ({course.employer?.email || 'N/A'})</div>
              <div className="flex gap-4 mt-2">
                <button
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold shadow hover:scale-105 transition-all duration-200"
                  onClick={() => handleModerate(course.id, true)}
                  disabled={actionLoading}
                >
                  Approve
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-red-100 text-red-700 font-semibold shadow hover:bg-red-200 transition-all duration-200"
                  onClick={() => handleModerate(course.id, false)}
                  disabled={actionLoading}
                >
                  Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 
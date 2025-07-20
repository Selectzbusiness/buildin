import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { 
  FiPlus, 
  FiBookOpen, 
  FiUsers, 
  FiTrendingUp, 
  FiDollarSign, 
  FiBarChart2, 
  FiEdit3, 
  FiTrash2,
  FiEye,
  FiSettings,
  FiUpload
} from 'react-icons/fi';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function EmployerCourses() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0
  });

  useEffect(() => {
    fetchEmployerCourses();
  }, [user]);

  const fetchEmployerCourses = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch courses created by this employer
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCourses(data || []);
      
      // Calculate stats
      const activeCourses = (data || []).filter(c => c.status === 'published').length;
      const totalStudents = (data || []).reduce((sum, course) => sum + (course.enrollment_count || 0), 0);
      
      setStats({
        totalCourses: data?.length || 0,
        activeCourses,
        totalStudents
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    navigate('/employer/courses/create');
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/employer/course-edit/${courseId}`);
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', courseId);
        
        if (error) throw error;
        
        // Refresh courses
        fetchEmployerCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e3f0fa] p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6 md:mb-8"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#185a9d] mb-1 md:mb-2">Course Management</h1>
              <p className="text-sm md:text-base text-gray-600">Create, manage, and track your educational content</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateCourse}
              className="bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <FiPlus className="w-4 h-4 md:w-5 md:h-5" />
              Create New Course
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm font-medium">Total Courses</p>
                <p className="text-2xl md:text-3xl font-bold text-[#185a9d]">{stats.totalCourses}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                <FiBookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm font-medium">Active Courses</p>
                <p className="text-2xl md:text-3xl font-bold text-[#185a9d]">{stats.activeCourses}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                <FiTrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm font-medium">Total Students</p>
                <p className="text-2xl md:text-3xl font-bold text-[#185a9d]">{stats.totalStudents}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                <FiUsers className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa] mb-6 md:mb-8"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-[#185a9d] mb-3 md:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <button
              onClick={() => navigate('/employer/course-analytics')}
              className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-gradient-to-r from-[#e3f0fa] to-[#f8fafc] hover:from-[#d1e7f7] hover:to-[#e3f0fa] transition-all duration-200 border border-[#e3f0fa]"
            >
              <FiBarChart2 className="w-5 h-5 md:w-6 md:h-6 text-[#185a9d]" />
              <div className="text-left">
                <p className="font-semibold text-[#185a9d] text-sm md:text-base">Course Analytics</p>
                <p className="text-xs md:text-sm text-gray-600">View detailed insights</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/employer/course-settings')}
              className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-gradient-to-r from-[#e3f0fa] to-[#f8fafc] hover:from-[#d1e7f7] hover:to-[#e3f0fa] transition-all duration-200 border border-[#e3f0fa]"
            >
              <FiSettings className="w-5 h-5 md:w-6 md:h-6 text-[#185a9d]" />
              <div className="text-left">
                <p className="font-semibold text-[#185a9d] text-sm md:text-base">Course Settings</p>
                <p className="text-xs md:text-sm text-gray-600">Manage preferences</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/employer/course-upload')}
              className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-gradient-to-r from-[#e3f0fa] to-[#f8fafc] hover:from-[#d1e7f7] hover:to-[#e3f0fa] transition-all duration-200 border border-[#e3f0fa]"
            >
              <FiUpload className="w-5 h-5 md:w-6 md:h-6 text-[#185a9d]" />
              <div className="text-left">
                <p className="font-semibold text-[#185a9d] text-sm md:text-base">Bulk Upload</p>
                <p className="text-xs md:text-sm text-gray-600">Upload multiple courses</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Courses List */}
        <motion.div 
          className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-[#e3f0fa]"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <div className="p-4 md:p-6 border-b border-[#e3f0fa]">
            <h2 className="text-lg md:text-xl font-bold text-[#185a9d]">Your Courses</h2>
          </div>

          {loading ? (
            <div className="p-6 md:p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-[#185a9d] mx-auto"></div>
              <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-600">Loading your courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-6 md:p-8 text-center">
              <FiBookOpen className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-1 md:mb-2">No courses yet</h3>
              <p className="text-sm md:text-base text-gray-500 mb-3 md:mb-4">Create your first course to get started</p>
              <button
                onClick={handleCreateCourse}
                className="bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm md:text-base"
              >
                Create Your First Course
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#e3f0fa]">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  className="p-4 md:p-6 hover:bg-[#f8fafc] transition-colors duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                    <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1">
                      <div 
                        className="w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl bg-cover bg-center flex-shrink-0"
                        style={{ 
                          backgroundImage: `url(${course.cover_photo_url || '/default-course-cover.png'})`,
                          backgroundColor: '#f3f4f6'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-[#185a9d] mb-1 truncate">{course.title}</h3>
                        <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiUsers className="w-3 h-3 md:w-4 md:h-4" />
                            {course.enrollment_count || 0} students
                          </span>
                          <span className="flex items-center gap-1">
                            <FiDollarSign className="w-3 h-3 md:w-4 md:h-4" />
                            {course.price === 0 ? 'Free' : `₹${course.price}`}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            course.status === 'published' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {course.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 md:gap-2 justify-end">
                      <button
                        onClick={() => handleViewCourse(course.id)}
                        className="p-1.5 md:p-2 text-[#185a9d] hover:bg-[#e3f0fa] rounded-lg transition-colors duration-200"
                        title="View Course"
                      >
                        <FiEye className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() => handleEditCourse(course.id)}
                        className="p-1.5 md:p-2 text-[#185a9d] hover:bg-[#e3f0fa] rounded-lg transition-colors duration-200"
                        title="Edit Course"
                      >
                        <FiEdit3 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-1.5 md:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete Course"
                      >
                        <FiTrash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 
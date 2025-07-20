import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { AuthContext } from '../../contexts/AuthContext';
import { 
  FiArrowLeft, 
  FiUpload, 
  FiFile, 
  FiCheck, 
  FiX, 
  FiDownload,
  FiInfo,
  FiAlertCircle
} from 'react-icons/fi';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

interface CourseTemplate {
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  status: 'draft' | 'published';
  category: string;
  duration_hours: number;
  instructor_name: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function CourseBulkUpload() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCourses, setUploadedCourses] = useState<CourseTemplate[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setErrors(['Please upload a CSV or Excel file']);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setErrors([]);
    setUploadedCourses([]);

    try {
      // Read file content
      const text = await file.text();
      setUploadProgress(30);

      // Parse CSV content
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setUploadProgress(60);

      const courses: CourseTemplate[] = [];
      const validationErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const courseData: any = {};
        
        headers.forEach((header, index) => {
          courseData[header] = values[index] || '';
        });

        // Validate required fields
        if (!courseData.title?.trim()) {
          validationErrors.push(`Row ${i + 1}: Title is required`);
          continue;
        }
        if (!courseData.description?.trim()) {
          validationErrors.push(`Row ${i + 1}: Description is required`);
          continue;
        }

        // Parse and validate data
        const price = parseFloat(courseData.price) || 0;
        const isFree = courseData.is_free?.toLowerCase() === 'true' || price === 0;
        const status = courseData.status === 'draft' ? 'draft' : 'published';
        const durationHours = parseInt(courseData.duration_hours) || 1;

        courses.push({
          title: courseData.title.trim(),
          description: courseData.description.trim(),
          price: isFree ? 0 : price,
          is_free: isFree,
          status: status,
          category: courseData.category?.trim() || 'General',
          duration_hours: durationHours,
          instructor_name: user?.user_metadata?.full_name || courseData.instructor_name || 'Instructor'
        });
      }

      setUploadProgress(90);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setUploading(false);
        return;
      }

      if (courses.length === 0) {
        setErrors(['No valid courses found in the file']);
        setUploading(false);
        return;
      }

      setUploadedCourses(courses);
      setUploadProgress(100);
    } catch (error) {
      console.error('Error processing file:', error);
      setErrors(['Failed to process file. Please check the file format and try again.']);
    } finally {
      setUploading(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!user?.id || uploadedCourses.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setErrors([]);

    const newErrors: string[] = [];
    let successCount = 0;

    try {
      for (let i = 0; i < uploadedCourses.length; i++) {
        const course = uploadedCourses[i];
        
        try {
          // Create course in database
          const { error } = await supabase
            .from('courses')
            .insert({
              employer_id: user.id,
              title: course.title,
              description: course.description,
              price: course.price,
              is_free: course.is_free,
              status: course.status,
              category: course.category,
              duration_hours: course.duration_hours,
              instructor_name: course.instructor_name
            });

          if (error) {
            newErrors.push(`Failed to create "${course.title}": ${error.message}`);
          } else {
            successCount++;
          }
        } catch (courseError) {
          newErrors.push(`Failed to create "${course.title}": ${courseError}`);
        }

        setUploadProgress(Math.round(((i + 1) / uploadedCourses.length) * 100));
      }

      setErrors(newErrors);

      // Show success/error message
      if (successCount > 0) {
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 left-4 right-4 md:left-auto md:right-4 bg-green-500 text-white px-4 md:px-6 py-3 rounded-lg shadow-lg z-50 text-sm md:text-base';
        successMessage.textContent = `Successfully created ${successCount} out of ${uploadedCourses.length} courses!`;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          document.body.removeChild(successMessage);
          if (newErrors.length === 0) {
            navigate('/employer/courses');
          }
        }, 3000);
      }

      if (newErrors.length > 0) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed top-4 left-4 right-4 md:left-auto md:right-4 bg-red-500 text-white px-4 md:px-6 py-3 rounded-lg shadow-lg z-50 text-sm md:text-base';
        errorMessage.textContent = `${newErrors.length} courses failed to create. Check errors below.`;
        document.body.appendChild(errorMessage);
        
        setTimeout(() => {
          document.body.removeChild(errorMessage);
        }, 5000);
      }

    } catch (error) {
      console.error('Error in bulk create:', error);
      setErrors(['Failed to create courses. Please try again.']);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `title,description,price,is_free,status,category,duration_hours,instructor_name
"Introduction to React Development","Learn the basics of React and build your first application",0,true,published,"Programming",8,"${user?.user_metadata?.full_name || 'Your Name'}"
"Advanced JavaScript Concepts","Master advanced JavaScript patterns and techniques",2499,false,draft,"Programming",12,"${user?.user_metadata?.full_name || 'Your Name'}"
"UI/UX Design Fundamentals","Learn the principles of good design and user experience",1699,false,published,"Design",6,"${user?.user_metadata?.full_name || 'Your Name'}"
"Data Science Basics","Introduction to data analysis and visualization",4199,false,published,"Data Science",10,"${user?.user_metadata?.full_name || 'Your Name'}"
"Digital Marketing","Learn modern marketing strategies and tools",1299,false,draft,"Marketing",4,"${user?.user_metadata?.full_name || 'Your Name'}"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e3f0fa] p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6 md:mb-8"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/employer/courses')}
                className="p-2 text-[#185a9d] hover:bg-[#e3f0fa] rounded-lg transition-colors duration-200"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#185a9d] mb-1 md:mb-2">Bulk Course Upload</h1>
                <p className="text-sm md:text-base text-gray-600">Upload multiple courses at once</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadTemplate}
              className="bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <FiDownload className="w-4 h-4 md:w-5 md:h-5" />
              Download Template
            </motion.button>
          </div>
        </motion.div>

        <div className="space-y-6 md:space-y-8">
          {/* Upload Area */}
          <motion.div 
            className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa]"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                <FiUpload className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-[#185a9d]">Upload Course File</h2>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-4 md:p-6 lg:p-8 text-center transition-colors duration-200 ${
                dragActive 
                  ? 'border-[#185a9d] bg-[#e3f0fa]' 
                  : 'border-gray-300 hover:border-[#185a9d]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FiFile className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg lg:text-xl font-semibold text-[#185a9d] mb-2">Drop your file here</h3>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 mb-3 md:mb-4">
                Upload a CSV or Excel file with your course data
              </p>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white px-3 md:px-4 lg:px-6 py-2 md:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer inline-flex items-center gap-2 text-xs md:text-sm lg:text-base"
              >
                <FiUpload className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                Choose File
              </label>
            </div>

            {uploading && (
              <div className="mt-4 md:mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm md:text-base font-medium text-[#185a9d]">Processing...</span>
                  <span className="text-sm md:text-base text-gray-600">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-gradient-to-r from-[#185a9d] to-[#43cea2] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Instructions */}
          <motion.div 
            className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa]"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                <FiInfo className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-[#185a9d]">Instructions</h2>
            </div>

            <div className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#185a9d] rounded-full mt-2 flex-shrink-0"></div>
                <p>Download the template file to see the required format</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#185a9d] rounded-full mt-2 flex-shrink-0"></div>
                <p>Fill in your course details following the template structure</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#185a9d] rounded-full mt-2 flex-shrink-0"></div>
                <p>Save as CSV or Excel format and upload</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#185a9d] rounded-full mt-2 flex-shrink-0"></div>
                <p>Review the preview and create all courses at once</p>
              </div>
            </div>
          </motion.div>

          {/* Preview */}
          {uploadedCourses.length > 0 && (
            <motion.div 
              className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa]"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-[#185a9d]">Course Preview</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkCreate}
                  disabled={uploading}
                  className="bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50"
                >
                  <FiUpload className="w-4 h-4 md:w-5 md:h-5" />
                  {uploading ? 'Creating Courses...' : `Create ${uploadedCourses.length} Courses`}
                </motion.button>
              </div>

              <div className="space-y-3 md:space-y-4">
                {uploadedCourses.map((course, index) => (
                  <div key={index} className="p-3 md:p-4 bg-[#f8fafc] rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#185a9d] text-sm md:text-base mb-1">{course.title}</h3>
                        <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500">
                          <span className="bg-white px-2 py-1 rounded-md">{course.category}</span>
                          <span className="bg-white px-2 py-1 rounded-md">{course.duration_hours}h</span>
                          <span className="bg-white px-2 py-1 rounded-md">{course.is_free ? 'Free' : `₹${course.price}`}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            course.status === 'published' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {course.status}
                          </span>
                        </div>
                      </div>
                      <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <motion.div 
              className="bg-red-50 border border-red-200 rounded-xl md:rounded-2xl p-4 md:p-6"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <FiAlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-red-700">Errors Found</h3>
              </div>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600 flex items-center gap-2">
                    <FiX className="w-4 h-4" />
                    {error}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
} 
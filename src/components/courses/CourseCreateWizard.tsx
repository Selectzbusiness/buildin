import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { 
  FiArrowLeft, 
  FiArrowRight, 
  FiUpload, 
  FiLink, 
  FiDollarSign, 
  FiSettings, 
  FiCheck,
  FiFile,
  FiImage,
  FiBookOpen,
  FiGlobe,
  FiUsers,
  FiEye,
  FiX
} from 'react-icons/fi';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

// Custom Indian Rupee Icon Component
const IndianRupeeIcon = ({ className }: { className?: string }) => (
  <span className={className} style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
    ₹
  </span>
);

const steps = [
  { name: 'Course Info', icon: FiBookOpen, description: 'Basic course details' },
  { name: 'Cover Photo', icon: FiImage, description: 'Course cover image' },
  { name: 'Content/Link', icon: FiFile, description: 'Course materials' },
  { name: 'Pricing', icon: IndianRupeeIcon, description: 'Course pricing' },
  { name: 'Settings', icon: FiSettings, description: 'Course settings' },
  { name: 'Success', icon: FiCheck, description: 'Course created' },
];

export default function CourseCreateWizard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  // Step 2 state
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3 state
  const [contentType, setContentType] = useState<'upload' | 'link' | ''>('');
  const [courseFiles, setCourseFiles] = useState<File[]>([]);
  const [fileUploadProgress, setFileUploadProgress] = useState<number>(0);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [externalLink, setExternalLink] = useState('');
  const [contentError, setContentError] = useState('');

  // Step 4 state
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');
  const [redirectLink, setRedirectLink] = useState('');
  const [pricingError, setPricingError] = useState('');

  // Step 5 state
  const [manualApproval, setManualApproval] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('published');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);

  const nextStep = () => {
    if (step === 0) {
      const newErrors: typeof errors = {};
      if (!title.trim()) newErrors.title = 'Title is required';
      if (!description.trim()) newErrors.description = 'Description is required';
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
    }
    if (step === 1) {
      if (!coverPhotoUrl) {
        setUploadError('Please upload a cover photo.');
        return;
      }
    }
    if (step === 2) {
      if (contentType === '') {
        setContentError('Please select how you want to provide your course.');
        return;
      }
      if (contentType === 'upload' && uploadedFileUrls.length === 0) {
        setContentError('Please upload at least one course file.');
        return;
      }
      if (contentType === 'link' && !externalLink.trim()) {
        setContentError('Please provide a valid course link.');
        return;
      }
    }
    if (step === 3) {
      if (!isFree && (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)) {
        setPricingError('Please enter a valid price for a paid course.');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setUploadError('');
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cover_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('course-assets')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('course-assets')
        .getPublicUrl(fileName);
      setCoverPhoto(file);
      setCoverPhotoUrl(urlData.publicUrl);
    } catch (err: any) {
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCourseFiles = async (files: FileList) => {
    setContentError('');
    setFileUploadProgress(0);
    setUploadedFileUrls([]);
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `course_content_${Date.now()}_${i}.${fileExt}`;
        const { error } = await supabase.storage
          .from('course-assets')
          .upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from('course-assets')
          .getPublicUrl(fileName);
        urls.push(urlData.publicUrl);
        setFileUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (err) {
        setContentError('Failed to upload one or more files.');
        break;
      }
    }
    setUploadedFileUrls(urls);
    setCourseFiles(Array.from(files));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          employer_id: user?.id,
          title,
          description,
          cover_photo_url: coverPhotoUrl,
          price: isFree ? 0 : Number(price),
          is_free: isFree,
          course_link: contentType === 'link' ? externalLink : null,
          redirect_link: redirectLink,
          manual_approval: manualApproval,
          status: publishStatus,
        })
        .select()
        .single();
      if (courseError) throw courseError;
      setCourseId(courseData.id);
      
      if (contentType === 'upload' && uploadedFileUrls.length > 0) {
        const uploads = uploadedFileUrls.map(url => ({
          course_id: courseData.id,
          file_url: url,
          file_type: '',
        }));
        const { error: uploadError } = await supabase
          .from('course_uploads')
          .insert(uploads);
        if (uploadError) throw uploadError;
      }
      setStep(5);
    } catch (err: any) {
      setSubmitError('Failed to create course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e3f0fa] p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/employer/courses')}
              className="p-2 text-[#185a9d] hover:bg-[#e3f0fa] rounded-lg transition-colors duration-200"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#185a9d] mb-1">Create New Course</h1>
              <p className="text-sm md:text-base text-gray-600">Step {step + 1} of {steps.length}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="h-2 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            ></div>
          </div>

          {/* Desktop Stepper */}
          <div className="hidden md:flex items-center justify-between mb-6">
            {steps.map((stepItem, i) => {
              const Icon = stepItem.icon;
              return (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      i < step
                        ? 'bg-green-500 text-white border-green-500'
                        : i === step
                        ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white border-[#185a9d] shadow-lg'
                        : 'bg-white text-gray-400 border-gray-300'
                    }`}
                  >
                    <Icon className={stepItem.name === 'Pricing' ? 'text-lg font-bold' : 'w-5 h-5'} />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-semibold ${
                      i <= step ? 'text-[#185a9d]' : 'text-gray-400'
                    }`}>
                      {stepItem.name}
                    </p>
                    <p className="text-xs text-gray-500">{stepItem.description}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 rounded-full transition-all duration-300 ${
                        i < step ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Stepper */}
          <div className="md:hidden flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              {steps.map((stepItem, i) => {
                const Icon = stepItem.icon;
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        i < step
                          ? 'bg-green-500 text-white border-green-500'
                          : i === step
                          ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white border-[#185a9d] shadow-lg'
                          : 'bg-white text-gray-400 border-gray-300'
                      }`}
                    >
                      <Icon className={stepItem.name === 'Pricing' ? 'text-base font-bold' : 'w-4 h-4'} />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${
                      i <= step ? 'text-[#185a9d]' : 'text-gray-400'
                    }`}>
                      {stepItem.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-[#e3f0fa] p-4 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                  <FiBookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#185a9d]">Course Information</h2>
                  <p className="text-sm md:text-base text-gray-600">Tell us about your course</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm md:text-base font-semibold mb-2 text-gray-700">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={`w-full px-4 md:px-6 py-3 md:py-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[#185a9d] transition-all duration-200 text-sm md:text-base ${
                      errors.title ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                    }`}
                    placeholder="Enter an engaging course title..."
                  />
                  {errors.title && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      {errors.title}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm md:text-base font-semibold mb-2 text-gray-700">
                    Course Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className={`w-full px-4 md:px-6 py-3 md:py-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[#185a9d] transition-all duration-200 text-sm md:text-base resize-none ${
                      errors.description ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                    }`}
                    placeholder="Describe what students will learn in this course..."
                    rows={4}
                  />
                  {errors.description && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      {errors.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mt-8">
                <button
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-200 disabled:opacity-50 text-sm md:text-base"
                  onClick={prevStep}
                  disabled={step === 0}
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 text-sm md:text-base"
                  onClick={nextStep}
                >
                  Next
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-[#e3f0fa] p-4 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                  <FiImage className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#185a9d]">Cover Photo</h2>
                  <p className="text-sm md:text-base text-gray-600">Upload an attractive cover image</p>
                </div>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-all duration-200 cursor-pointer ${
                  uploadError ? 'border-red-400 bg-red-50' : 'border-[#185a9d] bg-[#f8fafc] hover:bg-[#e3f0fa]'
                }`}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                {coverPhotoUrl ? (
                  <div className="relative">
                    <img
                      src={coverPhotoUrl}
                      alt="Cover Preview"
                      className="w-full max-w-xs h-48 object-cover rounded-xl shadow-lg mx-auto mb-4"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverPhotoUrl('');
                        setCoverPhoto(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <FiImage className="w-16 h-16 text-[#185a9d] mx-auto mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold text-[#185a9d] mb-2">Upload Cover Photo</h3>
                    <p className="text-sm md:text-base text-gray-600 mb-4">
                      Drag & drop or click to upload a cover photo
                    </p>
                    <p className="text-xs text-gray-500">Recommended: 800x400px, JPG/PNG</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
                  }}
                />
              </div>

              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-[#185a9d] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#185a9d] font-semibold">Uploading...</span>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 mt-4 text-red-500 text-sm">
                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                  {uploadError}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 mt-8">
                <button
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-200 text-sm md:text-base"
                  onClick={prevStep}
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 text-sm md:text-base"
                  onClick={nextStep}
                  disabled={!coverPhotoUrl || uploading}
                >
                  Next
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-[#e3f0fa] p-4 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                  <FiFile className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#185a9d]">Course Content</h2>
                  <p className="text-sm md:text-base text-gray-600">Choose how to provide course materials</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    contentType === 'upload' 
                      ? 'border-[#185a9d] bg-[#e3f0fa]' 
                      : 'border-gray-200 bg-gray-50 hover:border-[#185a9d] hover:bg-[#f8fafc]'
                  }`}
                  onClick={() => { setContentType('upload'); setContentError(''); }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <FiUpload className="w-6 h-6 text-[#185a9d]" />
                    <h3 className="font-semibold text-[#185a9d]">Upload Files</h3>
                  </div>
                  <p className="text-sm text-gray-600">Upload PDFs, videos, and other course materials</p>
                </button>

                <button
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    contentType === 'link' 
                      ? 'border-[#185a9d] bg-[#e3f0fa]' 
                      : 'border-gray-200 bg-gray-50 hover:border-[#185a9d] hover:bg-[#f8fafc]'
                  }`}
                  onClick={() => { setContentType('link'); setContentError(''); }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <FiLink className="w-6 h-6 text-[#185a9d]" />
                    <h3 className="font-semibold text-[#185a9d]">External Link</h3>
                  </div>
                  <p className="text-sm text-gray-600">Provide a link to external course content</p>
                </button>
              </div>

              {contentType === 'upload' && (
                <div className="mb-6">
                  <label className="block text-sm md:text-base font-semibold mb-3 text-gray-700">
                    Upload Course Files
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                    <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      multiple
                      accept=".pdf,video/*,image/*,.doc,.docx,.ppt,.pptx"
                      onChange={e => e.target.files && handleCourseFiles(e.target.files)}
                      className="hidden"
                      id="course-files"
                    />
                    <label
                      htmlFor="course-files"
                      className="cursor-pointer text-[#185a9d] font-semibold hover:underline"
                    >
                      Choose files
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PDF, Video, Images, Documents</p>
                  </div>
                  
                  {fileUploadProgress > 0 && fileUploadProgress < 100 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#185a9d]">Uploading...</span>
                        <span className="text-sm text-gray-600">{fileUploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-gradient-to-r from-[#185a9d] to-[#43cea2] transition-all duration-300"
                          style={{ width: `${fileUploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {uploadedFileUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Files:</h4>
                      <div className="space-y-2">
                        {uploadedFileUrls.map((url, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                            <FiCheck className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-700 truncate">
                              {url.split('/').pop()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {contentType === 'link' && (
                <div className="mb-6">
                  <label className="block text-sm md:text-base font-semibold mb-2 text-gray-700">
                    Course Link (URL)
                  </label>
                  <input
                    type="url"
                    value={externalLink}
                    onChange={e => setExternalLink(e.target.value)}
                    className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[#185a9d] border-gray-200 bg-gray-50 hover:bg-white focus:bg-white text-sm md:text-base"
                    placeholder="https://your-course-link.com"
                  />
                </div>
              )}

              {contentError && (
                <div className="flex items-center gap-2 mb-4 text-red-500 text-sm">
                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                  {contentError}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 mt-8">
                <button
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-200 text-sm md:text-base"
                  onClick={prevStep}
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 text-sm md:text-base"
                  onClick={nextStep}
                  disabled={contentType === '' || (contentType === 'upload' && uploadedFileUrls.length === 0) || (contentType === 'link' && !externalLink.trim())}
                >
                  Next
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-[#e3f0fa] p-4 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                  <IndianRupeeIcon className="text-lg md:text-xl font-bold text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#185a9d]">Pricing</h2>
                  <p className="text-sm md:text-base text-gray-600">Set your course pricing</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                    isFree 
                      ? 'border-[#185a9d] bg-[#e3f0fa]' 
                      : 'border-gray-200 bg-gray-50 hover:border-[#185a9d] hover:bg-[#f8fafc]'
                  }`}
                  onClick={() => { setIsFree(true); setPricingError(''); }}
                >
                  <FiUsers className="w-8 h-8 text-[#185a9d] mx-auto mb-2" />
                  <h3 className="font-semibold text-[#185a9d] mb-1">Free Course</h3>
                  <p className="text-sm text-gray-600">Accessible to everyone</p>
                </button>

                <button
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                    !isFree 
                      ? 'border-[#185a9d] bg-[#e3f0fa]' 
                      : 'border-gray-200 bg-gray-50 hover:border-[#185a9d] hover:bg-[#f8fafc]'
                  }`}
                  onClick={() => { setIsFree(false); setPricingError(''); }}
                >
                  <IndianRupeeIcon className="text-2xl font-bold text-[#185a9d] mx-auto mb-2" />
                  <h3 className="font-semibold text-[#185a9d] mb-1">Paid Course</h3>
                  <p className="text-sm text-gray-600">Students pay to access</p>
                </button>
              </div>

              {!isFree && (
                <div className="mb-6">
                  <label className="block text-sm md:text-base font-semibold mb-2 text-gray-700">
                    Price (INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 md:py-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[#185a9d] border-gray-200 bg-gray-50 hover:bg-white focus:bg-white text-sm md:text-base"
                      placeholder="Enter price in INR"
                    />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm md:text-base font-semibold mb-2 text-gray-700">
                  Redirect Link (optional)
                </label>
                <input
                  type="url"
                  value={redirectLink}
                  onChange={e => setRedirectLink(e.target.value)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[#185a9d] border-gray-200 bg-gray-50 hover:bg-white focus:bg-white text-sm md:text-base"
                  placeholder="https://redirect-after-purchase.com"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Redirect students after purchase</p>
              </div>

              {pricingError && (
                <div className="flex items-center gap-2 mb-4 text-red-500 text-sm">
                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                  {pricingError}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 mt-8">
                <button
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-200 text-sm md:text-base"
                  onClick={prevStep}
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 text-sm md:text-base"
                  onClick={nextStep}
                  disabled={!isFree && (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)}
                >
                  Next
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-[#e3f0fa] p-4 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                  <FiSettings className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#185a9d]">Course Settings</h2>
                  <p className="text-sm md:text-base text-gray-600">Configure course preferences</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Manual Approval</h3>
                    <p className="text-sm text-gray-600">Require manual approval for enrollments</p>
                  </div>
                  <button
                    onClick={() => setManualApproval(!manualApproval)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      manualApproval ? 'bg-[#185a9d]' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      manualApproval ? 'transform translate-x-6' : 'transform translate-x-1'
                    }`}></div>
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-700 mb-3">Publish Status</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="publishStatus"
                        checked={publishStatus === 'published'}
                        onChange={() => setPublishStatus('published')}
                        className="w-4 h-4 text-[#185a9d] focus:ring-[#185a9d]"
                      />
                      <div>
                        <p className="font-medium text-gray-700">Publish Now</p>
                        <p className="text-sm text-gray-600">Course will be immediately available</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="publishStatus"
                        checked={publishStatus === 'draft'}
                        onChange={() => setPublishStatus('draft')}
                        className="w-4 h-4 text-[#185a9d] focus:ring-[#185a9d]"
                      />
                      <div>
                        <p className="font-medium text-gray-700">Save as Draft</p>
                        <p className="text-sm text-gray-600">Course will be saved but not published</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mt-8">
                <button
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-200 disabled:opacity-50 text-sm md:text-base"
                  onClick={prevStep}
                  disabled={submitting}
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 text-sm md:text-base"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Create Course
                    </>
                  )}
                </button>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 mt-4 text-red-500 text-sm">
                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                  {submitError}
                </div>
              )}
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-[#e3f0fa] p-8 md:p-12 text-center"
            >
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#185a9d] mb-2">Congratulations!</h2>
                <p className="text-lg text-gray-700 mb-4">Your course has been created successfully.</p>
                <p className="text-sm text-gray-600">Course ID: {courseId}</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 justify-center">
                <button
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm md:text-base"
                  onClick={() => navigate('/employer/courses')}
                >
                  <FiEye className="w-4 h-4 inline mr-2" />
                  View My Courses
                </button>
                <button
                  className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all duration-200 text-sm md:text-base"
                  onClick={() => {
                    setStep(0);
                    setTitle('');
                    setDescription('');
                    setCoverPhotoUrl('');
                    setContentType('');
                    setExternalLink('');
                    setPrice('');
                    setRedirectLink('');
                    setManualApproval(false);
                    setPublishStatus('published');
                  }}
                >
                  Create Another Course
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 
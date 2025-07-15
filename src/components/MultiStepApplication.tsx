import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { AuthContext } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiUpload, FiFile, FiVideo, FiCheck, FiArrowRight, FiArrowLeft, FiX } from 'react-icons/fi';

interface CustomQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

interface ApplicationData {
  resumeUrl: string | null;
  videoUrl: string | null;
  answers: Record<string, string | string[]>;
}

interface MultiStepApplicationProps {
  type: 'job' | 'internship';
  onClose: () => void;
}

const MultiStepApplication: React.FC<MultiStepApplicationProps> = ({ type, onClose }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useContext(AuthContext);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [internshipData, setInternshipData] = useState<any>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    resumeUrl: null,
    videoUrl: null,
    answers: {}
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingResume, setExistingResume] = useState<string | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id, type]);

  const fetchData = async () => {
    if (!id) return;
    
    try {
      if (type === 'job') {
        const { data, error } = await supabase
          .from('jobs')
          .select('*, companies(*)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setJobData(data);
        setCustomQuestions(data.custom_questions || []);
      } else {
        const { data, error } = await supabase
          .from('internships')
          .select('*, companies(*)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setInternshipData(data);
        setCustomQuestions(data.custom_questions || []);
      }

      // Fetch existing resume and video from user profile
      if (profile) {
        setExistingResume(profile.resume_url || null);
        setExistingVideo(profile.intro_video_url || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load application data');
    }
  };

  const uploadFile = async (file: File, user: any, type: 'resume' | 'video'): Promise<string> => {
    const ext = file.name.split('.').pop();
    const bucket = type === 'video' ? 'job-seeker-intro-videos' : 'job-seeker-resumes';
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, { 
      upsert: true,
      cacheControl: '3600'
    });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleResumeChoice = (useExisting: boolean) => {
    if (useExisting) {
      setApplicationData(prev => ({ ...prev, resumeUrl: existingResume }));
    } else {
      setApplicationData(prev => ({ ...prev, resumeUrl: null }));
    }
  };

  const handleVideoChoice = (useExisting: boolean) => {
    if (useExisting) {
      setApplicationData(prev => ({ ...prev, videoUrl: existingVideo }));
    } else {
      setApplicationData(prev => ({ ...prev, videoUrl: null }));
    }
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setApplicationData(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
  };

  // Validate required questions
  const validateRequiredQuestions = (): boolean => {
    const requiredQuestions = customQuestions.filter(q => q.required);
    
    for (const question of requiredQuestions) {
      const answer = applicationData.answers[question.id];
      
      if (!answer) {
        toast.error(`Please answer the required question: "${question.question}"`);
        return false;
      }
      
      if (Array.isArray(answer) && answer.length === 0) {
        toast.error(`Please select at least one option for: "${question.question}"`);
        return false;
      }
      
      if (typeof answer === 'string' && answer.trim() === '') {
        toast.error(`Please answer the required question: "${question.question}"`);
        return false;
      }
    }
    
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      setUploading(true);
      try {
        let finalResumeUrl = applicationData.resumeUrl;
        let finalVideoUrl = applicationData.videoUrl;
        if (resumeFile && user) {
          finalResumeUrl = await uploadFile(resumeFile, user, 'resume');
        }
        if (videoFile && user) {
          finalVideoUrl = await uploadFile(videoFile, user, 'video');
        }
        setApplicationData(prev => ({
          ...prev,
          resumeUrl: finalResumeUrl,
          videoUrl: finalVideoUrl
        }));
        setCurrentStep(2);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload files. Please try again.');
      } finally {
        setUploading(false);
      }
    } else if (currentStep === 2) {
      if (!validateRequiredQuestions()) {
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!profile || !user || !id) {
      toast.error('Missing user information');
      return;
    }

    // Final validation
    if (!validateRequiredQuestions()) {
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        job_seeker_id: profile.id,
        status: 'pending',
        applied_at: new Date().toISOString(),
        resume_url: applicationData.resumeUrl,
        video_url: applicationData.videoUrl,
        answers: applicationData.answers
      };

      if (type === 'job') {
        payload.job_id = id;
        const { error } = await supabase
          .from('applications')
          .insert(payload);
        if (error) throw error;
      } else {
        payload.internship_id = id;
        const { error } = await supabase
          .from('internship_applications')
          .insert(payload);
        if (error) throw error;
      }

      toast.success('Application submitted successfully!');
      onClose();
      navigate(type === 'job' ? '/my-jobs' : '/internships');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume & Video</h2>
        <p className="text-gray-600">Choose your resume and video for this application</p>
      </div>

      {/* Resume Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiFile className="w-5 h-5 mr-2" />
          Resume/CV
        </h3>
        
        {existingResume && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">You have an existing resume:</p>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <a 
                href={existingResume} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Current Resume
              </a>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResumeChoice(true)}
                  className={`px-3 py-1 rounded text-sm ${
                    applicationData.resumeUrl === existingResume
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Use This
                </button>
                <button
                  onClick={() => handleResumeChoice(false)}
                  className={`px-3 py-1 rounded text-sm ${
                    applicationData.resumeUrl === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Upload New
                </button>
              </div>
            </div>
          </div>
        )}

        {(!existingResume || applicationData.resumeUrl === null) && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Upload your resume (PDF, DOC, DOCX)</p>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Choose File
            </label>
            {resumeFile && (
              <p className="text-sm text-gray-600 mt-2">{resumeFile.name}</p>
            )}
          </div>
        )}
      </div>

      {/* Video Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiVideo className="w-5 h-5 mr-2" />
          Introduction Video
        </h3>
        
        {existingVideo && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">You have an existing video:</p>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <video src={existingVideo} controls className="w-32 h-20 object-cover rounded" />
              <div className="flex gap-2">
                <button
                  onClick={() => handleVideoChoice(true)}
                  className={`px-3 py-1 rounded text-sm ${
                    applicationData.videoUrl === existingVideo
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Use This
                </button>
                <button
                  onClick={() => handleVideoChoice(false)}
                  className={`px-3 py-1 rounded text-sm ${
                    applicationData.videoUrl === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Upload New
                </button>
              </div>
            </div>
          </div>
        )}

        {(!existingVideo || applicationData.videoUrl === null) && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Upload your introduction video</p>
            <p className="text-xs text-gray-500 mb-4">A video introduction can significantly improve your chances</p>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Choose Video
            </label>
            {videoFile && (
              <p className="text-sm text-gray-600 mt-2">{videoFile.name}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Custom Questions</h2>
        <p className="text-gray-600">Answer the employer's specific questions</p>
      </div>

      {customQuestions.length === 0 ? (
        <div className="text-center py-8">
          <FiCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No custom questions for this position</p>
        </div>
      ) : (
        <div className="space-y-6">
          {customQuestions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                {index + 1}. {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {question.type === 'text' && (
                <input
                  type="text"
                  value={applicationData.answers[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your answer"
                  required={question.required}
                />
              )}

              {question.type === 'textarea' && (
                <textarea
                  value={applicationData.answers[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your detailed answer"
                  required={question.required}
                />
              )}

              {question.type === 'radio' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={applicationData.answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="mr-3"
                        required={question.required}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'checkbox' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        value={option}
                        checked={(applicationData.answers[question.id] as string[] || []).includes(option)}
                        onChange={(e) => {
                          const currentAnswers = applicationData.answers[question.id] as string[] || [];
                          const newAnswers = e.target.checked
                            ? [...currentAnswers, option]
                            : currentAnswers.filter(a => a !== option);
                          handleAnswerChange(question.id, newAnswers);
                        }}
                        className="mr-3"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-gray-600">Review your application before submitting</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Summary</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Position</h4>
            <p className="text-gray-600">
              {type === 'job' ? jobData?.title : internshipData?.title}
            </p>
            <p className="text-sm text-gray-500">
              {type === 'job' ? jobData?.companies?.name : internshipData?.companies?.name}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Resume</h4>
            <p className="text-gray-600">
              {applicationData.resumeUrl ? '✓ Resume attached' : 'No resume attached'}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Video</h4>
            <p className="text-gray-600">
              {applicationData.videoUrl ? '✓ Video attached' : 'No video attached'}
            </p>
          </div>

          {customQuestions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Questions Answered</h4>
              <p className="text-gray-600">✓ {customQuestions.length} question(s) answered</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Once submitted, your application will be sent to the employer for review. 
          You can track your application status in the "My Jobs" section.
        </p>
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step < currentStep ? <FiCheck className="w-4 h-4" /> : step}
          </div>
          {step < 3 && (
            <div className={`w-16 h-1 mx-2 ${
              step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">
              Apply for {type === 'job' ? jobData?.title : internshipData?.title}
            </h1>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          {renderStepIndicator()}
        </div>

        <div className="p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={uploading}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Next'}
                <FiArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStepApplication; 
import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight, FaArrowLeft, FaRegBuilding, FaClipboardList, FaMoneyBillWave, FaUserTie, FaFileAlt, FaEye, FaEdit, FaPaperPlane, FaSpinner, FaSave } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { AuthContext } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface JobFormData {
  jobTitle: string;
  jobTitleDescription: string;
  jobType: 'onsite' | 'remote' | 'hybrid';
  city: string;
  area: string;
  pincode: string;
  streetAddress: string;
  employmentTypes: string[];
  schedules: string[];
  customSchedule: string;
  hasPlannedStartDate: boolean;
  plannedStartDate: string;
  numberOfHires: string;
  customNumberOfHires: string;
  recruitmentTimeline: string;
  payType: string;
  minPay: string;
  maxPay: string;
  payRate: string;
  supplementalPay: string[];
  customSupplementalPay: string;
  benefits: string[];
  customBenefits: string;
  education: string;
  language: string[];
  customLanguage: string;
  experience: string;
  industries: string[];
  customIndustry: string;
  age: string;
  gender: string;
  skills: string[];
  customSkills: string;
  jobProfileDescription: string;
  notificationEmails: string;
  applicationDeadline: string;
  customQuestions: any[];
  applicationType: 'in_app' | 'external_link';
  applicationLink: string;
  disclaimer: string;
}

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
const SCHEDULES = ['Monday to Friday', 'Weekends', 'Flexible', 'Night Shift', 'Rotating', 'Other'];
const PAY_TYPES = ['Range', 'Starting', 'Maximum', 'Exact'];
const PAY_RATES = ['per hour', 'per day', 'per week', 'per month', 'per year'];
const SUPPLEMENTAL_PAY = ['Bonus', 'Commission', 'Overtime', 'Tips', 'Other'];
const BENEFITS = ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', 'Retirement Plan', 'Paid Time Off', 'Flexible Schedule', 'Remote Work', 'Professional Development', 'Other'];
const EDUCATION_LEVELS = ['High School', 'Associate Degree', 'Bachelor Degree', 'Master Degree', 'PhD', 'Other'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Other'];
const EXPERIENCE_LEVELS = ['Entry Level', '1-2 years', '3-5 years', '6-10 years', '10+ years'];
const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Marketing', 'Consulting', 'Other'];
const GENDERS = ['Any', 'Male', 'Female', 'Other'];
const SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C++', 'SQL', 'AWS', 'Docker', 'Kubernetes',
  'Machine Learning', 'Data Analysis', 'Project Management', 'Communication', 'Leadership', 'Other'
];

const steps = [
  { label: 'Job Details', icon: <FaRegBuilding /> },
  { label: 'Employment & Schedule', icon: <FaClipboardList /> },
  { label: 'Compensation', icon: <FaMoneyBillWave /> },
  { label: 'Requirements', icon: <FaUserTie /> },
  { label: 'Custom Questions', icon: <FaFileAlt /> },
  { label: 'Summary', icon: <FaEye /> },
];

const initialFormData: JobFormData = {
  jobTitle: '',
  jobTitleDescription: '',
  jobType: 'onsite',
  city: '',
  area: '',
  pincode: '',
  streetAddress: '',
  employmentTypes: [],
  schedules: [],
  customSchedule: '',
  hasPlannedStartDate: false,
  plannedStartDate: '',
  numberOfHires: '1',
  customNumberOfHires: '',
  recruitmentTimeline: '',
  payType: '',
  minPay: '',
  maxPay: '',
  payRate: '',
  supplementalPay: [],
  customSupplementalPay: '',
  benefits: [],
  customBenefits: '',
  education: '',
  language: [],
  customLanguage: '',
  experience: '',
  industries: [],
  customIndustry: '',
  age: '',
  gender: '',
  skills: [],
  customSkills: '',
  jobProfileDescription: '',
  notificationEmails: '',
  applicationDeadline: '',
  customQuestions: [],
  applicationType: 'in_app',
  applicationLink: '',
  disclaimer: '',
};

const EditJobForm: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { user, profile } = useContext(AuthContext);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load job data on component mount
  useEffect(() => {
    if (jobId) {
      loadJobData();
    }
  }, [jobId]);

  // Load companies for the user
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('employer_companies')
        .select('company_id, companies(id, name)')
        .eq('user_id', user.id);
      if (!error && data) {
        const companyList = data.map((row: any) => row.companies);
        setCompanies(companyList);
      }
    };
    fetchCompanies();
  }, [user]);

  const loadJobData = async () => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      if (data) {
        // Transform database data to form data
        const transformedData: JobFormData = {
          jobTitle: data.title || '',
          jobTitleDescription: data.description || '',
          jobType: data.job_type || 'onsite',
          city: data.location?.city || '',
          area: data.location?.area || '',
          pincode: data.location?.pincode || '',
          streetAddress: data.location?.street_address || '',
          employmentTypes: data.employment_types || [],
          schedules: data.schedules || [],
          customSchedule: data.custom_schedule || '',
          hasPlannedStartDate: !!data.planned_start_date,
          plannedStartDate: data.planned_start_date ? new Date(data.planned_start_date).toISOString().split('T')[0] : '',
          numberOfHires: data.openings?.toString() || '1',
          customNumberOfHires: '',
          recruitmentTimeline: data.recruitment_timeline || '',
          payType: data.pay_type || '',
          minPay: data.min_amount?.toString() || '',
          maxPay: data.max_amount?.toString() || '',
          payRate: data.pay_rate || '',
          supplementalPay: data.supplemental_pay || [],
          customSupplementalPay: data.custom_supplemental_pay || '',
          benefits: data.benefits || [],
          customBenefits: data.custom_benefit || '',
          education: data.minimum_education || '',
          language: data.language_requirement ? data.language_requirement.split(', ') : [],
          customLanguage: '',
          experience: data.experience_type || '',
          industries: data.industries || [],
          customIndustry: '',
          age: '',
          gender: data.gender || '',
          skills: data.skills || [],
          customSkills: '',
          jobProfileDescription: data.job_profile_description || '',
          notificationEmails: data.notification_emails?.[0] || '',
          applicationDeadline: data.application_deadline ? new Date(data.application_deadline).toISOString().split('T')[0] : '',
          customQuestions: data.custom_questions || [],
          applicationType: data.application_type || 'in_app',
          applicationLink: data.application_link || '',
          disclaimer: data.disclaimer || '',
        };

        setFormData(transformedData);
        setSelectedCompanyId(data.company_id);
      }
    } catch (err: any) {
      console.error('Error loading job data:', err);
      setError('Failed to load job data. Please try again.');
      toast.error('Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    const newErrors: any = {};
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!formData.jobTitleDescription.trim()) newErrors.jobTitleDescription = 'Description is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) newErrors.pincode = 'Pincode must be 6 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    if (formData.employmentTypes.length === 0) newErrors.employmentTypes = 'At least one employment type is required';
    if (formData.schedules.length === 0) newErrors.schedules = 'At least one schedule is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: any = {};
    if (!formData.payType) newErrors.payType = 'Pay type is required';
    if (!formData.payRate) newErrors.payRate = 'Pay rate is required';
    if (formData.payType === 'Range' && (!formData.minPay || !formData.maxPay)) {
      newErrors.payRange = 'Both minimum and maximum pay are required for range';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: any = {};
    if (!formData.education) newErrors.education = 'Education requirement is required';
    if (formData.language.length === 0) newErrors.language = 'At least one language is required';
    if (!formData.experience) newErrors.experience = 'Experience level is required';
    if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';
    if (!formData.jobProfileDescription.trim()) newErrors.jobProfileDescription = 'Job profile description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = () => {
    const newErrors: any = {};
    // Custom Questions step doesn't have required fields, so always return true
    setErrors(newErrors);
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    switch (step) {
      case 0:
        isValid = validateStep1();
        break;
      case 1:
        isValid = validateStep2();
        break;
      case 2:
        isValid = validateStep3();
        break;
      case 3:
        isValid = validateStep4();
        break;
      case 4:
        isValid = validateStep5();
        break;
      default:
        isValid = true;
    }
    if (isValid) {
      setStep(step + 1);
      setErrors({});
    }
  };

  const handlePrev = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!jobId) {
      toast.error('Job ID not found');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      if (!user?.id) {
        toast.error('Please login to edit a job');
        return;
      }

      // Format data for submission
      const jobData = {
        title: formData.jobTitle.trim(),
        description: formData.jobTitleDescription.trim(),
        job_type: formData.jobType,
        location: {
          city: formData.city,
          area: formData.area,
          pincode: formData.pincode,
          street_address: formData.streetAddress
        },
        employment_types: formData.employmentTypes,
        schedules: formData.schedules,
        custom_schedule: formData.customSchedule,
        planned_start_date: formData.hasPlannedStartDate ? new Date(formData.plannedStartDate).toISOString() : null,
        openings: formData.numberOfHires === 'custom' ? parseInt(formData.customNumberOfHires) : parseInt(formData.numberOfHires),
        recruitment_timeline: formData.recruitmentTimeline,
        pay_type: formData.payType,
        min_amount: parseFloat(formData.minPay) || null,
        max_amount: parseFloat(formData.maxPay) || null,
        pay_rate: formData.payRate,
        supplemental_pay: formData.supplementalPay,
        custom_supplemental_pay: formData.customSupplementalPay,
        benefits: formData.benefits,
        custom_benefit: formData.customBenefits,
        minimum_education: formData.education,
        language_requirement: formData.language.join(', '),
        experience_type: formData.experience,
        industries: formData.industries,
        gender: formData.gender,
        skills: formData.skills,
        job_profile_description: formData.jobProfileDescription,
        notification_emails: [formData.notificationEmails],
        application_deadline: formData.applicationDeadline ? new Date(formData.applicationDeadline).toISOString() : null,
        application_type: formData.applicationType,
        application_link: formData.applicationLink,
        disclaimer: formData.disclaimer,
        updated_at: new Date().toISOString(),
      };

      // Update the job
      const { error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', jobId);

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      toast.success('Job updated successfully! 🎉');
      navigate('/employer/jobs');
      
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast.error(error.message || 'Failed to update job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData((prev: JobFormData) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleArrayChange = (field: keyof JobFormData, value: string, checked: boolean) => {
    setFormData((prev: JobFormData) => {
      const currentArray = prev[field] as string[];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb] flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-[#185a9d] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/employer/jobs')}
            className="px-6 py-3 bg-[#185a9d] text-white rounded-xl hover:bg-[#43cea2] transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb]">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#185a9d] mb-2">Edit Job</h1>
          <p className="text-gray-600">Update your job posting details</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= step ? 'bg-[#185a9d] border-[#185a9d] text-white' : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {index < step ? <FaEdit className="w-5 h-5" /> : stepItem.icon}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  index <= step ? 'text-[#185a9d]' : 'text-gray-500'
                }`}>
                  {stepItem.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    index < step ? 'bg-[#185a9d]' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-white/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Job Details */}
              {step === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Job Details</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                        errors.jobTitle ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Senior Software Engineer"
                    />
                    {errors.jobTitle && <p className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                    <textarea
                      value={formData.jobTitleDescription}
                      onChange={(e) => handleInputChange('jobTitleDescription', e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                        errors.jobTitleDescription ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Describe the role and responsibilities..."
                    />
                    {errors.jobTitleDescription && <p className="text-red-500 text-sm mt-1">{errors.jobTitleDescription}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                      <select
                        value={formData.jobType}
                        onChange={(e) => handleInputChange('jobType', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      >
                        <option value="onsite">On-site</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Mumbai"
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                      <input
                        type="text"
                        value={formData.area}
                        onChange={(e) => handleInputChange('area', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                        placeholder="e.g., Andheri West"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.pincode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., 400058"
                        maxLength={6}
                      />
                      {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Employment & Schedule */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Employment & Schedule</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Types *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {EMPLOYMENT_TYPES.map(type => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.employmentTypes.includes(type)}
                            onChange={(e) => handleArrayChange('employmentTypes', type, e.target.checked)}
                            className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                          />
                          <span className="ml-2 text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                    {errors.employmentTypes && <p className="text-red-500 text-sm mt-1">{errors.employmentTypes}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Schedules *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SCHEDULES.map(schedule => (
                        <label key={schedule} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.schedules.includes(schedule)}
                            onChange={(e) => handleArrayChange('schedules', schedule, e.target.checked)}
                            className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                          />
                          <span className="ml-2 text-sm text-gray-700">{schedule}</span>
                        </label>
                      ))}
                    </div>
                    {errors.schedules && <p className="text-red-500 text-sm mt-1">{errors.schedules}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of Hires</label>
                      <select
                        value={formData.numberOfHires}
                        onChange={(e) => handleInputChange('numberOfHires', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recruitment Timeline</label>
                      <select
                        value={formData.recruitmentTimeline}
                        onChange={(e) => handleInputChange('recruitmentTimeline', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      >
                        <option value="">Select timeline</option>
                        <option value="Immediate">Immediate</option>
                        <option value="1-2 weeks">1-2 weeks</option>
                        <option value="1 month">1 month</option>
                        <option value="2-3 months">2-3 months</option>
                        <option value="3+ months">3+ months</option>
                      </select>
                    </div>
                  </div>

                  {formData.numberOfHires === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Number of Hires</label>
                      <input
                        type="number"
                        value={formData.customNumberOfHires}
                        onChange={(e) => handleInputChange('customNumberOfHires', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                        placeholder="e.g., 10"
                        min="1"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Planned Start Date</label>
                      <input
                        type="date"
                        value={formData.plannedStartDate}
                        onChange={(e) => handleInputChange('plannedStartDate', e.target.value)}
                        disabled={!formData.hasPlannedStartDate}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="hasPlannedStartDate"
                        checked={formData.hasPlannedStartDate}
                        onChange={(e) => handleInputChange('hasPlannedStartDate', e.target.checked)}
                        className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                      />
                      <label htmlFor="hasPlannedStartDate" className="ml-2 text-sm text-gray-700">
                        Has planned start date
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Compensation */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Compensation</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pay Type *</label>
                      <select
                        value={formData.payType}
                        onChange={(e) => handleInputChange('payType', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.payType ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select pay type</option>
                        {PAY_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {errors.payType && <p className="text-red-500 text-sm mt-1">{errors.payType}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pay Rate *</label>
                      <select
                        value={formData.payRate}
                        onChange={(e) => handleInputChange('payRate', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.payRate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select rate</option>
                        {PAY_RATES.map(rate => (
                          <option key={rate} value={rate}>{rate}</option>
                        ))}
                      </select>
                      {errors.payRate && <p className="text-red-500 text-sm mt-1">{errors.payRate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Pay</label>
                      <input
                        type="number"
                        value={formData.minPay}
                        onChange={(e) => handleInputChange('minPay', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                        placeholder="e.g., 50000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Pay</label>
                      <input
                        type="number"
                        value={formData.maxPay}
                        onChange={(e) => handleInputChange('maxPay', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                        placeholder="e.g., 80000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                      <input
                        type="date"
                        value={formData.applicationDeadline}
                        onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplemental Pay</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SUPPLEMENTAL_PAY.map(pay => (
                        <label key={pay} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.supplementalPay.includes(pay)}
                            onChange={(e) => handleArrayChange('supplementalPay', pay, e.target.checked)}
                            className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                          />
                          <span className="ml-2 text-sm text-gray-700">{pay}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {BENEFITS.map(benefit => (
                        <label key={benefit} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.benefits.includes(benefit)}
                            onChange={(e) => handleArrayChange('benefits', benefit, e.target.checked)}
                            className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                          />
                          <span className="ml-2 text-sm text-gray-700">{benefit}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Benefits</label>
                    <textarea
                      value={formData.customBenefits}
                      onChange={(e) => handleInputChange('customBenefits', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      placeholder="Add any other benefits..."
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Requirements */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Requirements</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Education *</label>
                      <select
                        value={formData.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.education ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select education</option>
                        {EDUCATION_LEVELS.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      {errors.education && <p className="text-red-500 text-sm mt-1">{errors.education}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience *</label>
                      <select
                        value={formData.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.experience ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select experience</option>
                        {EXPERIENCE_LEVELS.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Languages *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {LANGUAGES.map(language => (
                        <label key={language} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.language.includes(language)}
                            onChange={(e) => handleArrayChange('language', language, e.target.checked)}
                            className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                          />
                          <span className="ml-2 text-sm text-gray-700">{language}</span>
                        </label>
                      ))}
                    </div>
                    {errors.language && <p className="text-red-500 text-sm mt-1">{errors.language}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SKILLS.map(skill => (
                        <label key={skill} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.skills.includes(skill)}
                            onChange={(e) => handleArrayChange('skills', skill, e.target.checked)}
                            className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                          />
                          <span className="ml-2 text-sm text-gray-700">{skill}</span>
                        </label>
                      ))}
                    </div>
                    {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industries</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {INDUSTRIES.map(industry => (
                        <label key={industry} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.industries.includes(industry)}
                            onChange={(e) => handleArrayChange('industries', industry, e.target.checked)}
                            className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                          />
                          <span className="ml-2 text-sm text-gray-700">{industry}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Profile Description *</label>
                    <textarea
                      value={formData.jobProfileDescription}
                      onChange={(e) => handleInputChange('jobProfileDescription', e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                        errors.jobProfileDescription ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Detailed description of the job profile..."
                    />
                    {errors.jobProfileDescription && <p className="text-red-500 text-sm mt-1">{errors.jobProfileDescription}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notification Email</label>
                      <input
                        type="email"
                        value={formData.notificationEmails}
                        onChange={(e) => handleInputChange('notificationEmails', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                        placeholder="email@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      >
                        <option value="">Any</option>
                        {GENDERS.map(gender => (
                          <option key={gender} value={gender}>{gender}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Custom Questions */}
              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Custom Questions</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Type</label>
                    <select
                      value={formData.applicationType}
                      onChange={(e) => handleInputChange('applicationType', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                    >
                      <option value="in_app">In-app Application</option>
                      <option value="external_link">External Link</option>
                    </select>
                  </div>

                  {formData.applicationType === 'external_link' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Application Link</label>
                      <input
                        type="url"
                        value={formData.applicationLink}
                        onChange={(e) => handleInputChange('applicationLink', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Disclaimer</label>
                    <textarea
                      value={formData.disclaimer}
                      onChange={(e) => handleInputChange('disclaimer', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      placeholder="Any additional terms or disclaimers..."
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Summary */}
              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Summary</h2>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Job Details</h3>
                      <p className="text-gray-600">{formData.jobTitle}</p>
                      <p className="text-gray-600">{formData.jobTitleDescription}</p>
                      <p className="text-gray-600">Type: {formData.jobType}</p>
                      <p className="text-gray-600">Location: {formData.city}, {formData.area}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">Employment & Schedule</h3>
                      <p className="text-gray-600">Employment Types: {formData.employmentTypes.join(', ')}</p>
                      <p className="text-gray-600">Schedules: {formData.schedules.join(', ')}</p>
                      <p className="text-gray-600">Number of Hires: {formData.numberOfHires}</p>
                      <p className="text-gray-600">Timeline: {formData.recruitmentTimeline}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">Compensation</h3>
                      <p className="text-gray-600">Pay Type: {formData.payType}</p>
                      <p className="text-gray-600">Pay Rate: {formData.payRate}</p>
                      <p className="text-gray-600">Range: {formData.minPay} - {formData.maxPay}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">Requirements</h3>
                      <p className="text-gray-600">Education: {formData.education}</p>
                      <p className="text-gray-600">Experience: {formData.experience}</p>
                      <p className="text-gray-600">Skills: {formData.skills.join(', ')}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">Job Profile</h3>
                      <p className="text-gray-600">{formData.jobProfileDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrev}
                  disabled={step === 0}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors ${
                    step === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                {step < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white rounded-xl font-medium hover:from-[#43cea2] hover:to-[#185a9d] transition-all duration-300"
                  >
                    Next
                    <FaArrowRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white rounded-xl font-medium hover:from-[#43cea2] hover:to-[#185a9d] transition-all duration-300 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSave className="w-4 h-4 mr-2" />
                        Update Job
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EditJobForm; 
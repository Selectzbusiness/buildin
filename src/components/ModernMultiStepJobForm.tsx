import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaArrowRight, FaArrowLeft, FaRegBuilding, FaMoneyBillWave, FaUserTie, FaClipboardList, FaRegCalendarAlt, FaMapMarkerAlt, FaKeyboard, FaCalendarAlt, FaUsers, FaClock, FaListUl, FaDollarSign, FaGift, FaStar, FaGraduationCap, FaLanguage, FaBriefcase, FaIndustry, FaUserFriends, FaVenusMars, FaCode, FaFileAlt, FaEnvelope, FaClock as FaDeadline, FaEdit, FaPaperPlane, FaSpinner, FaSave, FaFolderOpen, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import DraftManager from './DraftManager';
import CustomQuestionsManager from './CustomQuestionsManager';
import toast from 'react-hot-toast';
import { AuthContext } from '../contexts/AuthContext';
import CompanyInfoIcon from './icons/CompanyInfoIcon';

// Placeholder for all the field types from JobFormData
interface CustomQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

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
  customQuestions: CustomQuestion[];
  applicationType: 'in_app' | 'external_link';
  applicationLink: string;
  disclaimer: string;
}

const EMPLOYMENT_TYPES = [
  'Full-time', 'Permanent', 'Fresher', 'Part-time', 'Internship', 'Contractual/Temporary', 'Freelance', 'Volunteer'
];
const SCHEDULES = [
  'Day shift', 'Morning shift', 'Rotational shift', 'Night shift', 'Monday to Friday', 'Evening shift', 'Weekend availability', 'Fixed shift', 'US shift', 'UK shift', 'Weekend only', 'Others'
];
const RECRUITMENT_TIMELINES = [
  '1 to 3 days', '3 to 7 days', '1 to 2 weeks', '2 to 4 weeks', 'More than 4 weeks'
];

const PAY_TYPES = ['Fixed', 'Negotiable', 'Performance based', 'Commission based'];
const PAY_RATES = ['Per hour', 'Per day', 'Per week', 'Per month', 'Per year', 'Per project'];
const SUPPLEMENTAL_PAY = ['Performance bonus', 'Yearly bonus', 'Commission', 'Tips', 'Overtime pay', 'Other'];
const BENEFITS = [
  'Health insurance', 'Dental insurance', 'Vision insurance', 'Life insurance', 'Paid time off', 'Sick leave',
  'Parental leave', 'Flexible schedule', 'Remote work', 'Professional development', 'Tuition reimbursement',
  'Gym membership', 'Free food', 'Transportation', 'Child care', 'Other'
];

const EDUCATION_LEVELS = ['10th Pass', '12th Pass', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Other'];
const EXPERIENCE_LEVELS = ['Fresher', '1-2 years', '3-5 years', '6-10 years', '10+ years'];
const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Marketing', 'Sales',
  'Design', 'Media', 'Consulting', 'Real Estate', 'Transportation', 'Food & Beverage', 'Other'
];
const AGE_RANGES = ['18-25', '26-35', '36-45', '46-55', '55+', 'Any age'];
const GENDER_PREFERENCES = ['Male', 'Female', 'Any gender'];
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
  { label: 'Payment', icon: <FaMoneyBillWave /> },
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

// Add CouponValidation type
interface CouponValidation {
  valid: boolean;
  message?: string;
  discount_type?: string;
  discount_value?: number;
  discount_amount?: number;
  coupon_id?: string;
}

// Add at the top, after other useState declarations
const plans = [
  {
    name: 'Basic',
    price: 1999,
    features: [
      '30 days job listing',
      'Basic job visibility',
      'Standard application management',
      'Email support',
      'Basic candidate filtering',
    ],
  },
  {
    name: 'Professional',
    price: 3499,
    features: [
      '30 days job listing',
      'Featured job placement',
      'Priority in search results',
      'Advanced application management',
      'Priority support',
      'Advanced candidate filtering',
      'Company branding',
    ],
  },
  {
    name: 'Enterprise',
    price: 5999,
    features: [
      '30 days job listing',
      'Premium featured placement',
      'Top priority in search results',
      'Advanced application management',
      '24/7 dedicated support',
      'Advanced candidate filtering',
      'Custom branding',
      'Analytics dashboard',
      'API access',
    ],
  },
];

const ModernMultiStepJobForm: React.FC = () => {
  const { user, profile } = useContext(AuthContext);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDraftManager, setShowDraftManager] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigate = useNavigate();
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;

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
        if (companyList.length === 1) {
          setSelectedCompanyId(companyList[0].id);
        }
      }
    };
    fetchCompanies();
  }, [user]);

  // Track changes for auto-save detection
  useEffect(() => {
    const hasData = Object.values(formData).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'boolean') return value;
      return value !== null && value !== undefined;
    });
    setHasUnsavedChanges(hasData);
  }, [formData]);

  // Validation for Step 1
  const validateStep1 = () => {
    const newErrors: any = {};
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!formData.jobTitleDescription.trim()) newErrors.jobTitleDescription = 'Description is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) newErrors.pincode = 'Pincode must be 6 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add validation for Step 2
  const validateStep2 = () => {
    const newErrors: any = {};
    if (!formData.employmentTypes.length) newErrors.employmentTypes = 'Select at least one employment type';
    if (!formData.schedules.length) newErrors.schedules = 'Select at least one schedule';
    if (formData.schedules.includes('Others') && !formData.customSchedule.trim()) newErrors.customSchedule = 'Enter custom schedule';
    if (formData.hasPlannedStartDate && !formData.plannedStartDate) newErrors.plannedStartDate = 'Select a start date';
    if (!formData.numberOfHires) newErrors.numberOfHires = 'Select number of hires';
    if (formData.numberOfHires === 'custom' && !formData.customNumberOfHires) newErrors.customNumberOfHires = 'Enter number of hires';
    if (!formData.recruitmentTimeline) newErrors.recruitmentTimeline = 'Select recruitment timeline';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add validation for Step 3
  const validateStep3 = () => {
    const newErrors: any = {};
    if (!formData.payType) newErrors.payType = 'Select pay type';
    if (!formData.minPay) newErrors.minPay = 'Enter minimum pay';
    if (!formData.maxPay) newErrors.maxPay = 'Enter maximum pay';
    if (parseFloat(formData.minPay) > parseFloat(formData.maxPay)) {
      newErrors.maxPay = 'Maximum pay must be greater than minimum pay';
    }
    if (!formData.payRate) newErrors.payRate = 'Select pay rate';
    if (formData.supplementalPay.includes('Other') && !formData.customSupplementalPay.trim()) {
      newErrors.customSupplementalPay = 'Enter custom supplemental pay';
    }
    if (formData.benefits.includes('Other') && !formData.customBenefits.trim()) {
      newErrors.customBenefits = 'Enter custom benefits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add validation for Step 4
  const validateStep4 = () => {
    const newErrors: any = {};
    if (!formData.education) newErrors.education = 'Select education level';
    if (!formData.language.length) newErrors.language = 'Select at least one language';
    if (formData.language.includes('Other') && !formData.customLanguage.trim()) {
      newErrors.customLanguage = 'Enter custom language';
    }
    if (!formData.experience) newErrors.experience = 'Select experience level';
    if (!formData.industries.length) newErrors.industries = 'Select at least one industry';
    if (formData.industries.includes('Other') && !formData.customIndustry.trim()) {
      newErrors.customIndustry = 'Enter custom industry';
    }
    if (!formData.age) newErrors.age = 'Select age preference';
    if (!formData.gender) newErrors.gender = 'Select gender preference';
    if (!formData.skills.length) newErrors.skills = 'Select at least one skill';
    if (formData.skills.includes('Other') && !formData.customSkills.trim()) {
      newErrors.customSkills = 'Enter custom skills';
    }
    if (!formData.jobProfileDescription.trim()) newErrors.jobProfileDescription = 'Job description is required';
    if (!formData.notificationEmails.trim()) newErrors.notificationEmails = 'Notification email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.notificationEmails)) {
      newErrors.notificationEmails = 'Enter a valid email address';
    }
    if (!formData.applicationDeadline) newErrors.applicationDeadline = 'Select application deadline';
    
    // Validate deadline is not in the past
    if (formData.applicationDeadline && new Date(formData.applicationDeadline) <= new Date()) {
      newErrors.applicationDeadline = 'Deadline must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add validation for Step 5 (final validation)
  const validateStep5 = () => {
    const newErrors: any = {};
    if (formData.applicationType === 'external_link') {
      if (!formData.applicationLink.trim()) newErrors.applicationLink = 'External application link is required';
      if (!formData.disclaimer.trim()) newErrors.disclaimer = 'Disclaimer is required for external applications';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };
  const handleJobType = (type: 'onsite' | 'remote' | 'hybrid') => {
    setFormData((prev) => ({ ...prev, jobType: type }));
  };

  // Handlers for Step 2, 3 & 4
  const handleMultiSelect = (field: 'employmentTypes' | 'schedules' | 'supplementalPay' | 'benefits' | 'language' | 'industries' | 'skills', value: string) => {
    setFormData((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value],
      };
    });
    setErrors((prev: any) => ({ ...prev, [field]: undefined }));
  };

  // Add this handler for select changes
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };

  // Load draft data
  const handleLoadDraft = (draft: any) => {
    setFormData({
      jobTitle: draft.jobTitle || '',
      jobTitleDescription: draft.jobTitleDescription || '',
      jobType: draft.jobType || 'onsite',
      city: draft.city || '',
      area: draft.area || '',
      pincode: draft.pincode || '',
      streetAddress: draft.streetAddress || '',
      employmentTypes: draft.employmentTypes || [],
      schedules: draft.schedules || [],
      customSchedule: draft.customSchedule || '',
      hasPlannedStartDate: draft.hasPlannedStartDate || false,
      plannedStartDate: draft.plannedStartDate || '',
      numberOfHires: draft.numberOfHires || '1',
      customNumberOfHires: draft.customNumberOfHires || '',
      recruitmentTimeline: draft.recruitmentTimeline || '',
      payType: draft.payType || '',
      minPay: draft.minPay || '',
      maxPay: draft.maxPay || '',
      payRate: draft.payRate || '',
      supplementalPay: draft.supplementalPay || [],
      customSupplementalPay: draft.customSupplementalPay || '',
      benefits: draft.benefits || [],
      customBenefits: draft.customBenefits || '',
      education: draft.education || '',
      language: draft.language || [],
      customLanguage: draft.customLanguage || '',
      experience: draft.experience || '',
      industries: draft.industries || [],
      customIndustry: draft.customIndustry || '',
      age: draft.age || '',
      gender: draft.gender || '',
      skills: draft.skills || [],
      customSkills: draft.customSkills || '',
      jobProfileDescription: draft.jobProfileDescription || '',
      notificationEmails: draft.notificationEmails || '',
      applicationDeadline: draft.applicationDeadline || '',
      customQuestions: draft.customQuestions || [],
      applicationType: draft.applicationType || 'in_app',
      applicationLink: draft.applicationLink || '',
      disclaimer: draft.disclaimer || '',
    });
    setStep(draft.current_step || 0);
    setHasUnsavedChanges(true);
  };

  // Step 1 UI
  const renderStep1 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaRegBuilding className="text-blue-600" /> Let's start with your job details!
        </h2>
        <p className="text-gray-500 mb-4">Tell us about the role and where it's based.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FaKeyboard className="inline-block text-gray-400" /> Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleInput}
            className={`w-full px-4 py-3 rounded-xl border ${errors.jobTitle ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="e.g. Senior Software Engineer"
          />
          {errors.jobTitle && <p className="text-red-500 text-xs mt-1">{errors.jobTitle}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FaKeyboard className="inline-block text-gray-400" /> Brief Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="jobTitleDescription"
            value={formData.jobTitleDescription}
            onChange={handleInput}
            rows={3}
            className={`w-full px-4 py-3 rounded-xl border ${errors.jobTitleDescription ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="A short summary of the job role..."
          />
          {errors.jobTitleDescription && <p className="text-red-500 text-xs mt-1">{errors.jobTitleDescription}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FaMapMarkerAlt className="inline-block text-gray-400" /> City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInput}
            className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="e.g. Mumbai"
          />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FaMapMarkerAlt className="inline-block text-gray-400" /> Area/Locality
          </label>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={handleInput}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Andheri East"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FaMapMarkerAlt className="inline-block text-gray-400" /> Pincode
          </label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleInput}
            className={`w-full px-4 py-3 rounded-xl border ${errors.pincode ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="6 digit pincode"
            maxLength={6}
          />
          {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <FaMapMarkerAlt className="inline-block text-gray-400" /> Street Address
          </label>
          <input
            type="text"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={handleInput}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Flat/Building, Street, etc."
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Work Type <span className="text-red-500">*</span></label>
        <div className="flex gap-4">
          {(['onsite', 'remote', 'hybrid'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleJobType(type)}
              className={`px-6 py-2 rounded-full font-semibold border-2 transition-all duration-200 flex items-center gap-2
                ${formData.jobType === type ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">How do you want to receive applications?</label>
        <div className="flex gap-4 mb-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="applicationType"
              value="in_app"
              checked={formData.applicationType === 'in_app'}
              onChange={() => setFormData(prev => ({ ...prev, applicationType: 'in_app', applicationLink: '', disclaimer: '' }))}
              className="mr-2"
            />
            In-app (candidates apply inside the app)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="applicationType"
              value="external_link"
              checked={formData.applicationType === 'external_link'}
              onChange={() => setFormData(prev => ({ ...prev, applicationType: 'external_link' }))}
              className="mr-2"
            />
            Redirect to external link
          </label>
        </div>
        {formData.applicationType === 'external_link' && (
          <>
            <input
              type="url"
              name="applicationLink"
              value={formData.applicationLink}
              onChange={handleInput}
              placeholder="Enter external application URL"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
            <textarea
              name="disclaimer"
              value={formData.disclaimer}
              onChange={handleInput}
              placeholder="Enter disclaimer (required)"
              className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
            {errors.disclaimer && <p className="text-red-500 text-xs mt-1">{errors.disclaimer}</p>}
          </>
        )}
      </div>
    </div>
  );

  // Step 2 UI
  const renderStep2 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaClipboardList className="text-blue-600" /> How will people work?
        </h2>
        <p className="text-gray-500 mb-4">Choose employment type, schedule, and hiring plans.</p>
      </div>
      {/* Employment Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {EMPLOYMENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleMultiSelect('employmentTypes', type)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.employmentTypes.includes(type) ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.employmentTypes && <p className="text-red-500 text-xs mt-1">{errors.employmentTypes}</p>}
      </div>
      {/* Schedules */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Schedule <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {SCHEDULES.map((schedule) => (
            <button
              key={schedule}
              type="button"
              onClick={() => handleMultiSelect('schedules', schedule)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.schedules.includes(schedule) ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            >
              {schedule}
            </button>
          ))}
        </div>
        {formData.schedules.includes('Others') && (
          <input
            type="text"
            name="customSchedule"
            value={formData.customSchedule}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.customSchedule ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Enter custom schedule"
          />
        )}
        {errors.schedules && <p className="text-red-500 text-xs mt-1">{errors.schedules}</p>}
        {errors.customSchedule && <p className="text-red-500 text-xs mt-1">{errors.customSchedule}</p>}
      </div>
      {/* Planned Start Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Planned Start Date</label>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.hasPlannedStartDate}
              onChange={() => setFormData((prev) => ({ ...prev, hasPlannedStartDate: !prev.hasPlannedStartDate }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span>Specify start date</span>
          </label>
          {formData.hasPlannedStartDate && (
            <input
              type="date"
              name="plannedStartDate"
              value={formData.plannedStartDate}
              onChange={handleInput}
              className={`px-4 py-2 rounded-xl border ${errors.plannedStartDate ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          )}
        </div>
        {errors.plannedStartDate && <p className="text-red-500 text-xs mt-1">{errors.plannedStartDate}</p>}
      </div>
      {/* Number of Hires */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Number of People to Hire <span className="text-red-500">*</span></label>
        <div className="flex gap-2">
          <select
            name="numberOfHires"
            value={formData.numberOfHires}
            onChange={handleSelect}
            className={`px-4 py-2 rounded-xl border ${errors.numberOfHires ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
            ))}
            <option value="10+">10+</option>
            <option value="custom">Custom</option>
          </select>
          {formData.numberOfHires === 'custom' && (
            <input
              type="number"
              name="customNumberOfHires"
              value={formData.customNumberOfHires}
              onChange={handleInput}
              className={`ml-2 px-4 py-2 rounded-xl border ${errors.customNumberOfHires ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter number"
              min={1}
            />
          )}
        </div>
        {errors.numberOfHires && <p className="text-red-500 text-xs mt-1">{errors.numberOfHires}</p>}
        {errors.customNumberOfHires && <p className="text-red-500 text-xs mt-1">{errors.customNumberOfHires}</p>}
      </div>
      {/* Recruitment Timeline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timeline to Recruit <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {RECRUITMENT_TIMELINES.map((timeline) => (
            <button
              key={timeline}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, recruitmentTimeline: timeline }))}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.recruitmentTimeline === timeline ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            >
              {timeline}
            </button>
          ))}
        </div>
        {errors.recruitmentTimeline && <p className="text-red-500 text-xs mt-1">{errors.recruitmentTimeline}</p>}
      </div>
    </div>
  );

  // Step 3 UI
  const renderStep3 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaMoneyBillWave className="text-green-600" /> What's the compensation?
        </h2>
        <p className="text-gray-500 mb-4">Set pay structure, benefits, and perks to attract top talent.</p>
      </div>

      {/* Pay Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pay Type <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 gap-3">
          {PAY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, payType: type }))}
              className={`p-4 rounded-xl border-2 font-medium transition-all duration-200 text-left ${formData.payType === type ? 'bg-green-600 text-white border-green-600 shadow-lg' : 'bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:border-green-300'}`}
            >
              <div className="flex items-center gap-3">
                <FaDollarSign className={`text-lg ${formData.payType === type ? 'text-white' : 'text-green-600'}`} />
                <span>{type}</span>
              </div>
            </button>
          ))}
        </div>
        {errors.payType && <p className="text-red-500 text-xs mt-1">{errors.payType}</p>}
      </div>

      {/* Pay Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pay Range <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Minimum Pay</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                name="minPay"
                value={formData.minPay}
                onChange={handleInput}
                className={`w-full pl-8 pr-4 py-3 rounded-xl border ${errors.minPay ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                placeholder="0"
                min="0"
              />
            </div>
            {errors.minPay && <p className="text-red-500 text-xs mt-1">{errors.minPay}</p>}
          </div>
          <div className="flex items-center justify-center">
            <span className="text-gray-400">to</span>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Maximum Pay</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                name="maxPay"
                value={formData.maxPay}
                onChange={handleInput}
                className={`w-full pl-8 pr-4 py-3 rounded-xl border ${errors.maxPay ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                placeholder="0"
                min="0"
              />
            </div>
            {errors.maxPay && <p className="text-red-500 text-xs mt-1">{errors.maxPay}</p>}
          </div>
        </div>
      </div>

      {/* Pay Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pay Rate <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {PAY_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, payRate: rate }))}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.payRate === rate ? 'bg-green-600 text-white border-green-600 shadow' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}
            >
              {rate}
            </button>
          ))}
        </div>
        {errors.payRate && <p className="text-red-500 text-xs mt-1">{errors.payRate}</p>}
      </div>

      {/* Supplemental Pay */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Supplemental Pay</label>
        <div className="flex flex-wrap gap-2">
          {SUPPLEMENTAL_PAY.map((pay) => (
            <button
              key={pay}
              type="button"
              onClick={() => handleMultiSelect('supplementalPay', pay)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.supplementalPay.includes(pay) ? 'bg-green-600 text-white border-green-600 shadow' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}
            >
              {pay}
            </button>
          ))}
        </div>
        {formData.supplementalPay.includes('Other') && (
          <input
            type="text"
            name="customSupplementalPay"
            value={formData.customSupplementalPay}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.customSupplementalPay ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-green-500`}
            placeholder="Enter custom supplemental pay"
          />
        )}
        {errors.customSupplementalPay && <p className="text-red-500 text-xs mt-1">{errors.customSupplementalPay}</p>}
      </div>

      {/* Benefits */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Benefits & Perks</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {BENEFITS.map((benefit) => (
            <button
              key={benefit}
              type="button"
              onClick={() => handleMultiSelect('benefits', benefit)}
              className={`p-3 rounded-lg border-2 font-medium transition-all duration-200 text-left text-sm ${formData.benefits.includes(benefit) ? 'bg-green-600 text-white border-green-600 shadow' : 'bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:border-green-300'}`}
            >
              <div className="flex items-center gap-2">
                <FaGift className={`text-sm ${formData.benefits.includes(benefit) ? 'text-white' : 'text-green-600'}`} />
                <span>{benefit}</span>
              </div>
            </button>
          ))}
        </div>
        {formData.benefits.includes('Other') && (
          <input
            type="text"
            name="customBenefits"
            value={formData.customBenefits}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.customBenefits ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-green-500`}
            placeholder="Enter custom benefits"
          />
        )}
        {errors.customBenefits && <p className="text-red-500 text-xs mt-1">{errors.customBenefits}</p>}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaStar className="text-yellow-500" />
          Compensation Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Pay Type:</span>
            <span className="font-medium">{formData.payType || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pay Range:</span>
            <span className="font-medium">
              {formData.minPay && formData.maxPay ? `₹${formData.minPay} - ₹${formData.maxPay}` : 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pay Rate:</span>
            <span className="font-medium">{formData.payRate || 'Not set'}</span>
          </div>
          {formData.supplementalPay.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Supplemental Pay:</span>
              <span className="font-medium">{formData.supplementalPay.join(', ')}</span>
            </div>
          )}
          {formData.benefits.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Benefits:</span>
              <span className="font-medium">{formData.benefits.length} selected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 4 UI
  const renderStep4 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaUserTie className="text-purple-600" /> What are the requirements?
        </h2>
        <p className="text-gray-500 mb-4">Define qualifications, skills, and preferences for the role.</p>
      </div>

      {/* Education & Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaGraduationCap className="text-purple-600" /> Education Level <span className="text-red-500">*</span>
          </label>
          <select
            name="education"
            value={formData.education}
            onChange={handleSelect}
            className={`w-full px-4 py-3 rounded-xl border ${errors.education ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
          >
            <option value="">Select education level</option>
            {EDUCATION_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {errors.education && <p className="text-red-500 text-xs mt-1">{errors.education}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaLanguage className="text-purple-600" /> Languages <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleMultiSelect('language', lang)}
                className={`px-3 py-1 rounded-full border-2 text-sm font-medium transition-all duration-200 ${formData.language.includes(lang) ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
              >
                {lang}
              </button>
            ))}
          </div>
          {formData.language.includes('Other') && (
            <input
              type="text"
              name="customLanguage"
              value={formData.customLanguage}
              onChange={handleInput}
              className={`mt-2 w-full px-4 py-2 rounded-xl border ${errors.customLanguage ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="Enter custom language"
            />
          )}
          {errors.language && <p className="text-red-500 text-xs mt-1">{errors.language}</p>}
          {errors.customLanguage && <p className="text-red-500 text-xs mt-1">{errors.customLanguage}</p>}
        </div>
      </div>

      {/* Experience & Industries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaBriefcase className="text-purple-600" /> Experience Level <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((exp) => (
              <button
                key={exp}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, experience: exp }))}
                className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.experience === exp ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
              >
                {exp}
              </button>
            ))}
          </div>
          {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaIndustry className="text-purple-600" /> Industries <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((industry) => (
              <button
                key={industry}
                type="button"
                onClick={() => handleMultiSelect('industries', industry)}
                className={`px-3 py-1 rounded-full border-2 text-sm font-medium transition-all duration-200 ${formData.industries.includes(industry) ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
              >
                {industry}
              </button>
            ))}
          </div>
          {formData.industries.includes('Other') && (
            <input
              type="text"
              name="customIndustry"
              value={formData.customIndustry}
              onChange={handleInput}
              className={`mt-2 w-full px-4 py-2 rounded-xl border ${errors.customIndustry ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              placeholder="Enter custom industry"
            />
          )}
          {errors.industries && <p className="text-red-500 text-xs mt-1">{errors.industries}</p>}
          {errors.customIndustry && <p className="text-red-500 text-xs mt-1">{errors.customIndustry}</p>}
        </div>
      </div>

      {/* Age & Gender Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaUserFriends className="text-purple-600" /> Age Preference <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {AGE_RANGES.map((age) => (
              <button
                key={age}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, age: age }))}
                className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.age === age ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
              >
                {age}
              </button>
            ))}
          </div>
          {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaVenusMars className="text-purple-600" /> Gender Preference <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {GENDER_PREFERENCES.map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, gender: gender }))}
                className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.gender === gender ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
              >
                {gender}
              </button>
            ))}
          </div>
          {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FaCode className="text-purple-600" /> Required Skills <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {SKILLS.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => handleMultiSelect('skills', skill)}
              className={`p-3 rounded-lg border-2 font-medium transition-all duration-200 text-left text-sm ${formData.skills.includes(skill) ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-50 hover:border-purple-300'}`}
            >
              <div className="flex items-center gap-2">
                <FaCode className={`text-sm ${formData.skills.includes(skill) ? 'text-white' : 'text-purple-600'}`} />
                <span>{skill}</span>
              </div>
            </button>
          ))}
        </div>
        {formData.skills.includes('Other') && (
          <input
            type="text"
            name="customSkills"
            value={formData.customSkills}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.customSkills ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            placeholder="Enter custom skills"
          />
        )}
        {errors.skills && <p className="text-red-500 text-xs mt-1">{errors.skills}</p>}
        {errors.customSkills && <p className="text-red-500 text-xs mt-1">{errors.customSkills}</p>}
      </div>

      {/* Job Profile Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FaFileAlt className="text-purple-600" /> Job Profile Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="jobProfileDescription"
          value={formData.jobProfileDescription}
          onChange={handleInput}
          rows={6}
          className={`w-full px-4 py-3 rounded-xl border ${errors.jobProfileDescription ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
          placeholder="Describe the job responsibilities, requirements, and what you're looking for in a candidate..."
        />
        {errors.jobProfileDescription && <p className="text-red-500 text-xs mt-1">{errors.jobProfileDescription}</p>}
      </div>

      {/* Notifications & Deadline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaEnvelope className="text-purple-600" /> Notification Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="notificationEmails"
            value={formData.notificationEmails}
            onChange={handleInput}
            className={`w-full px-4 py-3 rounded-xl border ${errors.notificationEmails ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            placeholder="email@company.com"
          />
          {errors.notificationEmails && <p className="text-red-500 text-xs mt-1">{errors.notificationEmails}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaDeadline className="text-purple-600" /> Application Deadline <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="applicationDeadline"
            value={formData.applicationDeadline}
            onChange={handleInput}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 rounded-xl border ${errors.applicationDeadline ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
          {errors.applicationDeadline && <p className="text-red-500 text-xs mt-1">{errors.applicationDeadline}</p>}
        </div>
      </div>

      {/* Requirements Summary Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaStar className="text-yellow-500" />
          Requirements Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Education:</span>
              <span className="font-medium">{formData.education || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Experience:</span>
              <span className="font-medium">{formData.experience || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Languages:</span>
              <span className="font-medium">{formData.language.length > 0 ? formData.language.join(', ') : 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Industries:</span>
              <span className="font-medium">{formData.industries.length > 0 ? formData.industries.join(', ') : 'Not set'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Age:</span>
              <span className="font-medium">{formData.age || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gender:</span>
              <span className="font-medium">{formData.gender || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Skills:</span>
              <span className="font-medium">{formData.skills.length > 0 ? `${formData.skills.length} selected` : 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deadline:</span>
              <span className="font-medium">{formData.applicationDeadline || 'Not set'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 5 UI - Custom Questions
  const renderStep5 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaFileAlt className="text-indigo-600" /> Custom Application Questions
        </h2>
        <p className="text-gray-500 mb-4">Add custom questions to gather specific information from applicants.</p>
      </div>

      <CustomQuestionsManager
        questions={formData.customQuestions}
        onChange={(questions) => setFormData(prev => ({ ...prev, customQuestions: questions }))}
      />
    </div>
  );

  // Step 6 UI - Preview & Submit
  const renderStep6 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaEye className="text-indigo-600" /> Review & Submit
        </h2>
        <p className="text-gray-500 mb-4">Review all details before posting your job.</p>
      </div>

      {/* Job Details Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaRegBuilding className="text-blue-600" />
            Job Details
          </h3>
          <button
            onClick={() => setStep(0)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            <FaEdit className="text-xs" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Job Title:</span>
              <span className="font-medium">{formData.jobTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Work Type:</span>
              <span className="font-medium capitalize">{formData.jobType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">City:</span>
              <span className="font-medium">{formData.city}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Area:</span>
              <span className="font-medium">{formData.area || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pincode:</span>
              <span className="font-medium">{formData.pincode || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium">{formData.jobTitleDescription.length > 50 ? `${formData.jobTitleDescription.substring(0, 50)}...` : formData.jobTitleDescription}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Employment & Schedule Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaClipboardList className="text-green-600" />
            Employment & Schedule
          </h3>
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
          >
            <FaEdit className="text-xs" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Employment Types:</span>
              <span className="font-medium">{formData.employmentTypes.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Schedules:</span>
              <span className="font-medium">{formData.schedules.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Number of Hires:</span>
              <span className="font-medium">{formData.numberOfHires === 'custom' ? formData.customNumberOfHires : formData.numberOfHires}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="font-medium">{formData.hasPlannedStartDate ? formData.plannedStartDate : 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recruitment Timeline:</span>
              <span className="font-medium">{formData.recruitmentTimeline}</span>
            </div>
            {formData.customSchedule && (
              <div className="flex justify-between">
                <span className="text-gray-600">Custom Schedule:</span>
                <span className="font-medium">{formData.customSchedule}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compensation Summary */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaMoneyBillWave className="text-emerald-600" />
            Compensation
          </h3>
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 text-sm font-medium transition-colors"
          >
            <FaEdit className="text-xs" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Pay Type:</span>
              <span className="font-medium">{formData.payType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pay Range:</span>
              <span className="font-medium">₹{formData.minPay} - ₹{formData.maxPay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pay Rate:</span>
              <span className="font-medium">{formData.payRate}</span>
            </div>
          </div>
          <div className="space-y-2">
            {formData.supplementalPay.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Supplemental Pay:</span>
                <span className="font-medium">{formData.supplementalPay.join(', ')}</span>
              </div>
            )}
            {formData.benefits.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Benefits:</span>
                <span className="font-medium">{formData.benefits.length} selected</span>
              </div>
            )}
            {formData.customSupplementalPay && (
              <div className="flex justify-between">
                <span className="text-gray-600">Custom Pay:</span>
                <span className="font-medium">{formData.customSupplementalPay}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaUserTie className="text-purple-600" />
            Requirements
          </h3>
          <button
            onClick={() => setStep(3)}
            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
          >
            <FaEdit className="text-xs" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Education:</span>
              <span className="font-medium">{formData.education}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Experience:</span>
              <span className="font-medium">{formData.experience}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Languages:</span>
              <span className="font-medium">{formData.language.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Industries:</span>
              <span className="font-medium">{formData.industries.join(', ')}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Age:</span>
              <span className="font-medium">{formData.age}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gender:</span>
              <span className="font-medium">{formData.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Skills:</span>
              <span className="font-medium">{formData.skills.length} selected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deadline:</span>
              <span className="font-medium">{formData.applicationDeadline}</span>
            </div>
          </div>
        </div>
        {formData.jobProfileDescription && (
          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 font-medium">Job Description:</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{formData.jobProfileDescription}</p>
          </div>
        )}
      </div>

      {/* Final Submit Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaPaperPlane className="text-indigo-600" />
          Ready to Post Your Job?
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span>All required fields are completed</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span>Job will be visible to job seekers immediately</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span>You'll receive notifications at {formData.notificationEmails}</span>
          </div>
        </div>
        
        <button
          onClick={() => setStep(6)}
          className="w-full mt-6 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaArrowRight /> Next
        </button>
      </div>
    </div>
  );

  // Progress bar
  const progress = ((step + 1) / steps.length) * 100;

  // Navigation
  const handleNext = () => {
    if (step === 0) {
      if (!selectedCompanyId) {
        toast.error('Please select a company before continuing.');
        return;
      }
      if (!validateStep1()) return;
    }
    if (step === 1) {
      if (!validateStep2()) return;
    }
    if (step === 2) {
      if (!validateStep3()) return;
    }
    if (step === 3) {
      if (!validateStep4()) return;
    }
    if (step === 4) {
      if (!validateStep5()) return;
      setStep((prev) => prev + 1); // Move to payment step
      return;
    }
    // Only allow submit after paymentSuccess is true
    if (step === 5 && !paymentSuccess) {
      toast.error('Please complete payment before posting the job.');
      return;
    }
    setStep((prev) => prev + 1);
  };
  const handleBack = () => setStep((prev) => prev - 1);

  // Submit handler
  const handleSubmit = async () => {
    if (!paymentSuccess) {
      toast.error('Please complete payment before posting the job.');
      return;
    }
    setLoading(true);
    setError(null);
    if (!selectedCompanyId) {
      setError('Please select a company');
      setLoading(false);
      return;
    }
    setSubmitting(true);
    
    try {
      if (!user?.id) {
        toast.error('Please login to post a job');
        return;
      }

      // Get company ID for the current user
      const { data: links, error: linkError } = await supabase
        .from('employer_companies')
        .select('company_id')
        .eq('user_id', user.id);
      if (linkError) throw linkError;
      const companyIds = (links || []).map((l: any) => l.company_id);
      let companyData = null;
      if (companyIds.length > 0) {
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id')
          .in('id', companyIds)
          .maybeSingle();
        if (companiesError) throw companiesError;
        companyData = companies;
      }
      if (!companyData) {
        toast.error('Company profile not found. Please set up your company profile first.');
        navigate('/employer/company-details');
        return;
      }

      // Format data for submission
      const jobData = {
        company_id: selectedCompanyId,
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
        status: 'active',
        application_type: formData.applicationType,
        application_link: formData.applicationLink,
        disclaimer: formData.disclaimer,
      };

      // Insert the job
      const { data, error } = await supabase
        .from('jobs')
        .insert([jobData])
        .select();

      if (error) {
        console.error("Supabase insertion error:", error);
        throw error;
      }

      toast.success('Job posted successfully! 🎉');
      
      // Reset form and redirect
      setFormData(initialFormData);
      setStep(0);
      navigate('/employer/jobs');
      
    } catch (error: any) {
      console.error('Error posting job:', error);
      toast.error(error.message || 'Failed to post job. Please try again.');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  // Helper to dynamically load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) return resolve(true);
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Coupon validation logic (similar to Billing)
  const validateCoupon = async (amount: number) => {
    setIsValidatingCoupon(true);
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        in_code: couponCode.trim(),
        in_user_id: user?.id,
        in_product_type: 'job_post',
        in_purchase_amount: amount
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setCouponValidation(data[0] as CouponValidation);
      } else {
        setCouponValidation({ valid: false, message: 'Invalid coupon' });
      }
    } catch (e) {
      setCouponValidation({ valid: false, message: 'Failed to validate coupon' });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const getFinalPrice = (basePrice: number) => {
    if (couponValidation?.valid && couponValidation.discount_amount) {
      return Math.max(0, basePrice - couponValidation.discount_amount);
    }
    return basePrice;
  };

  // Razorpay payment handler
  const handleRazorpayPayment = async (amount: number) => {
    setIsProcessingPayment(true);
    await loadRazorpayScript();
    let accessToken = (user as any)?.access_token;
    if (!accessToken) {
      const { data: sessionData } = await supabase.auth.getSession();
      accessToken = sessionData?.session?.access_token;
    }
    let data;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/razorpay-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          description: 'Job Posting',
          user_id: user?.id,
          payment_type: 'job_posting'
        })
      });
      data = await res.json();
    } catch (e) {
      setIsProcessingPayment(false);
      toast.error('Failed to connect to payment server');
      return;
    }
    if (!data.success) {
      setIsProcessingPayment(false);
      toast.error('Failed to initiate payment');
      return;
    }
    const options = {
      key: data.key_id,
      amount: data.amount,
      currency: data.currency,
      name: 'Selectz',
      image: '/selectz.logo.png',
      description: 'Job Posting',
      order_id: data.order_id,
      handler: function (response: any) {
        setPaymentSuccess(true);
        toast.success('Payment successful!');
        handleSubmit();
      },
      prefill: {
        email: user?.email,
      },
      theme: { color: '#185a9d' },
    };
    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
    setIsProcessingPayment(false);
  };

  // Replace the last step (summary/submit) with a payment step
  const renderPaymentStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaMoneyBillWave className="text-green-600" /> Payment & Confirmation
        </h2>
        <p className="text-gray-500 mb-4">Select a plan and complete payment to post your job.</p>
      </div>
      {renderPlanSelection()}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p><span className="font-medium">Job Title:</span> {formData.jobTitle}</p>
            <p><span className="font-medium">Selected Plan:</span> {selectedPlan || 'None'}</p>
            <p><span className="font-medium">Total Cost:</span> <span className="font-bold text-green-600">₹{getFinalPrice(getSelectedPlanPrice())}</span></p>
          </div>
          <div>
            <p><span className="font-medium">Coupon Code:</span> {couponCode}</p>
            {couponValidation && (
              <p className={`font-medium ${couponValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                {couponValidation.message}
                {couponValidation.discount_amount && ` (Discount: ₹${couponValidation.discount_amount})`}
              </p>
            )}
            {isValidatingCoupon && <p className="text-gray-500">Validating coupon...</p>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <input
            type="text"
            placeholder="Enter coupon code (if any)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedPlan}
          />
          <button
            onClick={() => {
              if (couponCode.trim() && selectedPlan) {
                validateCoupon(getFinalPrice(getSelectedPlanPrice()));
              } else {
                setCouponValidation({ valid: false, message: 'Please select a plan and enter a coupon code' });
              }
            }}
            disabled={isValidatingCoupon || !couponCode.trim() || !selectedPlan}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidatingCoupon ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Apply Coupon
          </button>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleFreeOrPaidPayment(getFinalPrice(getSelectedPlanPrice()))}
            disabled={isProcessingPayment || !selectedPlan}
            className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingPayment ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Pay & Post Job
          </button>
        </div>
        {paymentSuccess && (
          <div className="mt-6 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> Payment successful! Your job is now live.</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <button onClick={() => setPaymentSuccess(false)} className="text-green-800">
                <svg className="fill-current h-6 w-6" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const handleFreeOrPaidPayment = async (amount: number) => {
    if (amount <= 0) {
      setIsProcessingPayment(true);
      let accessToken = (user as any)?.access_token;
      if (!accessToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token;
      }
      let data;
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/razorpay-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({
            amount: 0,
            currency: 'INR',
            description: 'Job Posting (Free via Coupon)',
            user_id: user?.id,
            payment_type: 'job_posting',
            is_free: true
          })
        });
        data = await res.json();
      } catch (e) {
        setIsProcessingPayment(false);
        toast.error('Failed to connect to payment server');
        return;
      }
      if (!data.success) {
        setIsProcessingPayment(false);
        toast.error('Failed to record free payment');
        return;
      }
      setPaymentSuccess(true);
      toast.success('Job posted for free!');
      handleSubmit();
      setIsProcessingPayment(false);
      return;
    }
    await handleRazorpayPayment(amount);
  };

  const getSelectedPlanPrice = () => {
    const plan = plans.find((p) => p.name === selectedPlan);
    return plan ? plan.price : 0;
  };

  const renderPlanSelection = () => (
    <div className="mb-8">
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-full bg-gray-100 p-1">
          <button className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold focus:outline-none">Per Post</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border-2 p-6 flex flex-col items-center shadow transition-all duration-200 cursor-pointer ${selectedPlan === plan.name ? 'border-green-500 bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:shadow-md'}`}
            onClick={() => setSelectedPlan(plan.name)}
          >
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="text-3xl font-extrabold text-blue-800 mb-1">
              ₹ {plan.price.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mb-2">per job post</div>
            <div className="text-green-600 text-sm mb-4">1 job post</div>
            <ul className="mb-6 space-y-2 text-gray-700 text-sm text-left">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" /> {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${selectedPlan === plan.name ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
              onClick={e => { e.stopPropagation(); setSelectedPlan(plan.name); }}
            >
              {selectedPlan === plan.name ? 'Selected' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // In the form rendering (e.g., renderStep1 or at the top of the form):
  // Add this before the rest of the form fields
  const renderCompanySelector = () => {
    if (companies.length <= 1) return null;
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><CompanyInfoIcon /> <span className="ml-2">Select Company *</span></label>
        <select
          className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400"
          value={selectedCompanyId || ''}
          onChange={e => setSelectedCompanyId(e.target.value)}
          required
        >
          <option value="">Select company</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
      </div>
    );
  };

  // Add this helper to show company selection if multiple companies
  const renderCompanySelection = () => {
    if (companies.length === 0) {
      return (
        <div className="mb-4 text-red-600 font-semibold">You must create a company profile before posting a job.</div>
      );
    }
    if (companies.length === 1) {
      // Auto-select if only one company
      if (selectedCompanyId !== companies[0].id) setSelectedCompanyId(companies[0].id);
      return null;
    }
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Company</label>
        <select
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedCompanyId || ''}
          onChange={e => setSelectedCompanyId(e.target.value)}
          required
        >
          <option value="">-- Select Company --</option>
          {companies.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    );
  };

  // Main render
  return (
    <div className="max-w-2xl mx-auto py-10">
      {/* Header with Draft Management */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Post a New Job</h1>
          <p className="text-gray-600">Create a compelling job posting to attract top talent</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDraftManager(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <FaFolderOpen />
            Drafts
          </button>
          {hasUnsavedChanges && (
            <button
              onClick={() => setShowDraftManager(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaSave />
              Save Draft
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all duration-300
              ${i < step ? 'bg-green-500 text-white border-green-500' : i === step ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-200 text-gray-400 border-gray-200'}`}
            >
              {i < step ? <FaCheckCircle /> : s.icon}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300
                ${i < step ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-2xl p-8 mb-8"
        >
          {step === 0 && (
            <>
              {renderCompanySelection()}
              {renderStep1()}
            </>
          )}
          {step === 1 && renderStep2()}
          {step === 2 && renderStep3()}
          {step === 3 && renderStep4()}
          {step === 4 && renderStep5()}
          {step === 5 && renderStep6()}
          {step === 6 && renderPaymentStep()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold flex items-center gap-2 disabled:opacity-50"
          onClick={handleBack}
          disabled={step === 0 || submitting}
        >
          <FaArrowLeft /> Back
        </button>
        {step < steps.length - 1 ? (
          <button
            className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all duration-200"
            onClick={handleNext}
            disabled={submitting}
          >
            Next <FaArrowRight />
          </button>
        ) : step === steps.length - 1 ? (
          <button
            className="px-6 py-2 rounded-full bg-green-600 text-white font-semibold flex items-center gap-2 shadow-lg hover:bg-green-700 transition-all duration-200"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Post Job
          </button>
        ) : null}
      </div>

      {/* Draft Manager Modal */}
      <DraftManager
        isOpen={showDraftManager}
        onClose={() => setShowDraftManager(false)}
        onLoadDraft={handleLoadDraft}
        currentFormData={formData}
        currentStep={step}
      />
    </div>
  );
};

export default ModernMultiStepJobForm; 
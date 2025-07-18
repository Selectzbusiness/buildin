import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight, FaArrowLeft, FaRegBuilding, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaMoneyBillWave, FaGift, FaCheckCircle, FaBook, FaUserGraduate, FaLayerGroup, FaLanguage, FaFileAlt, FaChalkboardTeacher, FaProjectDiagram, FaEnvelope, FaEye, FaEdit, FaPaperPlane, FaSpinner, FaSave, FaFolderOpen } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import InternshipDraftManager from './InternshipDraftManager';
import toast from 'react-hot-toast';
import CompanyInfoIcon from './icons/CompanyInfoIcon';

const INTERNSHIP_TYPES = ['onsite', 'remote', 'hybrid'];
const DURATIONS = ['1 month', '2 months', '3 months', '6 months', '12 months', 'Custom'];
const STIPEND_TYPES = ['Paid', 'Unpaid', 'Performance Based', 'Academic Credit'];
const STIPEND_FREQUENCIES = ['Monthly', 'Weekly', 'One Time', 'Project Based'];
const BENEFITS = [
  'Certificate', 'Letter of Recommendation', 'Flexible Hours', 'Pre-placement Offer', 'Free Snacks', 'Travel Allowance', 'Other'
];

const EDUCATION_LEVELS = ['High School', 'Undergraduate', 'Graduate', 'PhD'];
const CURRENT_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];
const ACADEMIC_BACKGROUNDS = ['Computer Science', 'Engineering', 'Business', 'Arts', 'Science', 'Other'];
const EXPERIENCE_LEVELS = ['No Experience', 'Beginner', 'Intermediate', 'Advanced'];
const SKILLS = ['Communication', 'Teamwork', 'Python', 'JavaScript', 'Excel', 'Design', 'Other'];
const LANGUAGES = ['English', 'Hindi', 'Other'];
const REQUIRED_DOCUMENTS = ['Resume', 'Cover Letter', 'Portfolio', 'Transcript', 'Other'];

interface InternshipFormData {
  // Step 1
  internshipTitle: string;
  internshipDescription: string;
  internshipType: string;
  city: string;
  area: string;
  pincode: string;
  streetAddress: string;
  duration: string;
  customDuration: string;
  startDate: string;
  flexibleStart: boolean;
  applicationDeadline: string;
  // Step 2
  stipendType: string;
  stipendAmount: string;
  stipendFrequency: string;
  academicCredit: boolean;
  academicCreditDetails: string;
  benefits: string[];
  customBenefits: string;
  travelAllowance: boolean;
  travelAllowanceAmount: string;
  // Step 3
  educationLevel: string;
  currentYear: string[];
  minimumGpa: string;
  gpaRequired: boolean;
  academicBackground: string[];
  customAcademicBackground: string;
  experienceLevel: string;
  skillsRequired: string[];
  customSkills: string;
  languages: string[];
  customLanguage: string;
  requiredDocuments: string[];
  customRequiredDocuments: string;
  // Step 4
  learningObjectives: string;
  mentorshipAvailable: boolean;
  mentorshipDetails: string;
  projectBased: boolean;
  projectDetails: string;
  applicationProcess: string;
  interviewProcess: string;
  notificationEmail: string;
  // Add to InternshipFormData
  applicationType: 'in_app' | 'external_link';
  applicationLink: string;
  disclaimer: string;
}

const initialFormData: InternshipFormData = {
  internshipTitle: '',
  internshipDescription: '',
  internshipType: '',
  city: '',
  area: '',
  pincode: '',
  streetAddress: '',
  duration: '',
  customDuration: '',
  startDate: '',
  flexibleStart: false,
  applicationDeadline: '',
  stipendType: '',
  stipendAmount: '',
  stipendFrequency: '',
  academicCredit: false,
  academicCreditDetails: '',
  benefits: [],
  customBenefits: '',
  travelAllowance: false,
  travelAllowanceAmount: '',
  educationLevel: '',
  currentYear: [],
  minimumGpa: '',
  gpaRequired: false,
  academicBackground: [],
  customAcademicBackground: '',
  experienceLevel: '',
  skillsRequired: [],
  customSkills: '',
  languages: [],
  customLanguage: '',
  requiredDocuments: [],
  customRequiredDocuments: '',
  learningObjectives: '',
  mentorshipAvailable: false,
  mentorshipDetails: '',
  projectBased: false,
  projectDetails: '',
  applicationProcess: '',
  interviewProcess: '',
  notificationEmail: '',
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

const ModernMultiStepInternshipForm: React.FC = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<InternshipFormData>(initialFormData);
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDraftManager, setShowDraftManager] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;

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
        in_product_type: 'internship_post',
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

  const getSelectedPlanPrice = () => {
    const plan = plans.find((p) => p.name === selectedPlan);
    return plan ? plan.price : 0;
  };

  // Razorpay payment handler
  const handleRazorpayPayment = async (amount: number) => {
    if (!selectedCompanyId) {
      toast.error('Please select a company before posting.');
      return;
    }
    setIsProcessingPayment(true);
    await loadRazorpayScript();
    // Get access token from supabase session if not present
    let accessToken = (user as any)?.access_token;
    if (!accessToken) {
      const { data: sessionData } = await supabase.auth.getSession();
      accessToken = sessionData?.session?.access_token;
    }
    // Call backend to create Razorpay order
    const res = await fetch(`${SUPABASE_URL}/functions/v1/razorpay-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        description: 'Internship Posting',
        user_id: user?.id,
        payment_type: 'job_posting'
      })
    });
    const data = await res.json();
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
      description: 'Internship Posting',
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

  const handleFreeOrPaidPayment = async (amount: number) => {
    if (!selectedCompanyId) {
      toast.error('Please select a company before posting.');
      return;
    }
    if (amount <= 0) {
      setIsProcessingPayment(true);
      // Call backend to record free payment
      let accessToken = (user as any)?.access_token;
      if (!accessToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token;
      }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/razorpay-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({
          amount: 0,
          currency: 'INR',
          description: 'Internship Posting (Free via Coupon)',
          user_id: user?.id,
          payment_type: 'internship_post',
          is_free: true
        })
      });
      const data = await res.json();
      if (!data.success) {
        setIsProcessingPayment(false);
        toast.error('Failed to record free payment');
        return;
      }
      setPaymentSuccess(true);
      toast.success('Internship posted for free!');
      handleSubmit();
      setIsProcessingPayment(false);
      return;
    }
    // Otherwise, proceed with Razorpay
    await handleRazorpayPayment(amount);
  };

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

  // Load draft data
  const handleLoadDraft = (draft: any) => {
    setFormData({
      internshipTitle: draft.internshipTitle || '',
      internshipDescription: draft.internshipDescription || '',
      internshipType: draft.internshipType || '',
      city: draft.city || '',
      area: draft.area || '',
      pincode: draft.pincode || '',
      streetAddress: draft.streetAddress || '',
      duration: draft.duration || '',
      customDuration: draft.customDuration || '',
      startDate: draft.startDate || '',
      flexibleStart: draft.flexibleStart || false,
      applicationDeadline: draft.applicationDeadline || '',
      stipendType: draft.stipendType || '',
      stipendAmount: draft.stipendAmount || '',
      stipendFrequency: draft.stipendFrequency || '',
      academicCredit: draft.academicCredit || false,
      academicCreditDetails: draft.academicCreditDetails || '',
      benefits: draft.benefits || [],
      customBenefits: draft.customBenefits || '',
      travelAllowance: draft.travelAllowance || false,
      travelAllowanceAmount: draft.travelAllowanceAmount || '',
      educationLevel: draft.educationLevel || '',
      currentYear: draft.currentYear || [],
      minimumGpa: draft.minimumGpa || '',
      gpaRequired: draft.gpaRequired || false,
      academicBackground: draft.academicBackground || [],
      customAcademicBackground: draft.customAcademicBackground || '',
      experienceLevel: draft.experienceLevel || '',
      skillsRequired: draft.skillsRequired || [],
      customSkills: draft.customSkills || '',
      languages: draft.languages || [],
      customLanguage: draft.customLanguage || '',
      requiredDocuments: draft.requiredDocuments || [],
      customRequiredDocuments: draft.customRequiredDocuments || '',
      learningObjectives: draft.learningObjectives || '',
      mentorshipAvailable: draft.mentorshipAvailable || false,
      mentorshipDetails: draft.mentorshipDetails || '',
      projectBased: draft.projectBased || false,
      projectDetails: draft.projectDetails || '',
      applicationProcess: draft.applicationProcess || '',
      interviewProcess: draft.interviewProcess || '',
      notificationEmail: draft.notificationEmail || '',
      applicationType: draft.applicationType || 'in_app',
      applicationLink: draft.applicationLink || '',
      disclaimer: draft.disclaimer || '',
    });
    setStep(draft.current_step || 0);
    setHasUnsavedChanges(true);
  };

  // Validation
  const validateStep1 = () => {
    const newErrors: any = {};
    if (!formData.internshipTitle.trim()) newErrors.internshipTitle = 'Title is required';
    if (!formData.internshipDescription.trim()) newErrors.internshipDescription = 'Description is required';
    if (!formData.internshipType) newErrors.internshipType = 'Type is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (formData.duration === 'Custom' && !formData.customDuration.trim()) newErrors.customDuration = 'Enter custom duration';
    if (!formData.startDate && !formData.flexibleStart) newErrors.startDate = 'Select a start date or mark as flexible';
    if (!formData.applicationDeadline) newErrors.applicationDeadline = 'Application deadline is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep2 = () => {
    const newErrors: any = {};
    if (!formData.stipendType) newErrors.stipendType = 'Stipend type is required';
    if (formData.stipendType === 'Paid' && !formData.stipendAmount) newErrors.stipendAmount = 'Enter stipend amount';
    if (formData.stipendType === 'Paid' && !formData.stipendFrequency) newErrors.stipendFrequency = 'Select stipend frequency';
    if (formData.academicCredit && !formData.academicCreditDetails.trim()) newErrors.academicCreditDetails = 'Enter academic credit details';
    if (formData.benefits.includes('Other') && !formData.customBenefits.trim()) newErrors.customBenefits = 'Enter custom benefit';
    if (formData.travelAllowance && !formData.travelAllowanceAmount) newErrors.travelAllowanceAmount = 'Enter travel allowance amount';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep3 = () => {
    const newErrors: any = {};
    if (!formData.educationLevel) newErrors.educationLevel = 'Select education level';
    if (!formData.currentYear.length) newErrors.currentYear = 'Select at least one year';
    if (formData.gpaRequired && !formData.minimumGpa) newErrors.minimumGpa = 'Enter minimum GPA';
    if (!formData.academicBackground.length) newErrors.academicBackground = 'Select at least one background';
    if (formData.academicBackground.includes('Other') && !formData.customAcademicBackground.trim()) newErrors.customAcademicBackground = 'Enter custom background';
    if (!formData.experienceLevel) newErrors.experienceLevel = 'Select experience level';
    if (!formData.skillsRequired.length) newErrors.skillsRequired = 'Select at least one skill';
    if (formData.skillsRequired.includes('Other') && !formData.customSkills.trim()) newErrors.customSkills = 'Enter custom skill';
    if (!formData.languages.length) newErrors.languages = 'Select at least one language';
    if (formData.languages.includes('Other') && !formData.customLanguage.trim()) newErrors.customLanguage = 'Enter custom language';
    if (!formData.requiredDocuments.length) newErrors.requiredDocuments = 'Select at least one document';
    if (formData.requiredDocuments.includes('Other') && !formData.customRequiredDocuments.trim()) newErrors.customRequiredDocuments = 'Enter custom document';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep4 = () => {
    const newErrors: any = {};
    // if (!formData.learningObjectives.trim()) newErrors.learningObjectives = 'Learning objectives are required';
    if (formData.mentorshipAvailable && !formData.mentorshipDetails.trim()) newErrors.mentorshipDetails = 'Enter mentorship details';
    if (formData.projectBased && !formData.projectDetails.trim()) newErrors.projectDetails = 'Enter project details';
    // if (!formData.applicationProcess.trim()) newErrors.applicationProcess = 'Application process is required';
    // if (!formData.interviewProcess.trim()) newErrors.interviewProcess = 'Interview process is required';
    if (!formData.notificationEmail.trim()) newErrors.notificationEmail = 'Notification email is required';
    if (formData.notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.notificationEmail)) newErrors.notificationEmail = 'Enter a valid email address';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
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
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };
  const handleMultiSelect = (field: keyof InternshipFormData, value: string) => {
    setFormData((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value],
      };
    });
    setErrors((prev: any) => ({ ...prev, [field]: undefined }));
  };

  // Step 1 UI
  const renderStep1 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaRegBuilding className="text-blue-600" /> Internship Details
        </h2>
        <p className="text-gray-500 mb-4">Tell us about the internship opportunity.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="internshipTitle"
            value={formData.internshipTitle}
            onChange={handleInput}
            className={`w-full px-4 py-3 rounded-xl border ${errors.internshipTitle ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="e.g. Marketing Intern"
          />
          {errors.internshipTitle && <p className="text-red-500 text-xs mt-1">{errors.internshipTitle}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            {INTERNSHIP_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, internshipType: type }))}
                className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.internshipType === type ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          {errors.internshipType && <p className="text-red-500 text-xs mt-1">{errors.internshipType}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
        <textarea
          name="internshipDescription"
          value={formData.internshipDescription}
          onChange={handleInput}
          rows={4}
          className={`w-full px-4 py-3 rounded-xl border ${errors.internshipDescription ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Describe the role, responsibilities, and what the intern will learn."
        />
        {errors.internshipDescription && <p className="text-red-500 text-xs mt-1">{errors.internshipDescription}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleInput}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="6 digit pincode"
            maxLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration <span className="text-red-500">*</span></label>
          <select
            name="duration"
            value={formData.duration}
            onChange={handleSelect}
            className={`w-full px-4 py-3 rounded-xl border ${errors.duration ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select duration</option>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {formData.duration === 'Custom' && (
            <input
              type="text"
              name="customDuration"
              value={formData.customDuration}
              onChange={handleInput}
              className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.customDuration ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter custom duration (e.g. 4.5 months)"
            />
          )}
          {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
          {errors.customDuration && <p className="text-red-500 text-xs mt-1">{errors.customDuration}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInput}
              className={`w-full px-4 py-3 rounded-xl border ${errors.startDate ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={formData.flexibleStart}
            />
            <label className="flex items-center gap-2 ml-2">
              <input
                type="checkbox"
                name="flexibleStart"
                checked={formData.flexibleStart}
                onChange={handleInput}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span>Flexible</span>
            </label>
          </div>
          {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline <span className="text-red-500">*</span></label>
        <input
          type="date"
          name="applicationDeadline"
          value={formData.applicationDeadline}
          onChange={handleInput}
          className={`w-full px-4 py-3 rounded-xl border ${errors.applicationDeadline ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        {errors.applicationDeadline && <p className="text-red-500 text-xs mt-1">{errors.applicationDeadline}</p>}
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
          <FaMoneyBillWave className="text-green-600" /> Stipend & Benefits
        </h2>
        <p className="text-gray-500 mb-4">Set stipend, benefits, and perks for the internship.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stipend Type <span className="text-red-500">*</span></label>
        <div className="flex gap-2 flex-wrap">
          {STIPEND_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, stipendType: type }))}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.stipendType === type ? 'bg-green-600 text-white border-green-600 shadow' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.stipendType && <p className="text-red-500 text-xs mt-1">{errors.stipendType}</p>}
      </div>
      {formData.stipendType === 'Paid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stipend Amount <span className="text-red-500">*</span></label>
            <input
              type="number"
              name="stipendAmount"
              value={formData.stipendAmount}
              onChange={handleInput}
              className={`w-full px-4 py-3 rounded-xl border ${errors.stipendAmount ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-green-500`}
              placeholder="e.g. 5000"
              min={0}
            />
            {errors.stipendAmount && <p className="text-red-500 text-xs mt-1">{errors.stipendAmount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stipend Frequency <span className="text-red-500">*</span></label>
            <select
              name="stipendFrequency"
              value={formData.stipendFrequency}
              onChange={handleSelect}
              className={`w-full px-4 py-3 rounded-xl border ${errors.stipendFrequency ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-green-500`}
            >
              <option value="">Select frequency</option>
              {STIPEND_FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            {errors.stipendFrequency && <p className="text-red-500 text-xs mt-1">{errors.stipendFrequency}</p>}
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <input
            type="checkbox"
            name="academicCredit"
            checked={formData.academicCredit}
            onChange={handleInput}
            className="h-4 w-4 text-green-600 border-gray-300 rounded"
          />
          Academic Credit Available
        </label>
        {formData.academicCredit && (
          <input
            type="text"
            name="academicCreditDetails"
            value={formData.academicCreditDetails}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.academicCreditDetails ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-green-500`}
            placeholder="Enter details about academic credit"
          />
        )}
        {errors.academicCreditDetails && <p className="text-red-500 text-xs mt-1">{errors.academicCreditDetails}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Benefits & Perks</label>
        <div className="flex flex-wrap gap-2">
          {BENEFITS.map((benefit) => (
            <button
              key={benefit}
              type="button"
              onClick={() => handleMultiSelect('benefits', benefit)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.benefits.includes(benefit) ? 'bg-green-600 text-white border-green-600 shadow' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}
            >
              {benefit}
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
            placeholder="Enter custom benefit"
          />
        )}
        {errors.customBenefits && <p className="text-red-500 text-xs mt-1">{errors.customBenefits}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <input
            type="checkbox"
            name="travelAllowance"
            checked={formData.travelAllowance}
            onChange={handleInput}
            className="h-4 w-4 text-green-600 border-gray-300 rounded"
          />
          Travel Allowance
        </label>
        {formData.travelAllowance && (
          <input
            type="number"
            name="travelAllowanceAmount"
            value={formData.travelAllowanceAmount}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.travelAllowanceAmount ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-green-500`}
            placeholder="Enter travel allowance amount"
            min={0}
          />
        )}
        {errors.travelAllowanceAmount && <p className="text-red-500 text-xs mt-1">{errors.travelAllowanceAmount}</p>}
      </div>
    </div>
  );

  // Step 3 UI
  const renderStep3 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaBook className="text-purple-600" /> Requirements
        </h2>
        <p className="text-gray-500 mb-4">Set eligibility and requirements for applicants.</p>
      </div>
      {/* Education Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Education Level <span className="text-red-500">*</span></label>
        <select
          name="educationLevel"
          value={formData.educationLevel}
          onChange={handleSelect}
          className={`w-full px-4 py-3 rounded-xl border ${errors.educationLevel ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
        >
          <option value="">Select education level</option>
          {EDUCATION_LEVELS.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        {errors.educationLevel && <p className="text-red-500 text-xs mt-1">{errors.educationLevel}</p>}
      </div>
      {/* Current Year */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Year <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {CURRENT_YEARS.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => handleMultiSelect('currentYear', year)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.currentYear.includes(year) ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
            >
              {year}
            </button>
          ))}
        </div>
        {errors.currentYear && <p className="text-red-500 text-xs mt-1">{errors.currentYear}</p>}
      </div>
      {/* GPA */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <input
            type="checkbox"
            name="gpaRequired"
            checked={formData.gpaRequired}
            onChange={handleInput}
            className="h-4 w-4 text-purple-600 border-gray-300 rounded"
          />
          Minimum GPA Required
        </label>
        {formData.gpaRequired && (
          <input
            type="number"
            name="minimumGpa"
            value={formData.minimumGpa}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.minimumGpa ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            placeholder="e.g. 3.0"
            min={0}
            max={4}
            step={0.01}
          />
        )}
        {errors.minimumGpa && <p className="text-red-500 text-xs mt-1">{errors.minimumGpa}</p>}
      </div>
      {/* Academic Background */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Background <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {ACADEMIC_BACKGROUNDS.map((bg) => (
            <button
              key={bg}
              type="button"
              onClick={() => handleMultiSelect('academicBackground', bg)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.academicBackground.includes(bg) ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
            >
              {bg}
            </button>
          ))}
        </div>
        {formData.academicBackground.includes('Other') && (
          <input
            type="text"
            name="customAcademicBackground"
            value={formData.customAcademicBackground}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.customAcademicBackground ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            placeholder="Enter custom background"
          />
        )}
        {errors.academicBackground && <p className="text-red-500 text-xs mt-1">{errors.academicBackground}</p>}
        {errors.customAcademicBackground && <p className="text-red-500 text-xs mt-1">{errors.customAcademicBackground}</p>}
      </div>
      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level <span className="text-red-500">*</span></label>
        <select
          name="experienceLevel"
          value={formData.experienceLevel}
          onChange={handleSelect}
          className={`w-full px-4 py-3 rounded-xl border ${errors.experienceLevel ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
        >
          <option value="">Select experience level</option>
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        {errors.experienceLevel && <p className="text-red-500 text-xs mt-1">{errors.experienceLevel}</p>}
      </div>
      {/* Skills Required */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skills Required <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => handleMultiSelect('skillsRequired', skill)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.skillsRequired.includes(skill) ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
            >
              {skill}
            </button>
          ))}
        </div>
        {formData.skillsRequired.includes('Other') && (
          <input
            type="text"
            name="customSkills"
            value={formData.customSkills}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.customSkills ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            placeholder="Enter custom skill"
          />
        )}
        {errors.skillsRequired && <p className="text-red-500 text-xs mt-1">{errors.skillsRequired}</p>}
        {errors.customSkills && <p className="text-red-500 text-xs mt-1">{errors.customSkills}</p>}
      </div>
      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Languages <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleMultiSelect('languages', lang)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.languages.includes(lang) ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
            >
              {lang}
            </button>
          ))}
        </div>
        {formData.languages.includes('Other') && (
          <input
            type="text"
            name="customLanguage"
            value={formData.customLanguage}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.customLanguage ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            placeholder="Enter custom language"
          />
        )}
        {errors.languages && <p className="text-red-500 text-xs mt-1">{errors.languages}</p>}
        {errors.customLanguage && <p className="text-red-500 text-xs mt-1">{errors.customLanguage}</p>}
      </div>
      {/* Required Documents */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Required Documents <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {REQUIRED_DOCUMENTS.map((doc) => (
            <button
              key={doc}
              type="button"
              onClick={() => handleMultiSelect('requiredDocuments', doc)}
              className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-200 ${formData.requiredDocuments.includes(doc) ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
            >
              {doc}
            </button>
          ))}
        </div>
        {formData.requiredDocuments.includes('Other') && (
          <input
            type="text"
            name="customRequiredDocuments"
            value={formData.customRequiredDocuments}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.customRequiredDocuments ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            placeholder="Enter custom document"
          />
        )}
        {errors.requiredDocuments && <p className="text-red-500 text-xs mt-1">{errors.requiredDocuments}</p>}
        {errors.customRequiredDocuments && <p className="text-red-500 text-xs mt-1">{errors.customRequiredDocuments}</p>}
      </div>
    </div>
  );

  // Step 4 UI
  const renderStep4 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaChalkboardTeacher className="text-indigo-600" /> Learning & Process
        </h2>
        <p className="text-gray-500 mb-4">Describe the learning experience and application process.</p>
      </div>
      {/* Learning Objectives */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Learning Objectives</label>
        <textarea
          name="learningObjectives"
          value={formData.learningObjectives}
          onChange={handleInput}
          rows={3}
          className={`w-full px-4 py-3 rounded-xl border ${errors.learningObjectives ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          placeholder="What will the intern learn or achieve?"
        />
        {errors.learningObjectives && <p className="text-red-500 text-xs mt-1">{errors.learningObjectives}</p>}
      </div>
      {/* Mentorship */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <input
            type="checkbox"
            name="mentorshipAvailable"
            checked={formData.mentorshipAvailable}
            onChange={handleInput}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          Mentorship/Training Available
        </label>
        {formData.mentorshipAvailable && (
          <input
            type="text"
            name="mentorshipDetails"
            value={formData.mentorshipDetails}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.mentorshipDetails ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            placeholder="Describe mentorship or training provided"
          />
        )}
        {errors.mentorshipDetails && <p className="text-red-500 text-xs mt-1">{errors.mentorshipDetails}</p>}
      </div>
      {/* Project-based */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <input
            type="checkbox"
            name="projectBased"
            checked={formData.projectBased}
            onChange={handleInput}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          Project-based Internship
        </label>
        {formData.projectBased && (
          <input
            type="text"
            name="projectDetails"
            value={formData.projectDetails}
            onChange={handleInput}
            className={`mt-2 w-full px-4 py-3 rounded-xl border ${errors.projectDetails ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            placeholder="Describe the project(s) involved"
          />
        )}
        {errors.projectDetails && <p className="text-red-500 text-xs mt-1">{errors.projectDetails}</p>}
      </div>
      {/* Application Process */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Application Process</label>
        <textarea
          name="applicationProcess"
          value={formData.applicationProcess}
          onChange={handleInput}
          rows={2}
          className={`w-full px-4 py-3 rounded-xl border ${errors.applicationProcess ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          placeholder="Describe how to apply, steps, etc."
        />
        {errors.applicationProcess && <p className="text-red-500 text-xs mt-1">{errors.applicationProcess}</p>}
      </div>
      {/* Interview Process */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Interview Process</label>
        <textarea
          name="interviewProcess"
          value={formData.interviewProcess}
          onChange={handleInput}
          rows={2}
          className={`w-full px-4 py-3 rounded-xl border ${errors.interviewProcess ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          placeholder="Describe the interview process"
        />
        {errors.interviewProcess && <p className="text-red-500 text-xs mt-1">{errors.interviewProcess}</p>}
      </div>
      {/* Notification Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notification Email <span className="text-red-500">*</span></label>
        <input
          type="email"
          name="notificationEmail"
          value={formData.notificationEmail}
          onChange={handleInput}
          className={`w-full px-4 py-3 rounded-xl border ${errors.notificationEmail ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          placeholder="email@company.com"
        />
        {errors.notificationEmail && <p className="text-red-500 text-xs mt-1">{errors.notificationEmail}</p>}
      </div>
    </div>
  );

  // Step 5 UI - Preview & Submit
  const renderStep5 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaEye className="text-indigo-600" /> Review & Submit
        </h2>
        <p className="text-gray-500 mb-4">Review all details before posting your internship.</p>
      </div>
      {/* Summary Cards for each step */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaRegBuilding className="text-blue-600" /> Internship Details
          </h3>
          <button onClick={() => setStep(0)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"><FaEdit className="text-xs" /> Edit</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Title:</span><span className="font-medium">{formData.internshipTitle}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Type:</span><span className="font-medium capitalize">{formData.internshipType}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">City:</span><span className="font-medium">{formData.city}</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Area:</span><span className="font-medium">{formData.area || 'Not specified'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Pincode:</span><span className="font-medium">{formData.pincode || 'Not specified'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Description:</span><span className="font-medium">{formData.internshipDescription.length > 50 ? `${formData.internshipDescription.substring(0, 50)}...` : formData.internshipDescription}</span></div>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 mb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaMoneyBillWave className="text-green-600" /> Stipend & Benefits
          </h3>
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium transition-colors"><FaEdit className="text-xs" /> Edit</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Stipend Type:</span><span className="font-medium">{formData.stipendType}</span></div>
            {formData.stipendType === 'Paid' && <div className="flex justify-between"><span className="text-gray-600">Stipend:</span><span className="font-medium">₹{formData.stipendAmount} / {formData.stipendFrequency}</span></div>}
            <div className="flex justify-between"><span className="text-gray-600">Academic Credit:</span><span className="font-medium">{formData.academicCredit ? 'Yes' : 'No'}</span></div>
          </div>
          <div className="space-y-2">
            {formData.benefits.length > 0 && <div className="flex justify-between"><span className="text-gray-600">Benefits:</span><span className="font-medium">{formData.benefits.join(', ')}</span></div>}
            {formData.travelAllowance && <div className="flex justify-between"><span className="text-gray-600">Travel Allowance:</span><span className="font-medium">₹{formData.travelAllowanceAmount}</span></div>}
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 mb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaBook className="text-purple-600" /> Requirements
          </h3>
          <button onClick={() => setStep(2)} className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"><FaEdit className="text-xs" /> Edit</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Education:</span><span className="font-medium">{formData.educationLevel}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Year:</span><span className="font-medium">{formData.currentYear.join(', ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">GPA:</span><span className="font-medium">{formData.gpaRequired ? formData.minimumGpa : 'Not required'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Background:</span><span className="font-medium">{formData.academicBackground.join(', ')}</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Experience:</span><span className="font-medium">{formData.experienceLevel}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Skills:</span><span className="font-medium">{formData.skillsRequired.join(', ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Languages:</span><span className="font-medium">{formData.languages.join(', ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Documents:</span><span className="font-medium">{formData.requiredDocuments.join(', ')}</span></div>
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaChalkboardTeacher className="text-indigo-600" /> Learning & Process
          </h3>
          <button onClick={() => setStep(3)} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"><FaEdit className="text-xs" /> Edit</button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Learning Objectives:</span><span className="font-medium">{formData.learningObjectives}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Mentorship:</span><span className="font-medium">{formData.mentorshipAvailable ? formData.mentorshipDetails : 'No'}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Project-based:</span><span className="font-medium">{formData.projectBased ? formData.projectDetails : 'No'}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Application Process:</span><span className="font-medium">{formData.applicationProcess}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Interview Process:</span><span className="font-medium">{formData.interviewProcess}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Notification Email:</span><span className="font-medium">{formData.notificationEmail}</span></div>
        </div>
      </div>
      {/* Final Submit Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaPaperPlane className="text-indigo-600" /> Ready to Post Your Internship?
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /><span>All required fields are completed</span></div>
          <div className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /><span>Internship will be visible to seekers immediately</span></div>
          <div className="flex items-center gap-2"><FaCheckCircle className="text-green-500" /><span>You'll receive notifications at {formData.notificationEmail}</span></div>
        </div>
        <button
          onClick={() => setStep(5)}
          className="w-full mt-6 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaArrowRight /> Next
        </button>
      </div>
    </div>
  );

  // Payment Step UI
  const renderPaymentStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaMoneyBillWave className="text-green-600" /> Payment & Confirmation
        </h2>
        <p className="text-gray-500 mb-4">Select a plan and complete payment to post your internship.</p>
      </div>
      {renderPlanSelection()}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p><span className="font-medium">Internship Title:</span> {formData.internshipTitle}</p>
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
            onClick={() => {
              if (!user?.id) {
                toast.error('Please login to post an internship');
                return;
              }
              console.log('User object at payment:', user);
              handleFreeOrPaidPayment(getFinalPrice(getSelectedPlanPrice()));
            }}
            disabled={isProcessingPayment || !selectedPlan || !user?.id}
            className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingPayment ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Pay & Post Internship
          </button>
        </div>
        {paymentSuccess && (
          <div className="mt-6 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> Payment successful! Your internship is now live.</span>
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

  // Submit handler
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (!user?.id) {
        toast.error('Please login to post an internship');
        return;
      }
      if (!selectedCompanyId) {
        toast.error('Please select a company before posting.');
        setSubmitting(false);
        return;
      }

      // Format data for submission
      const cleanedPincode = formData.pincode && /^[0-9]{6}$/.test(formData.pincode) ? formData.pincode : null;
      const internshipData = {
        company_id: selectedCompanyId,
        title: formData.internshipTitle.trim(),
        description: formData.internshipDescription.trim(),
        type: formData.internshipType,
        location: {
          city: formData.city,
          area: formData.area,
          pincode: cleanedPincode,
          street_address: formData.streetAddress
        },
        duration: formData.duration === 'Custom' ? formData.customDuration : formData.duration,
        stipend: {
          type: formData.stipendType,
          amount: parseFloat(formData.stipendAmount) || 0,
          frequency: formData.stipendFrequency
        },
        requirements: [
          ...formData.academicBackground,
          ...formData.requiredDocuments,
          formData.customAcademicBackground,
          formData.customRequiredDocuments
        ].filter(Boolean),
        skills: [
          ...formData.skillsRequired,
          formData.customSkills
        ].filter(Boolean),
        responsibilities: [
          formData.learningObjectives,
          formData.projectDetails
        ].filter(Boolean),
        perks: [
          ...formData.benefits,
          formData.customBenefits,
          formData.travelAllowance ? `Travel Allowance: ${formData.travelAllowanceAmount}` : null,
          formData.academicCredit ? `Academic Credit: ${formData.academicCreditDetails}` : null,
          formData.mentorshipAvailable ? `Mentorship: ${formData.mentorshipDetails}` : null
        ].filter(Boolean),
        application_deadline: new Date(formData.applicationDeadline).toISOString(),
        start_date: formData.flexibleStart ? null : new Date(formData.startDate).toISOString(),
        status: 'active',
        application_type: formData.applicationType,
        application_link: formData.applicationLink,
        disclaimer: formData.disclaimer,
      };

      // Insert the internship
      const { data, error } = await supabase
        .from('internships')
        .insert([internshipData])
        .select();

      if (error) {
        console.error("Supabase insertion error:", error);
        throw error;
      }

      toast.success('Internship posted successfully! 🎉');
      
      // Reset form and redirect
      setFormData(initialFormData);
      setStep(0);
      navigate('/employer/internships');
      
    } catch (error: any) {
      console.error('Error posting internship:', error);
      toast.error(error.message || 'Failed to post internship. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
      toast.error('Please complete payment before posting the internship.');
      return;
    }
    setStep((prev) => prev + 1);
  };
  const handleBack = () => setStep((prev) => prev - 1);

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

  // Company selector for multi-company support
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
        <div className="mb-4 text-red-600 font-semibold">You must create a company profile before posting an internship.</div>
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Post a New Internship</h1>
          <p className="text-gray-600">Create a compelling internship posting to attract top talent</p>
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
        {[0, 1, 2, 3, 4].map((s, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all duration-300
              ${i < step ? 'bg-green-500 text-white border-green-500' : i === step ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-200 text-gray-400 border-gray-200'}`}
            >
              {i < step ? <FaCheckCircle /> : i === 0 ? <FaRegBuilding /> : i === 1 ? <FaMoneyBillWave /> : i === 2 ? <FaBook /> : i === 3 ? <FaChalkboardTeacher /> : <FaPaperPlane />}
            </div>
            {i < 4 && (
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
          {step === 0 && renderCompanySelection()}
          {step === 0 && renderStep1()}
          {step === 1 && renderStep2()}
          {step === 2 && renderStep3()}
          {step === 3 && renderStep4()}
          {step === 4 && renderStep5()}
          {step === 5 && renderPaymentStep()}
        </motion.div>
      </AnimatePresence>
      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold flex items-center gap-2 disabled:opacity-50"
          onClick={handleBack}
          disabled={step === 0}
        >
          <FaArrowLeft /> Back
        </button>
        {step < 5 ? (
          <button
            className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all duration-200"
            onClick={handleNext}
          >
            Next <FaArrowRight />
          </button>
        ) : (
          <button
            className="px-6 py-2 rounded-full bg-green-600 text-white font-semibold flex items-center gap-2 shadow-lg hover:bg-green-700 transition-all duration-200"
            onClick={handleNext}
            disabled={submitting}
          >
            {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Submit
          </button>
        )}
      </div>
      {/* Draft Manager Modal */}
      <InternshipDraftManager
        isOpen={showDraftManager}
        onClose={() => setShowDraftManager(false)}
        onLoadDraft={handleLoadDraft}
        currentFormData={formData}
        currentStep={step}
      />
    </div>
  );
};

export default ModernMultiStepInternshipForm; 
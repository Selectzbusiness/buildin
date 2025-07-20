import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight, FaArrowLeft, FaRegBuilding, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaMoneyBillWave, FaGift, FaCheckCircle, FaBook, FaUserGraduate, FaLayerGroup, FaLanguage, FaFileAlt, FaChalkboardTeacher, FaProjectDiagram, FaEnvelope, FaEye, FaEdit, FaPaperPlane, FaSpinner, FaSave } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { AuthContext } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface InternshipFormData {
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
  stipendType: string;
  stipendAmount: string;
  stipendFrequency: string;
  academicCredit: boolean;
  academicCreditDetails: string;
  benefits: string[];
  customBenefits: string;
  travelAllowance: boolean;
  travelAllowanceAmount: string;
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
  learningObjectives: string;
  mentorshipAvailable: boolean;
  mentorshipDetails: string;
  projectBased: boolean;
  projectDetails: string;
  applicationProcess: string;
  interviewProcess: string;
  notificationEmail: string;
  applicationType: 'in_app' | 'external_link';
  applicationLink: string;
  disclaimer: string;
}

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

const steps = [
  { label: 'Internship Details', icon: <FaRegBuilding /> },
  { label: 'Duration & Schedule', icon: <FaCalendarAlt /> },
  { label: 'Compensation & Benefits', icon: <FaMoneyBillWave /> },
  { label: 'Requirements', icon: <FaUserGraduate /> },
  { label: 'Learning & Development', icon: <FaBook /> },
  { label: 'Summary', icon: <FaEye /> },
];

const EditInternshipForm: React.FC = () => {
  const { internshipId } = useParams<{ internshipId: string }>();
  const { user, profile } = useContext(AuthContext);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<InternshipFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load internship data on component mount
  useEffect(() => {
    if (internshipId) {
      loadInternshipData();
    }
  }, [internshipId]);

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

  const loadInternshipData = async () => {
    if (!internshipId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('internships')
        .select('*')
        .eq('id', internshipId)
        .single();

      if (error) throw error;

      if (data) {
        // Transform database data to form data
        const transformedData: InternshipFormData = {
          internshipTitle: data.title || '',
          internshipDescription: data.description || '',
          internshipType: data.type || '',
          city: data.location?.city || '',
          area: data.location?.area || '',
          pincode: data.location?.pincode || '',
          streetAddress: data.location?.street_address || '',
          duration: data.duration || '',
          customDuration: '',
          startDate: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
          flexibleStart: !data.start_date,
          applicationDeadline: data.application_deadline ? new Date(data.application_deadline).toISOString().split('T')[0] : '',
          stipendType: data.stipend?.type || '',
          stipendAmount: data.stipend?.amount?.toString() || '',
          stipendFrequency: data.stipend?.frequency || '',
          academicCredit: false,
          academicCreditDetails: '',
          benefits: data.perks || [],
          customBenefits: '',
          travelAllowance: false,
          travelAllowanceAmount: '',
          educationLevel: '',
          currentYear: [],
          minimumGpa: '',
          gpaRequired: false,
          academicBackground: data.requirements || [],
          customAcademicBackground: '',
          experienceLevel: '',
          skillsRequired: data.skills || [],
          customSkills: '',
          languages: [],
          customLanguage: '',
          requiredDocuments: [],
          customRequiredDocuments: '',
          learningObjectives: data.responsibilities?.[0] || '',
          mentorshipAvailable: false,
          mentorshipDetails: '',
          projectBased: false,
          projectDetails: data.responsibilities?.[1] || '',
          applicationProcess: '',
          interviewProcess: '',
          notificationEmail: '',
          applicationType: data.application_type || 'in_app',
          applicationLink: data.application_link || '',
          disclaimer: data.disclaimer || '',
        };

        setFormData(transformedData);
        setSelectedCompanyId(data.company_id);
      }
    } catch (err: any) {
      console.error('Error loading internship data:', err);
      setError('Failed to load internship data. Please try again.');
      toast.error('Failed to load internship data');
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    const newErrors: any = {};
    if (!formData.internshipTitle.trim()) newErrors.internshipTitle = 'Internship title is required';
    if (!formData.internshipDescription.trim()) newErrors.internshipDescription = 'Description is required';
    if (!formData.internshipType) newErrors.internshipType = 'Internship type is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) newErrors.pincode = 'Pincode must be 6 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.applicationDeadline) newErrors.applicationDeadline = 'Application deadline is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: any = {};
    if (!formData.stipendType) newErrors.stipendType = 'Stipend type is required';
    if (formData.stipendType === 'Paid' && !formData.stipendAmount) {
      newErrors.stipendAmount = 'Stipend amount is required for paid internships';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: any = {};
    if (formData.academicBackground.length === 0) newErrors.academicBackground = 'At least one academic background is required';
    if (formData.skillsRequired.length === 0) newErrors.skillsRequired = 'At least one skill is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = () => {
    const newErrors: any = {};
    if (!formData.learningObjectives.trim()) newErrors.learningObjectives = 'Learning objectives are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    if (!internshipId) {
      toast.error('Internship ID not found');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      if (!user?.id) {
        toast.error('Please login to edit an internship');
        return;
      }

      // Format data for submission
      const cleanedPincode = formData.pincode && /^[0-9]{6}$/.test(formData.pincode) ? formData.pincode : null;
      const internshipData = {
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
        application_type: formData.applicationType,
        application_link: formData.applicationLink,
        disclaimer: formData.disclaimer,
        updated_at: new Date().toISOString(),
      };

      // Update the internship
      const { error } = await supabase
        .from('internships')
        .update(internshipData)
        .eq('id', internshipId);

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      toast.success('Internship updated successfully! 🎉');
      navigate('/employer/internships');
      
    } catch (error: any) {
      console.error('Error updating internship:', error);
      toast.error(error.message || 'Failed to update internship. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof InternshipFormData, value: any) => {
    setFormData((prev: InternshipFormData) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleArrayChange = (field: keyof InternshipFormData, value: string, checked: boolean) => {
    setFormData((prev: InternshipFormData) => {
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
          <p className="text-gray-600">Loading internship data...</p>
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
            onClick={() => navigate('/employer/internships')}
            className="px-6 py-3 bg-[#185a9d] text-white rounded-xl hover:bg-[#43cea2] transition-colors"
          >
            Back to Internships
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb]">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#185a9d] mb-2">Edit Internship</h1>
          <p className="text-gray-600">Update your internship posting details</p>
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
              {/* Step 1: Internship Details */}
              {step === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Internship Details</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Internship Title *</label>
                    <input
                      type="text"
                      value={formData.internshipTitle}
                      onChange={(e) => handleInputChange('internshipTitle', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                        errors.internshipTitle ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Software Development Intern"
                    />
                    {errors.internshipTitle && <p className="text-red-500 text-sm mt-1">{errors.internshipTitle}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Internship Description *</label>
                    <textarea
                      value={formData.internshipDescription}
                      onChange={(e) => handleInputChange('internshipDescription', e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                        errors.internshipDescription ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Describe the internship role and responsibilities..."
                    />
                    {errors.internshipDescription && <p className="text-red-500 text-sm mt-1">{errors.internshipDescription}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Internship Type *</label>
                      <select
                        value={formData.internshipType}
                        onChange={(e) => handleInputChange('internshipType', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.internshipType ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select type</option>
                        {INTERNSHIP_TYPES.map(type => (
                          <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                      </select>
                      {errors.internshipType && <p className="text-red-500 text-sm mt-1">{errors.internshipType}</p>}
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

              {/* Step 2: Duration & Schedule */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Duration & Schedule</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                      <select
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.duration ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select duration</option>
                        {DURATIONS.map(duration => (
                          <option key={duration} value={duration}>{duration}</option>
                        ))}
                      </select>
                      {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline *</label>
                      <input
                        type="date"
                        value={formData.applicationDeadline}
                        onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.applicationDeadline ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.applicationDeadline && <p className="text-red-500 text-sm mt-1">{errors.applicationDeadline}</p>}
                    </div>
                  </div>

                  {formData.duration === 'Custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Duration</label>
                      <input
                        type="text"
                        value={formData.customDuration}
                        onChange={(e) => handleInputChange('customDuration', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                        placeholder="e.g., 4 months, 6 weeks"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        disabled={formData.flexibleStart}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="flexibleStart"
                        checked={formData.flexibleStart}
                        onChange={(e) => handleInputChange('flexibleStart', e.target.checked)}
                        className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                      />
                      <label htmlFor="flexibleStart" className="ml-2 text-sm text-gray-700">
                        Flexible start date
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Compensation & Benefits */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Compensation & Benefits</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stipend Type *</label>
                      <select
                        value={formData.stipendType}
                        onChange={(e) => handleInputChange('stipendType', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.stipendType ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select type</option>
                        {STIPEND_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {errors.stipendType && <p className="text-red-500 text-sm mt-1">{errors.stipendType}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stipend Amount</label>
                      <input
                        type="number"
                        value={formData.stipendAmount}
                        onChange={(e) => handleInputChange('stipendAmount', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                          errors.stipendAmount ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., 15000"
                      />
                      {errors.stipendAmount && <p className="text-red-500 text-sm mt-1">{errors.stipendAmount}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                      <select
                        value={formData.stipendFrequency}
                        onChange={(e) => handleInputChange('stipendFrequency', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      >
                        <option value="">Select frequency</option>
                        {STIPEND_FREQUENCIES.map(freq => (
                          <option key={freq} value={freq}>{freq}</option>
                        ))}
                      </select>
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Academic Background *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {ACADEMIC_BACKGROUNDS.map(background => (
                        <label key={background} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.academicBackground.includes(background)}
                            onChange={(e) => handleArrayChange('academicBackground', background, e.target.checked)}
                            className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                          />
                          <span className="ml-2 text-sm text-gray-700">{background}</span>
                        </label>
                      ))}
                    </div>
                    {errors.academicBackground && <p className="text-red-500 text-sm mt-1">{errors.academicBackground}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Academic Background</label>
                    <input
                      type="text"
                      value={formData.customAcademicBackground}
                      onChange={(e) => handleInputChange('customAcademicBackground', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      placeholder="e.g., Data Science, Marketing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SKILLS.map(skill => (
                        <label key={skill} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.skillsRequired.includes(skill)}
                            onChange={(e) => handleArrayChange('skillsRequired', skill, e.target.checked)}
                            className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                          />
                          <span className="ml-2 text-sm text-gray-700">{skill}</span>
                        </label>
                      ))}
                    </div>
                    {errors.skillsRequired && <p className="text-red-500 text-sm mt-1">{errors.skillsRequired}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Skills</label>
                    <input
                      type="text"
                      value={formData.customSkills}
                      onChange={(e) => handleInputChange('customSkills', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      placeholder="e.g., React, Python, Machine Learning"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Documents</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {REQUIRED_DOCUMENTS.map(doc => (
                        <label key={doc} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.requiredDocuments.includes(doc)}
                            onChange={(e) => handleArrayChange('requiredDocuments', doc, e.target.checked)}
                            className="w-4 h-4 text-[#185a9d] border-gray-300 rounded focus:ring-[#185a9d]"
                          />
                          <span className="ml-2 text-sm text-gray-700">{doc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Learning & Development */}
              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Learning & Development</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives *</label>
                    <textarea
                      value={formData.learningObjectives}
                      onChange={(e) => handleInputChange('learningObjectives', e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#185a9d] focus:border-transparent ${
                        errors.learningObjectives ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="What will the intern learn during this internship?"
                    />
                    {errors.learningObjectives && <p className="text-red-500 text-sm mt-1">{errors.learningObjectives}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Process</label>
                    <textarea
                      value={formData.applicationProcess}
                      onChange={(e) => handleInputChange('applicationProcess', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      placeholder="Describe the application process..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interview Process</label>
                      <textarea
                        value={formData.interviewProcess}
                        onChange={(e) => handleInputChange('interviewProcess', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                        placeholder="Describe the interview process..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notification Email</label>
                      <input
                        type="email"
                        value={formData.notificationEmail}
                        onChange={(e) => handleInputChange('notificationEmail', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                        placeholder="email@company.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Summary */}
              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Summary</h2>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Internship Details</h3>
                      <p className="text-gray-600">{formData.internshipTitle}</p>
                      <p className="text-gray-600">{formData.internshipDescription}</p>
                      <p className="text-gray-600">Type: {formData.internshipType}</p>
                      <p className="text-gray-600">Location: {formData.city}, {formData.area}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">Duration & Schedule</h3>
                      <p className="text-gray-600">Duration: {formData.duration}</p>
                      <p className="text-gray-600">Application Deadline: {formData.applicationDeadline}</p>
                      <p className="text-gray-600">Start Date: {formData.flexibleStart ? 'Flexible' : formData.startDate}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">Compensation</h3>
                      <p className="text-gray-600">Stipend Type: {formData.stipendType}</p>
                      <p className="text-gray-600">Amount: {formData.stipendAmount}</p>
                      <p className="text-gray-600">Frequency: {formData.stipendFrequency}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">Requirements</h3>
                      <p className="text-gray-600">Academic Background: {formData.academicBackground.join(', ')}</p>
                      <p className="text-gray-600">Skills: {formData.skillsRequired.join(', ')}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">Learning Objectives</h3>
                      <p className="text-gray-600">{formData.learningObjectives}</p>
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
                        Update Internship
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

export default EditInternshipForm; 
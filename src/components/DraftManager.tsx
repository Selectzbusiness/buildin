import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSave, FaFolderOpen, FaTrash, FaClock, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import { supabase } from '../config/supabase';

interface Draft {
  id: string;
  draft_name: string;
  current_step: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
  // All the form data fields
  job_title?: string;
  job_title_description?: string;
  job_type?: string;
  city?: string;
  area?: string;
  pincode?: string;
  street_address?: string;
  employment_types?: string[];
  schedules?: string[];
  custom_schedule?: string;
  has_planned_start_date?: boolean;
  planned_start_date?: string;
  number_of_hires?: string;
  custom_number_of_hires?: string;
  recruitment_timeline?: string;
  pay_type?: string;
  min_pay?: string;
  max_pay?: string;
  pay_rate?: string;
  supplemental_pay?: string[];
  custom_supplemental_pay?: string;
  benefits?: string[];
  custom_benefits?: string;
  education?: string;
  language?: string[];
  custom_language?: string;
  experience?: string;
  industries?: string[];
  custom_industry?: string;
  age?: string;
  gender?: string;
  skills?: string[];
  custom_skills?: string;
  job_profile_description?: string;
  notification_emails?: string;
  application_deadline?: string;
  disclaimer?: string;
  application_type?: 'in_app' | 'external_link';
  application_link?: string;
}

interface DraftManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: Draft) => void;
  currentFormData: any;
  currentStep: number;
}

function cleanNumericFields(draft: any) {
  const numericFields = [
    'min_pay',
    'max_pay',
    'openings',
    'applicants',
    'max_age',
    'min_age',
    'number_of_hires',
    'minimum_experience',
    // add any other numeric fields used in job_drafts
  ];
  const cleaned = { ...draft };
  for (const field of numericFields) {
    if (cleaned[field] === "") cleaned[field] = null;
  }
  return cleaned;
}

const DraftManager: React.FC<DraftManagerProps> = ({
  isOpen,
  onClose,
  onLoadDraft,
  currentFormData,
  currentStep
}) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);

  // Load drafts on component mount
  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_drafts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async (name: string) => {
    setSaving(true);
    try {
      // Check if form has any data
      const hasData = Object.values(currentFormData).some(value => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'boolean') return value;
        return value !== null && value !== undefined;
      });

      if (!hasData) {
        alert('No data to save. Please fill in at least one field.');
        return;
      }

      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        alert('You must be logged in to save drafts.');
        setSaving(false);
        return;
      }

      const draftToSave = {
        draft_name: name,
        current_step: currentStep,
        is_complete: false,
        user_id: userId,
        job_title: currentFormData.jobTitle,
        job_title_description: currentFormData.jobTitleDescription,
        job_type: currentFormData.jobType,
        city: currentFormData.city,
        area: currentFormData.area,
        pincode: currentFormData.pincode,
        street_address: currentFormData.streetAddress,
        employment_types: currentFormData.employmentTypes,
        schedules: currentFormData.schedules,
        custom_schedule: currentFormData.customSchedule,
        has_planned_start_date: currentFormData.hasPlannedStartDate,
        planned_start_date: currentFormData.plannedStartDate === '' ? null : currentFormData.plannedStartDate,
        number_of_hires: currentFormData.numberOfHires,
        custom_number_of_hires: currentFormData.customNumberOfHires,
        recruitment_timeline: currentFormData.recruitmentTimeline,
        pay_type: currentFormData.payType,
        min_pay: currentFormData.minPay,
        max_pay: currentFormData.maxPay,
        pay_rate: currentFormData.payRate,
        supplemental_pay: currentFormData.supplementalPay,
        custom_supplemental_pay: currentFormData.customSupplementalPay,
        benefits: currentFormData.benefits,
        custom_benefits: currentFormData.customBenefits,
        education: currentFormData.education,
        language: currentFormData.language,
        custom_language: currentFormData.customLanguage,
        experience: currentFormData.experience,
        industries: currentFormData.industries,
        custom_industry: currentFormData.customIndustry,
        age: currentFormData.age,
        gender: currentFormData.gender,
        skills: currentFormData.skills,
        custom_skills: currentFormData.customSkills,
        job_profile_description: currentFormData.jobProfileDescription,
        notification_emails: currentFormData.notificationEmails,
        application_deadline: currentFormData.applicationDeadline === '' ? null : currentFormData.applicationDeadline,
        disclaimer: currentFormData.disclaimer,
        application_type: currentFormData.applicationType,
        application_link: currentFormData.applicationLink,
      };
      const cleanedDraft = cleanNumericFields(draftToSave);
      const { data, error } = await supabase
        .from('job_drafts')
        .insert(cleanedDraft)
        .select()
        .single();

      if (error) throw error;
      
      setDrafts(prev => [data, ...prev]);
      setShowSaveModal(false);
      setDraftName('');
      alert('Draft saved successfully!');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      if (error.message.includes('Maximum 5 drafts')) {
        alert('Maximum 5 drafts allowed. Please delete an existing draft first.');
      } else {
        alert('Error saving draft. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      const { error } = await supabase
        .from('job_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
      alert('Draft deleted successfully!');
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Error deleting draft. Please try again.');
    }
  };

  const loadDraft = (draft: Draft) => {
    // Transform database fields back to form data format
    const formData = {
      jobTitle: draft.job_title || '',
      jobTitleDescription: draft.job_title_description || '',
      jobType: draft.job_type || 'onsite',
      city: draft.city || '',
      area: draft.area || '',
      pincode: draft.pincode || '',
      streetAddress: draft.street_address || '',
      employmentTypes: draft.employment_types || [],
      schedules: draft.schedules || [],
      customSchedule: draft.custom_schedule || '',
      hasPlannedStartDate: draft.has_planned_start_date || false,
      plannedStartDate: draft.planned_start_date || '',
      numberOfHires: draft.number_of_hires || '1',
      customNumberOfHires: draft.custom_number_of_hires || '',
      recruitmentTimeline: draft.recruitment_timeline || '',
      payType: draft.pay_type || '',
      minPay: draft.min_pay || '',
      maxPay: draft.max_pay || '',
      payRate: draft.pay_rate || '',
      supplementalPay: draft.supplemental_pay || [],
      customSupplementalPay: draft.custom_supplemental_pay || '',
      benefits: draft.benefits || [],
      customBenefits: draft.custom_benefits || '',
      education: draft.education || '',
      language: draft.language || [],
      customLanguage: draft.custom_language || '',
      experience: draft.experience || '',
      industries: draft.industries || [],
      customIndustry: draft.custom_industry || '',
      age: draft.age || '',
      gender: draft.gender || '',
      skills: draft.skills || [],
      customSkills: draft.custom_skills || '',
      jobProfileDescription: draft.job_profile_description || '',
      notificationEmails: draft.notification_emails || '',
      applicationDeadline: draft.application_deadline || '',
      disclaimer: draft.disclaimer || '',
      applicationType: draft.application_type || 'in_app',
      applicationLink: draft.application_link || '',
    };

    onLoadDraft({ ...draft, ...formData });
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaFolderOpen className="text-blue-600" />
            Manage Drafts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Save Draft Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Save Current Progress</h3>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaSave />
                Save Draft
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              Save your current progress to continue later. Drafts are automatically deleted after 7 days.
            </p>
          </div>

          {/* Drafts List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Drafts ({drafts.length}/5)</h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaFolderOpen className="mx-auto text-4xl mb-4 text-gray-300" />
                <p>No drafts found. Save your progress to create your first draft.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft) => {
                  const daysUntilExpiry = getDaysUntilExpiry(draft.expires_at);
                  return (
                    <motion.div
                      key={draft.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-800">{draft.draft_name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              draft.is_complete 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {draft.is_complete ? 'Complete' : `Step ${draft.current_step + 1}`}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Job Title:</span>
                              <p className="truncate">{draft.job_title || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="font-medium">Location:</span>
                              <p className="truncate">{draft.city || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="font-medium">Last Updated:</span>
                              <p>{formatDate(draft.updated_at)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <FaClock />
                              <span>
                                {daysUntilExpiry > 0 
                                  ? `Expires in ${daysUntilExpiry} days` 
                                  : 'Expires today'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => loadDraft(draft)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                          >
                            <FaEdit />
                            Load
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
                          >
                            <FaTrash />
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Save Draft Modal */}
        <AnimatePresence>
          {showSaveModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              >
                <h3 className="text-lg font-semibold mb-4">Save Draft</h3>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Enter draft name (e.g., 'Software Engineer Position')"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  maxLength={100}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSaveModal(false);
                      setDraftName('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveDraft(draftName)}
                    disabled={!draftName.trim() || saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DraftManager; 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSave, FaFolderOpen, FaTrash, FaClock, FaEdit, FaTimes } from 'react-icons/fa';
import { supabase } from '../config/supabase';

interface InternshipDraft {
  id: string;
  draft_name: string;
  current_step: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
  // All the form data fields
  internship_title?: string;
  internship_description?: string;
  internship_type?: string;
  city?: string;
  area?: string;
  pincode?: string;
  street_address?: string;
  duration?: string;
  custom_duration?: string;
  start_date?: string;
  flexible_start?: boolean;
  application_deadline?: string;
  stipend_type?: string;
  stipend_amount?: string;
  stipend_frequency?: string;
  academic_credit?: boolean;
  academic_credit_details?: string;
  benefits?: string[];
  custom_benefits?: string;
  travel_allowance?: boolean;
  travel_allowance_amount?: string;
  education_level?: string;
  current_year?: string[];
  minimum_gpa?: string;
  gpa_required?: boolean;
  academic_background?: string[];
  custom_academic_background?: string;
  experience_level?: string;
  skills_required?: string[];
  custom_skills?: string;
  languages?: string[];
  custom_language?: string;
  required_documents?: string[];
  custom_required_documents?: string;
  learning_objectives?: string;
  mentorship_available?: boolean;
  mentorship_details?: string;
  project_based?: boolean;
  project_details?: string;
  application_process?: string;
  interview_process?: string;
  notification_email?: string;
  disclaimer?: string;
}

interface InternshipDraftManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: InternshipDraft) => void;
  currentFormData: any;
  currentStep: number;
}

function cleanNumericFields(draft: any) {
  // Map camelCase form keys to DB snake_case keys for numeric fields
  const mapping = {
    stipendAmount: 'stipend_amount',
    travelAllowanceAmount: 'travel_allowance_amount',
    minimumGpa: 'minimum_gpa',
    hoursPerWeek: 'hours_per_week',
    // add any other numeric fields here
  };
  const cleaned = { ...draft };
  for (const [formKey, dbKey] of Object.entries(mapping)) {
    if (cleaned[formKey] === "") cleaned[formKey] = null;
    if (cleaned[dbKey] === "") cleaned[dbKey] = null;
  }
  // Clean pincode: must be 6 digits or null
  if (!cleaned.pincode || typeof cleaned.pincode !== 'string' || !/^[0-9]{6}$/.test(cleaned.pincode)) {
    cleaned.pincode = null;
  }
  // Clean enum/check fields for allowed values
  const allowedInternshipTypes = ['onsite', 'remote', 'hybrid'];
  if (!allowedInternshipTypes.includes(cleaned.internshipType)) cleaned.internshipType = null;
  if (!allowedInternshipTypes.includes(cleaned.internship_type)) cleaned.internship_type = null;
  const allowedStipendTypes = ['paid', 'unpaid', 'performance_based', 'academic_credit'];
  if (!allowedStipendTypes.includes(cleaned.stipendType)) cleaned.stipendType = null;
  if (!allowedStipendTypes.includes(cleaned.stipend_type)) cleaned.stipend_type = null;
  const allowedStipendFrequencies = ['monthly', 'weekly', 'one_time', 'project_based'];
  if (!allowedStipendFrequencies.includes(cleaned.stipendFrequency)) cleaned.stipendFrequency = null;
  if (!allowedStipendFrequencies.includes(cleaned.stipend_frequency)) cleaned.stipend_frequency = null;
  const allowedExperienceLevels = ['no_experience', 'beginner', 'intermediate', 'advanced'];
  if (!allowedExperienceLevels.includes(cleaned.experienceLevel)) cleaned.experienceLevel = null;
  if (!allowedExperienceLevels.includes(cleaned.experience_level)) cleaned.experience_level = null;
  return cleaned;
}

const InternshipDraftManager: React.FC<InternshipDraftManagerProps> = ({
  isOpen,
  onClose,
  onLoadDraft,
  currentFormData,
  currentStep
}) => {
  const [drafts, setDrafts] = useState<InternshipDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (isOpen) loadDrafts();
  }, [isOpen]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('internship_drafts')
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
      // Build a draft object with both camelCase and snake_case keys
      const draftObj = {
        ...currentFormData,
        stipend_amount: currentFormData.stipendAmount,
        travel_allowance_amount: currentFormData.travelAllowanceAmount,
        minimum_gpa: currentFormData.minimumGpa,
        hours_per_week: currentFormData.hoursPerWeek,
        // add any other numeric fields here
      };
      const cleanedDraft = cleanNumericFields(draftObj);
      const { data, error } = await supabase
        .from('internship_drafts')
        .insert({
          user_id: userId,
          draft_name: name,
          current_step: currentStep,
          is_complete: false,
          internship_title: cleanedDraft.internshipTitle,
          internship_description: cleanedDraft.internshipDescription,
          internship_type: cleanedDraft.internshipType,
          city: cleanedDraft.city,
          area: cleanedDraft.area,
          pincode: cleanedDraft.pincode,
          street_address: cleanedDraft.streetAddress,
          duration: cleanedDraft.duration,
          custom_duration: cleanedDraft.customDuration,
          start_date: cleanedDraft.startDate,
          flexible_start: cleanedDraft.flexibleStart,
          application_deadline: cleanedDraft.applicationDeadline,
          stipend_type: cleanedDraft.stipendType,
          stipend_amount: cleanedDraft.stipend_amount,
          stipend_frequency: cleanedDraft.stipendFrequency,
          academic_credit: cleanedDraft.academicCredit,
          academic_credit_details: cleanedDraft.academicCreditDetails,
          benefits: cleanedDraft.benefits,
          custom_benefits: cleanedDraft.customBenefits,
          travel_allowance: cleanedDraft.travelAllowance,
          travel_allowance_amount: cleanedDraft.travel_allowance_amount,
          education_level: cleanedDraft.educationLevel,
          current_year: cleanedDraft.currentYear,
          minimum_gpa: cleanedDraft.minimum_gpa,
          gpa_required: cleanedDraft.gpaRequired,
          academic_background: cleanedDraft.academicBackground,
          custom_academic_background: cleanedDraft.customAcademicBackground,
          experience_level: cleanedDraft.experienceLevel,
          skills_required: cleanedDraft.skillsRequired,
          custom_skills: cleanedDraft.customSkills,
          languages: cleanedDraft.languages,
          custom_language: cleanedDraft.customLanguage,
          required_documents: cleanedDraft.requiredDocuments,
          custom_required_documents: cleanedDraft.customRequiredDocuments,
          learning_objectives: cleanedDraft.learningObjectives,
          mentorship_available: cleanedDraft.mentorshipAvailable,
          mentorship_details: cleanedDraft.mentorshipDetails,
          project_based: cleanedDraft.projectBased,
          project_details: cleanedDraft.projectDetails,
          application_process: cleanedDraft.applicationProcess,
          interview_process: cleanedDraft.interviewProcess,
          notification_email: cleanedDraft.notificationEmail,
          hours_per_week: cleanedDraft.hours_per_week,
        })
        .select()
        .single();
      if (error) throw error;
      setDrafts(prev => [data, ...prev]);
      setShowSaveModal(false);
      setDraftName('');
      alert('Draft saved successfully!');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      if (error.message.includes('Maximum 5 internship drafts')) {
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
        .from('internship_drafts')
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

  const loadDraft = (draft: InternshipDraft) => {
    // Transform database fields back to form data format
    const formData = {
      internshipTitle: draft.internship_title || '',
      internshipDescription: draft.internship_description || '',
      internshipType: draft.internship_type || '',
      city: draft.city || '',
      area: draft.area || '',
      pincode: draft.pincode || '',
      streetAddress: draft.street_address || '',
      duration: draft.duration || '',
      customDuration: draft.custom_duration || '',
      startDate: draft.start_date || '',
      flexibleStart: draft.flexible_start || false,
      applicationDeadline: draft.application_deadline || '',
      stipendType: draft.stipend_type || '',
      stipendAmount: draft.stipend_amount || '',
      stipendFrequency: draft.stipend_frequency || '',
      academicCredit: draft.academic_credit || false,
      academicCreditDetails: draft.academic_credit_details || '',
      benefits: draft.benefits || [],
      customBenefits: draft.custom_benefits || '',
      travelAllowance: draft.travel_allowance || false,
      travelAllowanceAmount: draft.travel_allowance_amount || '',
      educationLevel: draft.education_level || '',
      currentYear: draft.current_year || [],
      minimumGpa: draft.minimum_gpa || '',
      gpaRequired: draft.gpa_required || false,
      academicBackground: draft.academic_background || [],
      customAcademicBackground: draft.custom_academic_background || '',
      experienceLevel: draft.experience_level || '',
      skillsRequired: draft.skills_required || [],
      customSkills: draft.custom_skills || '',
      languages: draft.languages || [],
      customLanguage: draft.custom_language || '',
      requiredDocuments: draft.required_documents || [],
      customRequiredDocuments: draft.custom_required_documents || '',
      learningObjectives: draft.learning_objectives || '',
      mentorshipAvailable: draft.mentorship_available || false,
      mentorshipDetails: draft.mentorship_details || '',
      projectBased: draft.project_based || false,
      projectDetails: draft.project_details || '',
      applicationProcess: draft.application_process || '',
      interviewProcess: draft.interview_process || '',
      notificationEmail: draft.notification_email || '',
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
            Manage Internship Drafts
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
                              <span className="font-medium">Title:</span>
                              <p className="truncate">{draft.internship_title || 'Not specified'}</p>
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
                  placeholder="Enter draft name (e.g., 'Marketing Internship')"
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

export default InternshipDraftManager; 
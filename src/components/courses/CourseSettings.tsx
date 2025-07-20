import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { AuthContext } from '../../contexts/AuthContext';
import { 
  FiArrowLeft, 
  FiSettings, 
  FiSave, 
  FiBell, 
  FiShield, 
  FiGlobe,
  FiCreditCard,
  FiUser,
  FiBookOpen,
  FiToggleRight,
  FiToggleLeft
} from 'react-icons/fi';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

interface CourseSettings {
  auto_approve_enrollments: boolean;
  email_notifications: boolean;
  public_course_listing: boolean;
  allow_reviews: boolean;
  require_manual_approval: boolean;
  default_course_status: 'draft' | 'published';
  max_students_per_course: number;
  course_visibility: 'public' | 'private' | 'unlisted';
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function CourseSettings() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CourseSettings>({
    auto_approve_enrollments: true,
    email_notifications: true,
    public_course_listing: true,
    allow_reviews: true,
    require_manual_approval: false,
    default_course_status: 'published',
    max_students_per_course: 100,
    course_visibility: 'public'
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch user's course settings from database
      const { data, error } = await supabase
        .from('employer_course_settings')
        .select('*')
        .eq('employer_id', user.id)
        .single();

      if (data) {
        setSettings(data);
      } else {
        // If no settings exist, create default settings
        const defaultSettings = {
          employer_id: user.id,
          auto_approve_enrollments: true,
          email_notifications: true,
          public_course_listing: true,
          allow_reviews: true,
          require_manual_approval: false,
          default_course_status: 'published',
          max_students_per_course: 100,
          course_visibility: 'public'
        };
        
        const { data: newSettings, error: createError } = await supabase
          .from('employer_course_settings')
          .insert(defaultSettings)
          .select()
          .single();
          
        if (newSettings) {
          setSettings(newSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // If table doesn't exist, use default settings
      console.log('Using default settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('employer_course_settings')
        .upsert({
          employer_id: user.id,
          ...settings
        });

      if (error) throw error;
      
      // Show success message using toast or better notification
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 left-4 right-4 md:left-auto md:right-4 bg-green-500 text-white px-4 md:px-6 py-3 rounded-lg shadow-lg z-50 text-sm md:text-base';
      successMessage.textContent = 'Settings saved successfully!';
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      
              // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed top-4 left-4 right-4 md:left-auto md:right-4 bg-red-500 text-white px-4 md:px-6 py-3 rounded-lg shadow-lg z-50 text-sm md:text-base';
        errorMessage.textContent = 'Failed to save settings. Please try again.';
        document.body.appendChild(errorMessage);
        
        setTimeout(() => {
          document.body.removeChild(errorMessage);
        }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof CourseSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
                <h1 className="text-2xl md:text-3xl font-bold text-[#185a9d] mb-1 md:mb-2">Course Settings</h1>
                <p className="text-sm md:text-base text-gray-600">Manage your course preferences and defaults</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50"
            >
              <FiSave className="w-4 h-4 md:w-5 md:h-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </motion.button>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185a9d] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {/* Enrollment Settings */}
            <motion.div 
              className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa]"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                  <FiUser className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-[#185a9d]">Enrollment Settings</h2>
              </div>
              
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between p-3 md:p-4 bg-[#f8fafc] rounded-lg">
                  <div>
                    <p className="font-semibold text-[#185a9d] text-sm md:text-base">Auto-approve enrollments</p>
                    <p className="text-xs md:text-sm text-gray-600">Automatically approve student enrollments</p>
                  </div>
                  <button
                    onClick={() => updateSetting('auto_approve_enrollments', !settings.auto_approve_enrollments)}
                    className={`p-1 rounded-full transition-colors duration-200 ${
                      settings.auto_approve_enrollments ? 'bg-[#185a9d]' : 'bg-gray-300'
                    }`}
                  >
                    {settings.auto_approve_enrollments ? (
                      <FiToggleRight className="w-5 h-5 text-white" />
                    ) : (
                      <FiToggleLeft className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 md:p-4 bg-[#f8fafc] rounded-lg">
                  <div>
                    <p className="font-semibold text-[#185a9d] text-sm md:text-base">Require manual approval</p>
                    <p className="text-xs md:text-sm text-gray-600">Manually review each enrollment request</p>
                  </div>
                  <button
                    onClick={() => updateSetting('require_manual_approval', !settings.require_manual_approval)}
                    className={`p-1 rounded-full transition-colors duration-200 ${
                      settings.require_manual_approval ? 'bg-[#185a9d]' : 'bg-gray-300'
                    }`}
                  >
                    {settings.require_manual_approval ? (
                      <FiToggleRight className="w-5 h-5 text-white" />
                    ) : (
                      <FiToggleLeft className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>

                <div className="p-3 md:p-4 bg-[#f8fafc] rounded-lg">
                  <label className="block font-semibold text-[#185a9d] text-sm md:text-base mb-2">
                    Maximum students per course
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.max_students_per_course}
                    onChange={(e) => updateSetting('max_students_per_course', parseInt(e.target.value))}
                    className="w-full px-3 md:px-4 py-2 rounded-lg border border-[#e3f0fa] focus:outline-none focus:ring-2 focus:ring-[#185a9d] text-sm md:text-base"
                  />
                </div>
              </div>
            </motion.div>

            {/* Notification Settings */}
            <motion.div 
              className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa]"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                  <FiBell className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-[#185a9d]">Notification Settings</h2>
              </div>
              
              <div className="flex items-center justify-between p-3 md:p-4 bg-[#f8fafc] rounded-lg">
                <div>
                  <p className="font-semibold text-[#185a9d] text-sm md:text-base">Email notifications</p>
                  <p className="text-xs md:text-sm text-gray-600">Receive email alerts for course activities</p>
                </div>
                <button
                  onClick={() => updateSetting('email_notifications', !settings.email_notifications)}
                  className={`p-1 rounded-full transition-colors duration-200 ${
                    settings.email_notifications ? 'bg-[#185a9d]' : 'bg-gray-300'
                  }`}
                >
                  {settings.email_notifications ? (
                    <FiToggleRight className="w-5 h-5 text-white" />
                  ) : (
                    <FiToggleLeft className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Privacy & Visibility */}
            <motion.div 
              className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa]"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                  <FiShield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-[#185a9d]">Privacy & Visibility</h2>
              </div>
              
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between p-3 md:p-4 bg-[#f8fafc] rounded-lg">
                  <div>
                    <p className="font-semibold text-[#185a9d] text-sm md:text-base">Public course listing</p>
                    <p className="text-xs md:text-sm text-gray-600">Show courses in public marketplace</p>
                  </div>
                  <button
                    onClick={() => updateSetting('public_course_listing', !settings.public_course_listing)}
                    className={`p-1 rounded-full transition-colors duration-200 ${
                      settings.public_course_listing ? 'bg-[#185a9d]' : 'bg-gray-300'
                    }`}
                  >
                    {settings.public_course_listing ? (
                      <FiToggleRight className="w-5 h-5 text-white" />
                    ) : (
                      <FiToggleLeft className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 md:p-4 bg-[#f8fafc] rounded-lg">
                  <div>
                    <p className="font-semibold text-[#185a9d] text-sm md:text-base">Allow reviews</p>
                    <p className="text-xs md:text-sm text-gray-600">Students can leave reviews and ratings</p>
                  </div>
                  <button
                    onClick={() => updateSetting('allow_reviews', !settings.allow_reviews)}
                    className={`p-1 rounded-full transition-colors duration-200 ${
                      settings.allow_reviews ? 'bg-[#185a9d]' : 'bg-gray-300'
                    }`}
                  >
                    {settings.allow_reviews ? (
                      <FiToggleRight className="w-5 h-5 text-white" />
                    ) : (
                      <FiToggleLeft className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>

                <div className="p-3 md:p-4 bg-[#f8fafc] rounded-lg">
                  <label className="block font-semibold text-[#185a9d] text-sm md:text-base mb-2">
                    Course visibility
                  </label>
                  <select
                    value={settings.course_visibility}
                    onChange={(e) => updateSetting('course_visibility', e.target.value as any)}
                    className="w-full px-3 md:px-4 py-2 rounded-lg border border-[#e3f0fa] focus:outline-none focus:ring-2 focus:ring-[#185a9d] text-sm md:text-base"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Default Settings */}
            <motion.div 
              className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-[#e3f0fa]"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg md:rounded-xl flex items-center justify-center">
                  <FiBookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-[#185a9d]">Default Course Settings</h2>
              </div>
              
              <div className="p-3 md:p-4 bg-[#f8fafc] rounded-lg">
                <label className="block font-semibold text-[#185a9d] text-sm md:text-base mb-2">
                  Default course status
                </label>
                <select
                  value={settings.default_course_status}
                  onChange={(e) => updateSetting('default_course_status', e.target.value as any)}
                  className="w-full px-3 md:px-4 py-2 rounded-lg border border-[#e3f0fa] focus:outline-none focus:ring-2 focus:ring-[#185a9d] text-sm md:text-base"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { 
  FiUser, 
  FiLock, 
  FiBell, 
  FiShield, 
  FiBriefcase,
  FiDownload,
  FiSave,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiAlertCircle,
  FiMail,
  FiSmartphone,
  FiCheck,
  FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import useIsMobile from '../hooks/useIsMobile';

type SettingsTab = 'account' | 'security' | 'notifications' | 'privacy' | 'preferences' | 'data';

const JobseekerSettings: React.FC = () => {
  const { user, profile } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Account Settings
  const [accountSettings, setAccountSettings] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    dateOfBirth: '',
  });

  // Email Change States
  const [emailChange, setEmailChange] = useState({
    newEmail: '',
    currentPassword: '',
    otp: '',
    showOtpInput: false,
    otpSent: false,
    countdown: 0,
    forgotPassword: false,
  });

  // Phone Change States
  const [phoneChange, setPhoneChange] = useState({
    newPhone: '',
    currentPassword: '',
    otp: '',
    showOtpInput: false,
    otpSent: false,
    countdown: 0,
    forgotPassword: false,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    jobAlerts: true,
    applicationUpdates: true,
    newMessages: true,
    marketingEmails: false,
    emailFrequency: 'daily',
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showContactInfo: true,
    allowMessages: true,
    showOnlineStatus: true,
  });

  // Job Preferences
  const [preferenceSettings, setPreferenceSettings] = useState({
    remoteWork: 'any',
    workSchedule: 'flexible',
    salaryRange: {
      min: '',
      max: '',
    },
  });

  const isMobile = useIsMobile();

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'account', label: 'Account', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'privacy', label: 'Privacy', icon: FiShield },
    { id: 'preferences', label: 'Job Prefs', icon: FiBriefcase },
    { id: 'data', label: 'Data', icon: FiDownload },
  ];

  useEffect(() => {
    if (profile) {
      setAccountSettings({
        fullName: profile.full_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        dateOfBirth: profile.date_of_birth || '',
      });
    }
  }, [user, profile]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailChange.countdown > 0) {
      interval = setInterval(() => {
        setEmailChange(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailChange.countdown]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phoneChange.countdown > 0) {
      interval = setInterval(() => {
        setPhoneChange(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phoneChange.countdown]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailChange(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPhoneChange(prev => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecuritySettings(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('salaryRange.')) {
      const rangeField = name.split('.')[1];
      setPreferenceSettings(prev => ({
        ...prev,
        salaryRange: {
          ...prev.salaryRange,
          [rangeField]: value
        }
      }));
    } else {
      setPreferenceSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  // Email change functions
  const sendEmailOtp = async () => {
    if (!emailChange.newEmail || !emailChange.currentPassword) {
      toast.error('Please enter both new email and current password');
      return;
    }

    if (!emailChange.newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (emailChange.currentPassword.length < 6) {
      toast.error('Current password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would call your backend to send SMS OTP
      // For now, we'll simulate the OTP sending
      setEmailChange(prev => ({
        ...prev,
        otpSent: true,
        showOtpInput: true,
        countdown: 60
      }));
      toast.success('OTP sent to your email');
    } catch (error: any) {
      toast.error('Failed to send OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!emailChange.otp || emailChange.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would verify the OTP with your backend
      // For now, we'll simulate the verification (accept any 6-digit code)
      if (emailChange.otp.length === 6) {
        const { error } = await supabase.auth.updateUser({
          email: emailChange.newEmail
        });

        if (error) throw error;

        toast.success('Email updated successfully! Please check your new email for verification.');
        setEmailChange({
          newEmail: '',
          currentPassword: '',
          otp: '',
          showOtpInput: false,
          otpSent: false,
          countdown: 0,
          forgotPassword: false,
        });
        setAccountSettings(prev => ({ ...prev, email: emailChange.newEmail }));
      } else {
        toast.error('Invalid OTP');
      }
    } catch (error: any) {
      toast.error('Failed to update email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendEmailOtp = () => {
    if (emailChange.countdown > 0) return;
    sendEmailOtp();
  };

  // Phone change functions
  const sendPhoneOtp = async () => {
    if (!phoneChange.newPhone || !phoneChange.currentPassword) {
      toast.error('Please enter both new phone number and current password');
      return;
    }

    if (phoneChange.newPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (phoneChange.currentPassword.length < 6) {
      toast.error('Current password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would call your backend to send email OTP
      // For now, we'll simulate the OTP sending
      setPhoneChange(prev => ({
        ...prev,
        otpSent: true,
        showOtpInput: true,
        countdown: 60
      }));
      toast.success('OTP sent to your email');
    } catch (error: any) {
      toast.error('Failed to send OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async () => {
    if (!phoneChange.otp || phoneChange.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would verify the OTP with your backend
      // For now, we'll simulate the verification (accept any 6-digit code)
      if (phoneChange.otp.length === 6) {
        const { error } = await supabase
          .from('profiles')
          .update({ phone: phoneChange.newPhone })
          .eq('auth_id', user?.id);

        if (error) throw error;

        toast.success('Phone number updated successfully!');
        setPhoneChange({
          newPhone: '',
          currentPassword: '',
          otp: '',
          showOtpInput: false,
          otpSent: false,
          countdown: 0,
          forgotPassword: false,
        });
        setAccountSettings(prev => ({ ...prev, phone: phoneChange.newPhone }));
      } else {
        toast.error('Invalid OTP');
      }
    } catch (error: any) {
      toast.error('Failed to update phone number: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendPhoneOtp = () => {
    if (phoneChange.countdown > 0) return;
    sendPhoneOtp();
  };

  // Forgot password functions
  const sendForgotEmailOtp = async () => {
    if (!emailChange.newEmail) {
      toast.error('Please enter new email address');
      return;
    }

    if (!emailChange.newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would send OTP to the new email
      setEmailChange(prev => ({
        ...prev,
        otpSent: true,
        showOtpInput: true,
        countdown: 60,
        forgotPassword: true
      }));
      toast.success('OTP sent to your new email address');
    } catch (error: any) {
      toast.error('Failed to send OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendForgotPhoneOtp = async () => {
    if (!phoneChange.newPhone) {
      toast.error('Please enter new phone number');
      return;
    }

    if (phoneChange.newPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would send SMS OTP to the new phone
      setPhoneChange(prev => ({
        ...prev,
        otpSent: true,
        showOtpInput: true,
        countdown: 60,
        forgotPassword: true
      }));
      toast.success('OTP sent to your new phone number');
    } catch (error: any) {
      toast.error('Failed to send OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAccountSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: accountSettings.fullName,
          location: accountSettings.location,
          date_of_birth: accountSettings.dateOfBirth,
        })
        .eq('auth_id', user.id);

      if (error) throw error;
      toast.success('Account settings updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update account settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!user) return;
    
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (securitySettings.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: securitySettings.newPassword
      });

      if (error) throw error;
      
      toast.success('Password updated successfully!');
      setSecuritySettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      toast.error('Failed to update password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    toast.success('Notification settings updated successfully!');
  };

  const savePrivacySettings = async () => {
    toast.success('Privacy settings updated successfully!');
  };

  const savePreferenceSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_work_type: preferenceSettings.remoteWork,
          salary_expectation: `${preferenceSettings.salaryRange.min} - ${preferenceSettings.salaryRange.max}`,
        })
        .eq('auth_id', user.id);

      if (error) throw error;
      toast.success('Job preferences updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update job preferences: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      const dataStr = JSON.stringify({
        user: {
          email: user.email,
          created_at: user.created_at,
        },
        profile: profileData,
        export_date: new Date().toISOString()
      }, null, 2);

      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selectz-data-${user.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error: any) {
      toast.error('Failed to export data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user || !window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('auth_id', user.id);

      if (profileError) throw profileError;

      toast.success('Account deleted successfully');
      window.location.href = '/login';
    } catch (error: any) {
      toast.error('Failed to delete account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return isMobile ? (
    <div className="min-h-screen bg-white px-0 py-0">
      {/* Header */}
      <div className="w-full px-4 py-6 bg-white flex items-center justify-between border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-black">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your account & preferences</p>
        </div>
        <div className="bg-gray-100 rounded-full p-2">
          <FiUser className="w-7 h-7 text-gray-700" />
        </div>
      </div>
      {/* Tabs as horizontal scrollable pills */}
      <div className="flex overflow-x-auto gap-2 px-4 py-3 bg-white border-b border-gray-100">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#185a9d] text-white shadow-[0_2px_8px_#185a9d33]'
                  : 'bg-gray-100 text-gray-800 border border-gray-200 hover:shadow-[0_2px_8px_#185a9d22] hover:border-[#185a9d]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* Main Content */}
      <div className="px-4 py-6">
        {activeTab === 'account' && (
          <div className="bg-white rounded-2xl shadow-lg p-5 space-y-6 border border-gray-100 hover:shadow-[0_4px_16px_#185a9d22] focus-within:shadow-[0_4px_16px_#185a9d33] transition-shadow duration-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center"><FiUser className="mr-2" />Account Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" name="fullName" value={accountSettings.fullName} onChange={handleAccountChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#185a9d] bg-white text-black transition-shadow duration-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" name="location" value={accountSettings.location} onChange={handleAccountChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#185a9d] bg-white text-black transition-shadow duration-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={accountSettings.dateOfBirth} onChange={handleAccountChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#185a9d] bg-white text-black transition-shadow duration-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={accountSettings.email} disabled
                  className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={accountSettings.phone || 'Not set'} disabled
                  className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400" />
              </div>
            </div>
            <button onClick={saveAccountSettings} disabled={loading}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold shadow active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center hover:shadow-[0_2px_8px_#185a9d99] focus:shadow-[0_2px_8px_#185a9d]">
              <FiSave className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
        {/* Repeat similar mobile-friendly cards for other tabs: security, notifications, privacy, preferences, data */}
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                <p className="text-white/90">Manage your account, security, and preferences</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FiUser className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
      </div>

        {/* Settings Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
              <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
              </button>
                  );
                })}
          </nav>
        </div>
      </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Account Settings */}
        {activeTab === 'account' && (
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <FiUser className="w-6 h-6 text-emerald-600 mr-3" />
                    <h2 className="text-2xl font-semibold text-gray-900">Account Information</h2>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Basic Information */}
            <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={accountSettings.fullName}
                onChange={handleAccountChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                            type="text"
                            name="location"
                            value={accountSettings.location}
                onChange={handleAccountChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                            type="date"
                            name="dateOfBirth"
                            value={accountSettings.dateOfBirth}
                onChange={handleAccountChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
                        </div>
                      </div>
            </div>

                    {/* Contact Information (Read-only) */}
            <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                          <div className="flex items-center space-x-3">
                  <input
                              type="email"
                              value={accountSettings.email}
                              disabled
                              className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                            />
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Read-only</span>
                </div>
                          <p className="text-xs text-gray-500 mt-1">To change email, go to Security settings</p>
                </div>
                <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                          <div className="flex items-center space-x-3">
                  <input
                              type="tel"
                              value={accountSettings.phone || 'Not set'}
                              disabled
                              className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                            />
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Read-only</span>
                </div>
                          <p className="text-xs text-gray-500 mt-1">To change phone, go to Security settings</p>
              </div>
            </div>
          </div>
                    
                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <button
                        onClick={saveAccountSettings}
                        disabled={loading}
                        className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center"
                      >
                        <FiSave className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                </div>
              </div>
            </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <FiLock className="w-6 h-6 text-emerald-600 mr-3" />
                    <h2 className="text-2xl font-semibold text-gray-900">Security Settings</h2>
            </div>

                  <div className="space-y-8">
                    {/* Password Change */}
            <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <FiAlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
                            <h3 className="text-sm font-medium text-yellow-800">Password Security</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              Use a strong password with at least 8 characters, including letters, numbers, and symbols.
                            </p>
                          </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                          <div className="relative">
                <input
                              type={showCurrentPassword ? 'text' : 'password'}
                              name="currentPassword"
                              value={securitySettings.currentPassword}
                              onChange={handleSecurityChange}
                              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showCurrentPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
              </div>
              </div>
                        
              <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                          <div className="relative">
                <input
                              type={showNewPassword ? 'text' : 'password'}
                              name="newPassword"
                              value={securitySettings.newPassword}
                              onChange={handleSecurityChange}
                              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
              </div>
                        </div>
                        
              <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                          <div className="relative">
                <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={securitySettings.confirmPassword}
                              onChange={handleSecurityChange}
                              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
              </div>
            </div>
          </div>
                      
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={changePassword}
                          disabled={loading || !securitySettings.newPassword || !securitySettings.confirmPassword}
                          className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center"
                        >
                          <FiLock className="w-4 h-4 mr-2" />
                          {loading ? 'Updating...' : 'Update Password'}
                        </button>
                </div>
              </div>

                    {/* Email Change */}
                    <div className="border-t border-gray-200 pt-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FiMail className="w-5 h-5 mr-2 text-emerald-600" />
                        Change Email Address
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-700">Current Email: <span className="font-medium">{accountSettings.email}</span></p>
              </div>

                      {!emailChange.showOtpInput ? (
                        <div className="space-y-4">
                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Email Address</label>
                  <input
                              type="email"
                              name="newEmail"
                              value={emailChange.newEmail}
                              onChange={handleEmailChange}
                              placeholder="Enter new email address"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
              </div>
                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                              type="password"
                              name="currentPassword"
                              value={emailChange.currentPassword}
                              onChange={handleEmailChange}
                              placeholder="Enter your current password"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
              </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={sendEmailOtp}
                              disabled={loading || !emailChange.newEmail || !emailChange.currentPassword}
                              className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center"
                            >
                              <FiMail className="w-4 h-4 mr-2" />
                              {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                            <button
                              onClick={sendForgotEmailOtp}
                              disabled={loading || !emailChange.newEmail}
                              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                              Forgot Password?
                            </button>
            </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                            <input
                              type="text"
                              name="otp"
                              value={emailChange.otp}
                              onChange={handleEmailChange}
                              placeholder="Enter 6-digit OTP"
                              maxLength={6}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {emailChange.forgotPassword ? 'OTP sent to your new email address' : 'OTP sent to your current email'}
                            </p>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={verifyEmailOtp}
                              disabled={loading || emailChange.otp.length !== 6}
                              className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center"
                            >
                              <FiCheck className="w-4 h-4 mr-2" />
                              {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button
                              onClick={emailChange.forgotPassword ? resendEmailOtp : resendEmailOtp}
                              disabled={emailChange.countdown > 0}
                              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                              {emailChange.countdown > 0 ? `Resend (${emailChange.countdown}s)` : 'Resend OTP'}
                            </button>
                            <button
                              onClick={() => setEmailChange({
                                newEmail: '',
                                currentPassword: '',
                                otp: '',
                                showOtpInput: false,
                                otpSent: false,
                                countdown: 0,
                                forgotPassword: false,
                              })}
                              className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center"
                            >
                              <FiX className="w-4 h-4 mr-2" />
                              Cancel
                            </button>
            </div>
          </div>
        )}
                    </div>

                    {/* Phone Change */}
                    <div className="border-t border-gray-200 pt-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FiSmartphone className="w-5 h-5 mr-2 text-emerald-600" />
                        Change Phone Number
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-700">Current Phone: <span className="font-medium">{accountSettings.phone || 'Not set'}</span></p>
            </div>

                      {!phoneChange.showOtpInput ? (
            <div className="space-y-4">
                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Phone Number</label>
                  <input
                              type="tel"
                              name="newPhone"
                              value={phoneChange.newPhone}
                              onChange={handlePhoneChange}
                              placeholder="Enter new phone number"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
              </div>
                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                              type="password"
                              name="currentPassword"
                              value={phoneChange.currentPassword}
                              onChange={handlePhoneChange}
                              placeholder="Enter your current password"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
              </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={sendPhoneOtp}
                              disabled={loading || !phoneChange.newPhone || !phoneChange.currentPassword}
                              className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center"
                            >
                              <FiSmartphone className="w-4 h-4 mr-2" />
                              {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                            <button
                              onClick={sendForgotPhoneOtp}
                              disabled={loading || !phoneChange.newPhone}
                              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                              Forgot Password?
                            </button>
                </div>
              </div>
                      ) : (
                        <div className="space-y-4">
                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                  <input
                              type="text"
                              name="otp"
                              value={phoneChange.otp}
                              onChange={handlePhoneChange}
                              placeholder="Enter 6-digit OTP"
                              maxLength={6}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {phoneChange.forgotPassword ? 'OTP sent to your new phone number' : 'OTP sent to your current email'}
                            </p>
              </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={verifyPhoneOtp}
                              disabled={loading || phoneChange.otp.length !== 6}
                              className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center"
                            >
                              <FiCheck className="w-4 h-4 mr-2" />
                              {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button
                              onClick={phoneChange.forgotPassword ? resendPhoneOtp : resendPhoneOtp}
                              disabled={phoneChange.countdown > 0}
                              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                              {phoneChange.countdown > 0 ? `Resend (${phoneChange.countdown}s)` : 'Resend OTP'}
                            </button>
                            <button
                              onClick={() => setPhoneChange({
                                newPhone: '',
                                currentPassword: '',
                                otp: '',
                                showOtpInput: false,
                                otpSent: false,
                                countdown: 0,
                                forgotPassword: false,
                              })}
                              className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center"
                            >
                              <FiX className="w-4 h-4 mr-2" />
                              Cancel
                            </button>
            </div>
          </div>
        )}
            </div>
            </div>
            </div>
              )}

              {/* Other tabs would go here - simplified for brevity */}
              {activeTab === 'notifications' && (
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <FiBell className="w-6 h-6 text-emerald-600 mr-3" />
                    <h2 className="text-2xl font-semibold text-gray-900">Notification Preferences</h2>
              </div>
                  <p className="text-gray-600">Notification settings coming soon...</p>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <FiShield className="w-6 h-6 text-emerald-600 mr-3" />
                    <h2 className="text-2xl font-semibold text-gray-900">Privacy Settings</h2>
              </div>
                  <p className="text-gray-600">Privacy settings coming soon...</p>
            </div>
              )}

              {activeTab === 'preferences' && (
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <FiBriefcase className="w-6 h-6 text-emerald-600 mr-3" />
                    <h2 className="text-2xl font-semibold text-gray-900">Job Preferences</h2>
            </div>
                  <p className="text-gray-600">Job preferences coming soon...</p>
          </div>
        )}

              {activeTab === 'data' && (
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <FiDownload className="w-6 h-6 text-emerald-600 mr-3" />
                    <h2 className="text-2xl font-semibold text-gray-900">Data & Export</h2>
                  </div>
                  <div className="space-y-4">
            <button
                      onClick={exportUserData}
                      disabled={loading}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      {loading ? 'Exporting...' : 'Export Data'}
                    </button>
                    <button
                      onClick={deleteAccount}
                      disabled={loading}
                      className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center"
                    >
                      <FiTrash2 className="w-4 h-4 mr-2" />
                      {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobseekerSettings; 
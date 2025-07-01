import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { FiEdit2, FiSave, FiX, FiPlus, FiTrash2, FiLinkedin, FiGithub, FiGlobe, FiPhone, FiMapPin, FiMail, FiCalendar, FiAward, FiBookOpen, FiDownload, FiUpload, FiEye, FiEyeOff, FiBriefcase } from 'react-icons/fi';

interface SocialLink { platform: string; url: string; }

interface WorkExperience {
  company: string;
  position: string;
  location: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
  achievements: string[];
  technologies: string[];
}

interface ProfileFormState {
  full_name: string;
  avatar_url: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  title: string;
  experience: string;
  summary: string;
  skills: { name: string }[];
  education: { degree: string; institution: string; year: string; field: string; }[];
  work_experience: WorkExperience[];
  date_of_birth?: string;
  website?: string;
  twitter?: string;
  bio?: string;
  preferred_work_type?: string;
  salary_expectation?: string;
  availability?: string;
  languages?: string[];
  certifications: { name: string; issuer: string; date: string; photo_url: string; certificate_url: string }[];
  projects: { name: string; description: string; url: string; github: string; technologies: string[] }[];
  achievements?: string[];
  social_links?: SocialLink[];
}

const JobseekerProfile: React.FC = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'education' | 'skills' | 'projects'>('overview');
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formState, setFormState] = useState<ProfileFormState>({
    full_name: '',
    avatar_url: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    title: '',
    experience: '',
    summary: '',
    skills: [],
    education: [],
    work_experience: [],
    date_of_birth: '',
    website: '',
    twitter: '',
    bio: '',
    preferred_work_type: '',
    salary_expectation: '',
    availability: '',
    languages: [],
    certifications: [],
    projects: [],
    achievements: [],
    social_links: [],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState('LinkedIn');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const socialPlatforms = [
    'LinkedIn', 'Twitter', 'Instagram', 'GitHub', 'Portfolio', 'Website'
  ];

  // Work Experience state
  const [newWorkExperience, setNewWorkExperience] = useState<WorkExperience>({
    company: '',
    position: '',
    location: '',
    start_date: '',
    end_date: '',
    current: false,
    description: '',
    achievements: [],
    technologies: []
  });
  const [newAchievementText, setNewAchievementText] = useState('');
  const [newTechnologyText, setNewTechnologyText] = useState('');

  // Add state for editing experience
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Add state for editing education
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [newEducation, setNewEducation] = useState({ degree: '', institution: '', year: '', field: '' });

  // 1. Add state for certificates & projects modals and forms
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '', photo_url: '', certificate_url: '' });
  const [certImageFile, setCertImageFile] = useState<File | null>(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '', url: '', github: '', technologies: [] as string[] });
  const [newProjectTech, setNewProjectTech] = useState('');

  const [newSkillInput, setNewSkillInput] = useState('');

  useEffect(() => {
    if (profile) {
      setFormState({
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        phone: profile.phone || '',
        location: profile.location || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        portfolio: profile.portfolio || '',
        title: profile.title || '',
        experience: profile.experience || '',
        summary: profile.summary || '',
        skills: profile.skills || [],
        education: profile.education || [],
        work_experience: profile.work_experience || [],
        date_of_birth: profile.date_of_birth || '',
        website: profile.website || '',
        twitter: profile.twitter || '',
        bio: profile.bio || '',
        preferred_work_type: profile.preferred_work_type || '',
        salary_expectation: profile.salary_expectation || '',
        availability: profile.availability || '',
        languages: profile.languages || [],
        certifications: profile.certifications || [],
        projects: profile.projects || [],
        achievements: profile.achievements || [],
        social_links: profile.social_links|| [],
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (newSkills: { name: string }[]) => {
    setFormState(prev => ({...prev, skills: newSkills }));
  }

  const handleEducationChange = (index: number, field: string, value: string) => {
    const newEducation = [...formState.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setFormState(prev => ({ ...prev, education: newEducation }));
  };

  const addEducation = () => {
    setFormState(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: '', institution: '', year: '', field: '' }
      ]
    }));
  };

  const removeEducation = (index: number) => {
    setFormState(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formState.skills.find(s => s.name.toLowerCase() === newSkill.toLowerCase())) {
      setFormState(prev => ({
        ...prev,
        skills: [...prev.skills, { name: newSkill.trim() }]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setFormState(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formState.languages?.includes(newLanguage.trim())) {
      setFormState(prev => ({
        ...prev,
        languages: [...(prev.languages || []), newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    setFormState(prev => ({
      ...prev,
      languages: prev.languages?.filter((_, i) => i !== index) || []
    }));
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setFormState(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setFormState(prev => ({
      ...prev,
      achievements: prev.achievements?.filter((_, i) => i !== index) || []
    }));
  };

  const addSocialLink = () => {
    if (newSocialUrl.trim() && !formState.social_links?.find(l => l.url === newSocialUrl)) {
      setFormState(prev => ({
        ...prev,
        social_links: [...(prev.social_links || []), { platform: newSocialPlatform, url: newSocialUrl.trim() }]
      }));
      setNewSocialUrl('');
    }
  };

  const removeSocialLink = (index: number) => {
    setFormState(prev => ({
      ...prev,
      social_links: prev.social_links?.filter((_, i) => i !== index) || []
    }));
  };

  // Work Experience functions
  const handleWorkExperienceChange = (index: number, field: string, value: string | boolean) => {
    const newWorkExperience = [...formState.work_experience];
    newWorkExperience[index] = { ...newWorkExperience[index], [field]: value };
    setFormState(prev => ({ ...prev, work_experience: newWorkExperience }));
  };

  const addWorkExperience = () => {
    if (newWorkExperience.company.trim() && newWorkExperience.position.trim()) {
      setFormState(prev => ({
        ...prev,
        work_experience: [...prev.work_experience, { ...newWorkExperience }]
      }));
      // Reset form
      setNewWorkExperience({
        company: '',
        position: '',
        location: '',
        start_date: '',
        end_date: '',
        current: false,
        description: '',
        achievements: [],
        technologies: []
      });
    }
  };

  const removeWorkExperience = (index: number) => {
    setFormState(prev => ({
      ...prev,
      work_experience: prev.work_experience.filter((_, i) => i !== index)
    }));
  };

  const addWorkAchievement = (workIndex: number) => {
    if (newAchievementText.trim()) {
      const newWorkExperience = [...formState.work_experience];
      newWorkExperience[workIndex].achievements.push(newAchievementText.trim());
      setFormState(prev => ({ ...prev, work_experience: newWorkExperience }));
      setNewAchievementText('');
    }
  };

  const removeWorkAchievement = (workIndex: number, achievementIndex: number) => {
    const newWorkExperience = [...formState.work_experience];
    newWorkExperience[workIndex].achievements.splice(achievementIndex, 1);
    setFormState(prev => ({ ...prev, work_experience: newWorkExperience }));
  };

  const addWorkTechnology = (workIndex: number) => {
    if (newTechnologyText.trim()) {
      const newWorkExperience = [...formState.work_experience];
      newWorkExperience[workIndex].technologies.push(newTechnologyText.trim());
      setFormState(prev => ({ ...prev, work_experience: newWorkExperience }));
      setNewTechnologyText('');
    }
  };

  const removeWorkTechnology = (workIndex: number, technologyIndex: number) => {
    const newWorkExperience = [...formState.work_experience];
    newWorkExperience[workIndex].technologies.splice(technologyIndex, 1);
    setFormState(prev => ({ ...prev, work_experience: newWorkExperience }));
  };

  // Handler to start editing an experience
  const handleEditWorkExperience = (index: number) => {
    setEditingIndex(index);
    setNewWorkExperience({ ...formState.work_experience[index] });
    setIsEditing(true);
  };

  // Handler to cancel add/edit
  const handleCancelWorkExperience = () => {
    setIsEditing(false);
    setEditingIndex(null);
    setNewWorkExperience({
      company: '',
      position: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: '',
      achievements: [],
      technologies: []
    });
  };

  // Handler to save (add or edit) experience
  const handleSaveWorkExperience = async () => {
    if (!newWorkExperience.company.trim() || !newWorkExperience.position.trim()) return;
    let updatedWorkExperience;
    if (editingIndex !== null) {
      updatedWorkExperience = [...formState.work_experience];
      updatedWorkExperience[editingIndex] = { ...newWorkExperience };
    } else {
      updatedWorkExperience = [...formState.work_experience, { ...newWorkExperience }];
    }
    const updatedFormState = { ...formState, work_experience: updatedWorkExperience };
    setFormState(updatedFormState);
    setIsEditing(false);
    setEditingIndex(null);
    setNewWorkExperience({
      company: '', position: '', location: '', start_date: '', end_date: '', current: false, description: '', achievements: [], technologies: []
    });
    await saveProfileToSupabase(updatedFormState);
  };

  // Handler to start editing an education
  const handleEditEducation = (index: number) => {
    setEditingEducationIndex(index);
    setNewEducation({ ...formState.education[index] });
    setIsEditing(true);
  };

  // Handler to cancel add/edit education
  const handleCancelEducation = () => {
    setIsEditing(false);
    setEditingEducationIndex(null);
    setNewEducation({ degree: '', institution: '', year: '', field: '' });
  };

  // Handler to save (add or edit) education
  const handleSaveEducation = async () => {
    if (!newEducation.degree.trim() || !newEducation.institution.trim()) return;
    let updatedEducation;
    if (editingEducationIndex !== null) {
      updatedEducation = [...formState.education];
      updatedEducation[editingEducationIndex] = { ...newEducation };
    } else {
      updatedEducation = [...formState.education, { ...newEducation }];
    }
    const updatedFormState = { ...formState, education: updatedEducation };
    setFormState(updatedFormState);
    setIsEditing(false);
    setEditingEducationIndex(null);
    setNewEducation({ degree: '', institution: '', year: '', field: '' });
    await saveProfileToSupabase(updatedFormState);
  };

  // Skills logic
  const handleAddSkill = () => {
    if (newSkillInput.trim() && !formState.skills.find(s => s.name.toLowerCase() === newSkillInput.toLowerCase())) {
      setFormState(prev => ({ ...prev, skills: [...prev.skills, { name: newSkillInput.trim() }] }));
      setNewSkillInput('');
    }
  };
  const handleRemoveSkill = (index: number) => {
    setFormState(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('User not authenticated.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const skills = Array.isArray(formState.skills) ? formState.skills.filter(Boolean) : [];
      const education = Array.isArray(formState.education) ? formState.education.filter(Boolean) : [];
      const work_experience = Array.isArray(formState.work_experience) ? formState.work_experience.filter(Boolean) : [];
      const social_links = Array.isArray(formState.social_links) ? formState.social_links.filter(Boolean) : [];
      const languages = Array.isArray(formState.languages) ? formState.languages.filter(Boolean) : [];

      // Clean date fields in work_experience
      const cleanedWorkExperience = work_experience.map(exp => ({
        ...exp,
        start_date: exp.start_date === '' ? null : exp.start_date,
        end_date: exp.end_date === '' ? null : exp.end_date,
      }));

      // Clean date_of_birth
      const date_of_birth = formState.date_of_birth === '' ? null : formState.date_of_birth;

      const payload: any = {
        auth_id: user.id,
        ...formState,
        skills,
        education,
        work_experience: cleanedWorkExperience,
        social_links,
        languages,
        date_of_birth,
      };
      delete payload.id;
      delete payload.user_id;

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'auth_id' });

      console.log('Save response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage (upsert: true to overwrite)
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Update profile in DB
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          auth_id: user.id,
          avatar_url: publicUrl 
        });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      alert('Profile picture updated!');
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 1. Add a helper function for saving to Supabase
  const saveProfileToSupabase = async (updatedFormState: ProfileFormState) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const skills = Array.isArray(updatedFormState.skills) ? updatedFormState.skills.filter(Boolean) : [];
      const education = Array.isArray(updatedFormState.education) ? updatedFormState.education.filter(Boolean) : [];
      const work_experience = Array.isArray(updatedFormState.work_experience) ? updatedFormState.work_experience.filter(Boolean) : [];
      const social_links = Array.isArray(updatedFormState.social_links) ? updatedFormState.social_links.filter(Boolean) : [];
      const languages = Array.isArray(updatedFormState.languages) ? updatedFormState.languages.filter(Boolean) : [];
      const cleanedWorkExperience = work_experience.map(exp => ({
        ...exp,
        start_date: exp.start_date === '' ? null : exp.start_date,
        end_date: exp.end_date === '' ? null : exp.end_date,
      }));
      const date_of_birth = updatedFormState.date_of_birth === '' ? null : updatedFormState.date_of_birth;
      const payload: any = {
        auth_id: user.id,
        ...updatedFormState,
        skills,
        education,
        work_experience: cleanedWorkExperience,
        social_links,
        languages,
        date_of_birth,
      };
      delete payload.id;
      delete payload.user_id;
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'auth_id' });
      if (error) throw error;
      setSuccess('Profile updated successfully!');
      refreshProfile && await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Certificate handlers
  const handleAddCert = () => {
    setShowCertModal(true);
    setEditingCertIndex(null);
    setNewCert({ name: '', issuer: '', date: '', photo_url: '', certificate_url: '' });
    setCertImageFile(null);
  };
  const handleEditCert = (idx: number) => {
    setShowCertModal(true);
    setEditingCertIndex(idx);
    const cert = (formState.certifications || [])[idx] || { name: '', issuer: '', date: '', photo_url: '', certificate_url: '' };
    setNewCert({
      name: cert.name || '',
      issuer: cert.issuer || '',
      date: cert.date || '',
      photo_url: cert.photo_url || '',
      certificate_url: cert.certificate_url || ''
    });
    setCertImageFile(null);
  };
  const handleRemoveCert = async (idx: number) => {
    const updatedCerts = (formState.certifications || []).filter((_, i) => i !== idx);
    const updatedFormState = { ...formState, certifications: updatedCerts };
    setFormState(updatedFormState);
    await saveProfileToSupabase(updatedFormState);
  };
  const handleCertImageUpload = async (file: File) => {
    if (!user) return '';
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('certificates').upload(fileName, file, { upsert: true });
    if (error) {
      setError('Failed to upload certificate image.');
      return '';
    }
    const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(fileName);
    return urlData.publicUrl;
  };
  const handleSaveCert = async () => {
    let photo_url = newCert.photo_url;
    if (certImageFile) {
      photo_url = await handleCertImageUpload(certImageFile);
    }
    const certObj = { ...newCert, photo_url };
    let updatedCerts;
    if (editingCertIndex !== null) {
      updatedCerts = [...formState.certifications];
      updatedCerts[editingCertIndex] = certObj;
    } else {
      updatedCerts = [...formState.certifications, certObj];
    }
    const updatedFormState = { ...formState, certifications: updatedCerts };
    setFormState(updatedFormState);
    setShowCertModal(false);
    setEditingCertIndex(null);
    setNewCert({ name: '', issuer: '', date: '', photo_url: '', certificate_url: '' });
    setCertImageFile(null);
    await saveProfileToSupabase(updatedFormState);
  };

  // 3. Project handlers
  const handleAddProject = () => {
    setShowProjectModal(true);
    setEditingProjectIndex(null);
    setNewProject({ name: '', description: '', url: '', github: '', technologies: [] });
    setNewProjectTech('');
  };
  const handleEditProject = (idx: number) => {
    setShowProjectModal(true);
    setEditingProjectIndex(idx);
    const proj = (formState.projects || [])[idx] || { name: '', description: '', url: '', github: '', technologies: [] };
    setNewProject({
      name: proj.name || '',
      description: proj.description || '',
      url: proj.url || '',
      github: proj.github || '',
      technologies: proj.technologies || []
    });
    setNewProjectTech('');
  };
  const handleRemoveProject = async (idx: number) => {
    const updatedProjects = (formState.projects || []).filter((_, i) => i !== idx);
    const updatedFormState = { ...formState, projects: updatedProjects };
    setFormState(updatedFormState);
    await saveProfileToSupabase(updatedFormState);
  };
  const handleAddProjectTech = () => {
    if (newProjectTech.trim() && !newProject.technologies.includes(newProjectTech.trim())) {
      setNewProject(prev => ({ ...prev, technologies: [...prev.technologies, newProjectTech.trim()] }));
      setNewProjectTech('');
    }
  };
  const handleRemoveProjectTech = (idx: number) => {
    setNewProject(prev => ({ ...prev, technologies: prev.technologies.filter((_, i) => i !== idx) }));
  };
  const handleSaveProject = async () => {
    let updatedProjects;
    if (editingProjectIndex !== null) {
      updatedProjects = [...formState.projects];
      updatedProjects[editingProjectIndex] = newProject;
    } else {
      updatedProjects = [...formState.projects, newProject];
    }
    const updatedFormState = { ...formState, projects: updatedProjects };
    setFormState(updatedFormState);
    setShowProjectModal(false);
    setEditingProjectIndex(null);
    setNewProject({ name: '', description: '', url: '', github: '', technologies: [] });
    setNewProjectTech('');
    await saveProfileToSupabase(updatedFormState);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="relative h-48 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-end space-x-6">
                <div className="relative">
                  <img
                    src={avatarUrl || '/default-avatar.png'}
                    alt="Profile"
                    className={`w-32 h-32 rounded-full object-cover border-4 border-[#185a9d] mb-2 ${isEditing ? 'cursor-pointer opacity-80 hover:opacity-60 transition' : ''}`}
                    onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
                  />
                  {isEditing && (
                    <button
                      className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      type="button"
                    >
                      {uploading ? (
                        <span className="w-4 h-4 text-gray-600 animate-spin border-b-2 border-emerald-600 rounded-full inline-block"></span>
                      ) : (
                        <FiUpload className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  )}
                  {/* Hidden file input for uploading profile photo */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="flex-1 text-white">
                  <h1 className="text-3xl font-bold mb-2">{formState.full_name || 'Your Name'}</h1>
                  <p className="text-xl opacity-90 mb-2">{formState.title || 'Professional Title'}</p>
                  <div className="flex items-center space-x-4 text-sm opacity-80">
                    {formState.location && (
                      <div className="flex items-center">
                        <FiMapPin className="w-4 h-4 mr-1" />
                        {formState.location}
                      </div>
                    )}
                    {formState.phone && (
                      <div className="flex items-center">
                        <FiPhone className="w-4 h-4 mr-1" />
                        {formState.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <FiEdit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-emerald-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-emerald-600 transition-colors flex items-center disabled:opacity-50"
                      >
                        <FiSave className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-300 transition-colors flex items-center"
                      >
                        <FiX className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: FiEye },
                { id: 'experience', label: 'Experience', icon: FiAward },
                { id: 'education', label: 'Education', icon: FiBookOpen },
                { id: 'skills', label: 'Skills', icon: FiAward },
                { id: 'projects', label: 'Certificates & Projects', icon: FiGithub },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                    {/* Personal Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="full_name"
                          value={formState.full_name}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-700">{formState.full_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="title"
                          value={formState.title}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-700">{formState.title || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formState.phone}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-700">{formState.phone || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="location"
                          value={formState.location}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-700">{formState.location || 'Not specified'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                  {isEditing ? (
                    <textarea
                      name="summary"
                      value={formState.summary}
                      onChange={handleChange}
                      placeholder="Tell us about yourself, your experience, and what you're looking for..."
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {formState.summary || 'No summary provided yet.'}
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <FiMail className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-700">{user?.email}</span>
                      </div>
                      {formState.phone && (
                        <div className="flex items-center">
                          <FiPhone className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-gray-700">{formState.phone}</span>
                        </div>
                      )}
                      {formState.location && (
                        <div className="flex items-center">
                          <FiMapPin className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-gray-700">{formState.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
                    {isEditing ? (
                      <>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {formState.social_links && formState.social_links.length > 0 ? (
                            formState.social_links.map((link, idx) => (
                              <div key={idx} className="flex items-center bg-blue-50 px-3 py-1 rounded-full text-blue-800 text-sm font-medium mr-2 mb-2">
                                <span className="mr-2">{link.platform}:</span>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="underline mr-2">{link.url}</a>
                                <button onClick={() => removeSocialLink(idx)} className="ml-1 text-red-500 hover:text-red-700">&times;</button>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500">No social links added yet.</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <select
                            value={newSocialPlatform}
                            onChange={e => setNewSocialPlatform(e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1"
                          >
                            {socialPlatforms.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <input
                            type="url"
                            placeholder="Profile URL"
                            value={newSocialUrl}
                            onChange={e => setNewSocialUrl(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-1 w-64"
                          />
                          <button
                            type="button"
                            onClick={addSocialLink}
                            className="bg-emerald-500 text-white px-3 py-1 rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formState.social_links && formState.social_links.length > 0 ? (
                          formState.social_links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center bg-blue-50 px-3 py-1 rounded-full text-blue-800 text-sm font-medium mr-2 mb-2 hover:bg-blue-100 transition"
                            >
                              <span className="mr-2">{link.platform}:</span>
                              <span className="underline">{link.url}</span>
                            </a>
                          ))
                        ) : (
                          <span className="text-gray-500">No social links added yet.</span>
                        )}
                      </div>
                    )}
                  </div>
                      </div>

                {/* Skills Preview */}
                {formState.skills.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {formState.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {formState.languages && formState.languages.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {formState.languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                {formState.achievements && formState.achievements.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
                    <ul className="space-y-2">
                      {formState.achievements.map((achievement, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Experience</h3>
                {/* Experience Cards */}
                <div className="flex flex-col gap-4">
                  {formState.work_experience.length === 0 && !(isEditing) && (
                    <div className="text-center py-6 text-gray-400">
                      <FiBriefcase className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>No work experience added yet.</p>
                    </div>
                  )}
                  {formState.work_experience.map((work, index) => (
                    editingIndex === index && isEditing ? (
                      // Edit form for this card
                      <div key={index} className="bg-white border-2 border-dashed border-emerald-200 rounded-xl p-8 max-w-2xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-1">Company *</label>
                            <input type="text" value={newWorkExperience.company} onChange={e => setNewWorkExperience(prev => ({ ...prev, company: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base" placeholder="e.g., Google" />
                          </div>
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-1">Position *</label>
                            <input type="text" value={newWorkExperience.position} onChange={e => setNewWorkExperience(prev => ({ ...prev, position: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base" placeholder="e.g., Senior Software Engineer" />
                          </div>
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-1">Location</label>
                            <input type="text" value={newWorkExperience.location} onChange={e => setNewWorkExperience(prev => ({ ...prev, location: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base" placeholder="e.g., San Francisco, CA" />
                          </div>
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-1">Duration</label>
                            <div className="flex gap-2">
                              <input type="date" value={newWorkExperience.start_date} onChange={e => setNewWorkExperience(prev => ({ ...prev, start_date: e.target.value }))} className="w-1/2 p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base" />
                              <input type="date" value={newWorkExperience.end_date} onChange={e => setNewWorkExperience(prev => ({ ...prev, end_date: e.target.value }))} disabled={newWorkExperience.current} className="w-1/2 p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base disabled:bg-gray-100" />
                            </div>
                            <label className="flex items-center mt-1 text-xs">
                              <input type="checkbox" checked={newWorkExperience.current} onChange={e => setNewWorkExperience(prev => ({ ...prev, current: e.target.checked }))} className="mr-1" />
                              Currently working here
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="block text-base font-medium text-gray-700 mb-1">Description</label>
                          <textarea value={newWorkExperience.description} onChange={e => setNewWorkExperience(prev => ({ ...prev, description: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base resize-none" rows={4} placeholder="Describe your role and responsibilities..." />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={handleCancelWorkExperience} className="px-6 py-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-base">Cancel</button>
                          <button onClick={handleSaveWorkExperience} disabled={!newWorkExperience.company.trim() || !newWorkExperience.position.trim()} className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 text-white font-semibold text-base shadow-lg disabled:opacity-50">Save</button>
                        </div>
                      </div>
                    ) : (
                      // Card view
                      <div key={index} className="flex items-center justify-between bg-white border-2 border-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 rounded-2xl shadow-md px-6 py-5 min-h-[110px]">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-700 text-lg">{work.position}</span>
                            <span className="text-gray-500">@</span>
                            <span className="font-medium text-blue-700 text-base">{work.company}</span>
                          </div>
                          <div className="text-xs text-gray-500 flex gap-2 mt-1">
                            <span>{work.location}</span>
                            <span>•</span>
                            <span>{work.start_date} - {work.current ? 'Present' : work.end_date}</span>
                          </div>
                          {work.description && (
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">{work.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button onClick={() => handleEditWorkExperience(index)} className="p-1 rounded hover:bg-emerald-50 text-emerald-600"><FiEdit2 /></button>
                          <button onClick={() => removeWorkExperience(index)} className="p-1 rounded hover:bg-red-50 text-red-500"><FiTrash2 /></button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
                {/* Add Form (only if not editing) */}
                {isEditing && editingIndex === null && (
                  <div className="bg-white border-2 border-dashed border-emerald-200 rounded-xl p-8 max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Company *</label>
                        <input type="text" value={newWorkExperience.company} onChange={e => setNewWorkExperience(prev => ({ ...prev, company: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base" placeholder="e.g., Google" />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Position *</label>
                        <input type="text" value={newWorkExperience.position} onChange={e => setNewWorkExperience(prev => ({ ...prev, position: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base" placeholder="e.g., Senior Software Engineer" />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Location</label>
                        <input type="text" value={newWorkExperience.location} onChange={e => setNewWorkExperience(prev => ({ ...prev, location: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base" placeholder="e.g., San Francisco, CA" />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Duration</label>
                        <div className="flex gap-2">
                          <input type="date" value={newWorkExperience.start_date} onChange={e => setNewWorkExperience(prev => ({ ...prev, start_date: e.target.value }))} className="w-1/2 p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base" />
                          <input type="date" value={newWorkExperience.end_date} onChange={e => setNewWorkExperience(prev => ({ ...prev, end_date: e.target.value }))} disabled={newWorkExperience.current} className="w-1/2 p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base disabled:bg-gray-100" />
                        </div>
                        <label className="flex items-center mt-1 text-xs">
                          <input type="checkbox" checked={newWorkExperience.current} onChange={e => setNewWorkExperience(prev => ({ ...prev, current: e.target.checked }))} className="mr-1" />
                          Currently working here
                        </label>
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="block text-base font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={newWorkExperience.description} onChange={e => setNewWorkExperience(prev => ({ ...prev, description: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-emerald-400 focus:border-emerald-400 text-base resize-none" rows={4} placeholder="Describe your role and responsibilities..." />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={handleCancelWorkExperience} className="px-6 py-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-base">Cancel</button>
                      <button onClick={handleSaveWorkExperience} disabled={!newWorkExperience.company.trim() || !newWorkExperience.position.trim()} className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 text-white font-semibold text-base shadow-lg disabled:opacity-50">Save</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Education</h3>
                {/* Education Cards */}
                <div className="flex flex-col gap-4">
                  {formState.education.length === 0 && !(isEditing) && (
                    <div className="text-center py-6 text-gray-400">
                      <FiBookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>No education information added yet.</p>
                    </div>
                  )}
                  {formState.education.map((edu, index) => (
                    editingEducationIndex === index && isEditing ? (
                      // Edit form for this card
                      <div key={index} className="bg-white border-2 border-dashed border-blue-200 rounded-xl p-8 max-w-2xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-1">Degree *</label>
                            <input type="text" value={newEducation.degree} onChange={e => setNewEducation(prev => ({ ...prev, degree: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400 text-base" placeholder="e.g., B.Sc" />
                          </div>
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-1">Institution *</label>
                            <input type="text" value={newEducation.institution} onChange={e => setNewEducation(prev => ({ ...prev, institution: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400 text-base" placeholder="e.g., Stanford" />
                          </div>
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-1">Field</label>
                            <input type="text" value={newEducation.field} onChange={e => setNewEducation(prev => ({ ...prev, field: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400 text-base" placeholder="e.g., Computer Science" />
                          </div>
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-1">Year</label>
                            <input type="text" value={newEducation.year} onChange={e => setNewEducation(prev => ({ ...prev, year: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400 text-base" placeholder="e.g., 2022" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={handleCancelEducation} className="px-6 py-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-base">Cancel</button>
                          <button onClick={handleSaveEducation} disabled={!newEducation.degree.trim() || !newEducation.institution.trim()} className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 text-white font-semibold text-base shadow-lg disabled:opacity-50">Save</button>
                        </div>
                      </div>
                    ) : (
                      // Card view
                      <div key={index} className="flex items-center justify-between bg-white border-2 border-gradient-to-r from-blue-400 via-blue-500 to-purple-600 rounded-2xl shadow-md px-6 py-5 min-h-[90px]">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-700 text-lg">{edu.degree}</span>
                            <span className="text-gray-500">@</span>
                            <span className="font-medium text-purple-700 text-base">{edu.institution}</span>
                          </div>
                          <div className="text-xs text-gray-500 flex gap-2 mt-1">
                            <span>{edu.field}</span>
                            <span>•</span>
                            <span>{edu.year}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button onClick={() => handleEditEducation(index)} className="p-1 rounded hover:bg-blue-50 text-blue-600"><FiEdit2 /></button>
                          <button onClick={() => removeEducation(index)} className="p-1 rounded hover:bg-red-50 text-red-500"><FiTrash2 /></button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
                {/* Add Form (only if not editing) */}
                {isEditing && editingEducationIndex === null && (
                  <div className="bg-white border-2 border-dashed border-blue-200 rounded-xl p-8 max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Degree *</label>
                        <input type="text" value={newEducation.degree} onChange={e => setNewEducation(prev => ({ ...prev, degree: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400 text-base" placeholder="e.g., B.Sc" />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Institution *</label>
                        <input type="text" value={newEducation.institution} onChange={e => setNewEducation(prev => ({ ...prev, institution: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400 text-base" placeholder="e.g., Stanford" />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Field</label>
                        <input type="text" value={newEducation.field} onChange={e => setNewEducation(prev => ({ ...prev, field: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400 text-base" placeholder="e.g., Computer Science" />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Year</label>
                        <input type="text" value={newEducation.year} onChange={e => setNewEducation(prev => ({ ...prev, year: e.target.value }))} className="w-full p-4 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400 text-base" placeholder="e.g., 2022" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={handleCancelEducation} className="px-6 py-2 rounded bg-gray-100 text-gray-600">Cancel</button>
                      <button onClick={handleSaveEducation} disabled={!newEducation.degree.trim() || !newEducation.institution.trim()} className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 text-white">Save</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formState.skills.map((skill, index) => (
                    <span key={index} className="flex items-center px-3 py-1 bg-gradient-to-r from-emerald-100 via-blue-100 to-purple-100 text-emerald-800 rounded-full text-sm font-medium shadow-sm">
                      {skill.name}
                      <button onClick={() => handleRemoveSkill(index)} className="ml-2 text-emerald-600 hover:text-emerald-800">
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    placeholder="Add a skill (e.g., Java, Excel)"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    onKeyPress={e => e.key === 'Enter' && handleAddSkill()}
                  />
                  <button
                    onClick={handleAddSkill}
                    className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Certificates & Projects</h3>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button onClick={handleAddCert} className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center">
                        <FiPlus className="w-4 h-4 mr-2" /> Add Certificate
                      </button>
                      <button onClick={handleAddProject} className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center">
                        <FiPlus className="w-4 h-4 mr-2" /> Add Project
                      </button>
                    </div>
                  )}
                </div>
                {/* Certificates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formState.certifications.length === 0 && (
                    <div className="text-center py-8 text-gray-500 col-span-2">
                      <FiAward className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No certificates added yet.</p>
                    </div>
                  )}
                  {(formState.certifications || []).map((cert, idx) => (
                    <div key={idx} className="bg-white border-2 border-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 rounded-2xl shadow-md p-6 flex flex-col gap-2">
                      {cert.photo_url && <img src={cert.photo_url} alt={cert.name} className="h-32 object-contain mb-2 rounded-lg border" />}
                      <div className="font-semibold text-lg text-emerald-700">{cert.name}</div>
                      <div className="text-gray-600">{cert.issuer}</div>
                      <div className="text-gray-500 text-sm">{cert.date}</div>
                      {cert.certificate_url && (
                        <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Certificate</a>
                      )}
                      {isEditing && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleEditCert(idx)} className="px-3 py-1 rounded bg-emerald-100 text-emerald-700">Edit</button>
                          <button onClick={() => handleRemoveCert(idx)} className="px-3 py-1 rounded bg-red-100 text-red-600">Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Projects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formState.projects.length === 0 && (
                    <div className="text-center py-8 text-gray-500 col-span-2">
                      <FiGithub className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No projects added yet.</p>
                    </div>
                  )}
                  {(formState.projects || []).map((proj, idx) => (
                    <div key={idx} className="bg-white border-2 border-gradient-to-r from-blue-400 via-blue-500 to-purple-600 rounded-2xl shadow-md p-6 flex flex-col gap-2">
                      <div className="font-semibold text-lg text-blue-700">{proj.name}</div>
                      <div className="text-gray-600">{proj.description}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {proj.technologies.map((tech, i) => (
                          <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">{tech}</span>
                        ))}
                      </div>
                      {proj.url && (
                        <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Project Link</a>
                      )}
                      {proj.github && (
                        <a href={proj.github} target="_blank" rel="noopener noreferrer" className="text-gray-800 underline">GitHub</a>
                      )}
                      {isEditing && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleEditProject(idx)} className="px-3 py-1 rounded bg-blue-100 text-blue-700">Edit</button>
                          <button onClick={() => handleRemoveProject(idx)} className="px-3 py-1 rounded bg-red-100 text-red-600">Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Certificate Modal */}
                {showCertModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-lg">
                      <h3 className="text-xl font-semibold mb-4">{editingCertIndex !== null ? 'Edit Certificate' : 'Add Certificate'}</h3>
                      <div className="space-y-3">
                        <input type="text" placeholder="Certificate Name" value={newCert.name} onChange={e => setNewCert(prev => ({ ...prev, name: e.target.value }))} className="w-full p-3 border rounded" />
                        <input type="text" placeholder="Issuer" value={newCert.issuer} onChange={e => setNewCert(prev => ({ ...prev, issuer: e.target.value }))} className="w-full p-3 border rounded" />
                        <input type="date" placeholder="Date" value={newCert.date} onChange={e => setNewCert(prev => ({ ...prev, date: e.target.value }))} className="w-full p-3 border rounded" />
                        <input type="url" placeholder="Certificate Link (optional)" value={newCert.certificate_url} onChange={e => setNewCert(prev => ({ ...prev, certificate_url: e.target.value }))} className="w-full p-3 border rounded" />
                        <input type="file" accept="image/*" onChange={e => setCertImageFile(e.target.files?.[0] || null)} className="w-full" />
                        {newCert.photo_url && <img src={newCert.photo_url} alt="Certificate" className="h-24 mt-2 rounded" />}
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setShowCertModal(false)} className="px-4 py-2 rounded bg-gray-100 text-gray-600">Cancel</button>
                        <button onClick={handleSaveCert} className="px-4 py-2 rounded bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 text-white">Save</button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Project Modal */}
                {showProjectModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-lg">
                      <h3 className="text-xl font-semibold mb-4">{editingProjectIndex !== null ? 'Edit Project' : 'Add Project'}</h3>
                      <div className="space-y-3">
                        <input type="text" placeholder="Project Name" value={newProject.name} onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))} className="w-full p-3 border rounded" />
                        <textarea placeholder="Description" value={newProject.description} onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))} className="w-full p-3 border rounded" />
                        <input type="url" placeholder="Project Link" value={newProject.url} onChange={e => setNewProject(prev => ({ ...prev, url: e.target.value }))} className="w-full p-3 border rounded" />
                        <input type="url" placeholder="GitHub Link" value={newProject.github} onChange={e => setNewProject(prev => ({ ...prev, github: e.target.value }))} className="w-full p-3 border rounded" />
                        <div className="flex gap-2 items-center">
                          <input type="text" placeholder="Add Technology" value={newProjectTech} onChange={e => setNewProjectTech(e.target.value)} className="flex-1 p-3 border rounded" />
                          <button onClick={handleAddProjectTech} className="px-3 py-2 rounded bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 text-white">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {newProject.technologies.map((tech, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center">
                              {tech}
                              <button onClick={() => handleRemoveProjectTech(idx)} className="ml-1 text-blue-700 hover:text-blue-900">&times;</button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setShowProjectModal(false)} className="px-4 py-2 rounded bg-gray-100 text-gray-600">Cancel</button>
                        <button onClick={handleSaveProject} className="px-4 py-2 rounded bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 text-white">Save</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
            </div>
        </div>
    </div>
  );
};

export default JobseekerProfile; 
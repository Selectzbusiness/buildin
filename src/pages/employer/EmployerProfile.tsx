import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { FaCamera, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface CompanyInfo {
  name: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  description: string;
  founded_year: string;
  company_type: string;
  social_links: string;
  culture: string;
  benefits: string;
  bio: string;
  logo_url: string;
}

interface PersonalInfo {
  fullName: string;
  position: string;
  email: string;
  phone: string;
  linkedin: string;
  department: string;
  alternate_contact: string;
}

const EmployerProfile: React.FC = () => {
  const { user, profile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'company' | 'personal'>('company');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    industry: '',
    size: '',
    location: '',
    website: '',
    description: '',
    founded_year: '',
    company_type: '',
    social_links: '',
    culture: '',
    benefits: '',
    bio: '',
    logo_url: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: profile?.full_name || '',
    position: '',
    email: user?.email || '',
    phone: '',
    linkedin: '',
    department: '',
    alternate_contact: '',
  });
  const navigate = useNavigate();
  const [editCompany, setEditCompany] = useState(false);
  const [editPersonal, setEditPersonal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchCompanyProfile();
    }
  }, [user]);

  const fetchCompanyProfile = async () => {
    try {
      console.log('Fetching company profile for user:', user?.id);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('auth_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching company profile:', error);
        throw error;
      }

      console.log('Company profile data:', data);

      if (data) {
        setCompanyInfo({
          name: data.name || '',
          industry: data.industry || '',
          size: data.size || '',
          location: data.location || '',
          website: data.website || '',
          description: data.description || '',
          founded_year: data.founded_year || '',
          company_type: data.company_type || '',
          social_links: data.social_links ? JSON.stringify(data.social_links) : '',
          culture: data.culture || '',
          benefits: data.benefits || '',
          bio: data.bio || '',
          logo_url: data.logo_url || '',
        });
      }
      setEditCompany(false);
      setEditPersonal(false);
    } catch (err) {
      console.error('Error in fetchCompanyProfile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch company profile');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setCompanyInfo((prev) => ({ ...prev, logo_url: '' }));
  };

  const uploadLogoToSupabase = async (file: File) => {
    if (!user?.id || !file) return '';
    console.log('Uploading file:', file);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, { upsert: true });
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      setError(`Logo upload failed: ${uploadError.message || 'Unknown error'}`);
      throw uploadError;
    }
    const { data } = supabase.storage.from('company-logos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user?.id) {
        throw new Error('User not found');
      }

      console.log('Current user ID:', user.id);

      let websiteUrl = companyInfo.website;
      if (websiteUrl && !websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        websiteUrl = `https://${websiteUrl}`;
      }

      let logoUrl = companyInfo.logo_url;
      if (logoFile) {
        try {
          logoUrl = await uploadLogoToSupabase(logoFile);
        } catch (uploadError: any) {
          setError(`Logo upload failed: ${uploadError.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
      }

      const companyData = {
        auth_id: user.id,
        name: companyInfo.name,
        industry: companyInfo.industry,
        size: companyInfo.size,
        location: companyInfo.location,
        website: websiteUrl,
        description: companyInfo.description,
        founded_year: companyInfo.founded_year ? parseInt(companyInfo.founded_year, 10) : null,
        company_type: companyInfo.company_type,
        social_links: companyInfo.social_links ? JSON.parse(companyInfo.social_links) : null,
        culture: companyInfo.culture,
        benefits: companyInfo.benefits,
        bio: companyInfo.bio,
        logo_url: logoUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Attempting to save company data:', companyData);

      // First check if company exists
      const { data: existingCompany, error: checkError } = await supabase
        .from('companies')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      console.log('Existing company check:', { existingCompany, checkError });

      if (checkError) {
        console.error('Error checking existing company:', checkError);
        throw checkError;
      }

      let result;
      if (existingCompany) {
        // Update existing company
        result = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', existingCompany.id)
          .select();
      } else {
        // Create new company
        result = await supabase
          .from('companies')
          .insert([companyData])
          .select();
      }

      console.log('Save result:', result);

      if (result.error) {
        setError(result.error.message || 'Failed to update company profile');
        setLoading(false);
        return;
      }

      if (!result.data || result.data.length === 0) {
        setError('Failed to save company data - no data returned');
        setLoading(false);
        return;
      }

      setSuccess('Company profile updated successfully!');
      setEditCompany(false);
      setTimeout(() => {
        setSuccess(null);
        navigate('/employer/dashboard');
      }, 3000);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalSave = (e: React.FormEvent) => {
    e.preventDefault();
    setEditPersonal(false);
    setSuccess('Personal info updated successfully!');
    setTimeout(() => setSuccess(null), 4000);
  };

  const handleTabSwitch = (tab: 'company' | 'personal') => {
    setActiveTab(tab);
    setEditCompany(false);
    setEditPersonal(false);
  };

  // Helper: Render company info in view mode
  const renderCompanyView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2 flex flex-col items-center mb-6">
        <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-[#00c6fb] to-[#005bea] flex items-center justify-center shadow-lg border-4 border-white">
          {companyInfo.logo_url ? (
            <img src={companyInfo.logo_url} alt="Company Logo" className="h-full w-full object-cover rounded-full" />
          ) : (
            <FaCamera className="text-5xl text-gray-300" />
          )}
        </div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Company Name</span>
        <div className="font-bold text-xl text-[#185a9d]">{companyInfo.name || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Industry</span>
        <div className="text-gray-900">{companyInfo.industry || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Company Type</span>
        <div className="text-gray-900">{companyInfo.company_type || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Founded Year</span>
        <div className="text-gray-900">{companyInfo.founded_year || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Size</span>
        <div className="text-gray-900">{companyInfo.size || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Location</span>
        <div className="text-gray-900">{companyInfo.location || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Website</span>
        <div className="text-[#185a9d] underline hover:text-[#00c6fb] transition">{companyInfo.website || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div className="md:col-span-2">
        <span className="block text-xs text-gray-500 font-medium mb-1">Social Links</span>
        <div className="flex flex-wrap gap-2">
          {companyInfo.social_links && Array.isArray(JSON.parse(companyInfo.social_links)) ? (
            JSON.parse(companyInfo.social_links).map((link: any, idx: number) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#185a9d] hover:text-[#00c6fb] hover:underline text-sm bg-blue-50 px-2 py-1 rounded transition">
                {link.platform}
              </a>
            ))
          ) : <span className="text-gray-400">Not set</span>}
        </div>
      </div>
      <div className="md:col-span-2">
        <span className="block text-xs text-gray-500 font-medium mb-1">Description</span>
        <div className="text-gray-600 whitespace-pre-line">{companyInfo.description || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div className="md:col-span-2">
        <span className="block text-xs text-gray-500 font-medium mb-1">Culture</span>
        <div className="text-gray-600 whitespace-pre-line">{companyInfo.culture || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div className="md:col-span-2">
        <span className="block text-xs text-gray-500 font-medium mb-1">Benefits</span>
        <div className="text-gray-600 whitespace-pre-line">{companyInfo.benefits || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div className="md:col-span-2">
        <span className="block text-xs text-gray-500 font-medium mb-1">Bio</span>
        <div className="text-gray-600 whitespace-pre-line">{companyInfo.bio || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div className="md:col-span-2 flex justify-end mt-4">
        <button type="button" onClick={() => setEditCompany(true)} className="px-6 py-3 bg-gradient-to-r from-[#185a9d] to-[#00c6fb] text-white rounded-xl shadow-lg hover:from-[#00c6fb] hover:to-[#185a9d] transition">Edit</button>
      </div>
    </div>
  );

  const renderPersonalView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Full Name</span>
        <div className="font-bold text-xl text-[#185a9d]">{personalInfo.fullName || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Position</span>
        <div className="text-gray-900">{personalInfo.position || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Email</span>
        <div className="text-gray-900">{personalInfo.email || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Phone</span>
        <div className="text-gray-900">{personalInfo.phone || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">LinkedIn</span>
        <div className="text-[#185a9d] underline hover:text-[#00c6fb] transition">{personalInfo.linkedin || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Department</span>
        <div className="text-gray-900">{personalInfo.department || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div>
        <span className="block text-xs text-gray-500 font-medium mb-1">Alternate Contact</span>
        <div className="text-gray-900">{personalInfo.alternate_contact || <span className="text-gray-400">Not set</span>}</div>
      </div>
      <div className="md:col-span-2 flex justify-end mt-4">
        <button type="button" onClick={() => setEditPersonal(true)} className="px-6 py-3 bg-gradient-to-r from-[#185a9d] to-[#00c6fb] text-white rounded-xl shadow-lg hover:from-[#00c6fb] hover:to-[#185a9d] transition">Edit</button>
      </div>
    </div>
  );

  const renderPersonalEdit = () => (
    <form onSubmit={handlePersonalSave} className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input type="text" id="fullName" value={personalInfo.fullName} onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter your full name" />
      </div>
      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
        <input type="text" id="position" value={personalInfo.position} onChange={(e) => setPersonalInfo({ ...personalInfo, position: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter your position" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" id="email" value={personalInfo.email} onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter your email" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input type="tel" id="phone" value={personalInfo.phone} onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter your phone number" />
      </div>
      <div>
        <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
        <input type="url" id="linkedin" value={personalInfo.linkedin} onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter your LinkedIn profile URL" />
      </div>
      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
        <input type="text" id="department" value={personalInfo.department} onChange={(e) => setPersonalInfo({ ...personalInfo, department: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter your department" />
      </div>
      <div>
        <label htmlFor="alternate_contact" className="block text-sm font-medium text-gray-700 mb-1">Alternate Contact</label>
        <input type="text" id="alternate_contact" value={personalInfo.alternate_contact} onChange={(e) => setPersonalInfo({ ...personalInfo, alternate_contact: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter alternate contact info" />
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={() => setEditPersonal(false)} className="mr-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl">Cancel</button>
        <button type="submit" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl">Save Changes</button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-6">Company Profile</h1>

            {/* Tabs */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => handleTabSwitch('company')}
                    className={`${
                      activeTab === 'company'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Company Information
                  </button>
                  <button
                    onClick={() => handleTabSwitch('personal')}
                    className={`${
                      activeTab === 'personal'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Personal Information
                  </button>
                </nav>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm">
                {success}
              </div>
            )}

            {activeTab === 'company' ? (
              editCompany ? (
            <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Logo Upload */}
                  <div className="md:col-span-2 flex flex-col items-center mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo (optional)</label>
                    <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-[#00c6fb] to-[#005bea] flex items-center justify-center shadow-lg border-2 border-white">
                      {logoPreview || companyInfo.logo_url ? (
                        <img src={logoPreview || companyInfo.logo_url} alt="Company Logo" className="h-full w-full object-cover rounded-full" />
                      ) : (
                        <FaCamera className="text-4xl text-gray-300" />
                      )}
                      {(logoPreview || companyInfo.logo_url) && (
                        <button type="button" onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-red-100">
                          <FaTrash className="text-red-500 text-xs" />
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>
                  {/* Company Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input type="text" id="name" required value={companyInfo.name} onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter company name" />
                  </div>
                  {/* Industry */}
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select id="industry" value={companyInfo.industry} onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400">
                      <option value="">Select industry</option>
                      <option value="technology">Technology</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {/* Company Type */}
                  <div>
                    <label htmlFor="company_type" className="block text-sm font-medium text-gray-700 mb-1">Company Type</label>
                    <input type="text" id="company_type" value={companyInfo.company_type} onChange={(e) => setCompanyInfo({ ...companyInfo, company_type: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="e.g. Private, Public, Startup" />
                  </div>
                  {/* Founded Year */}
                  <div>
                    <label htmlFor="founded_year" className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
                    <input type="number" id="founded_year" value={companyInfo.founded_year} onChange={(e) => setCompanyInfo({ ...companyInfo, founded_year: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="e.g. 2015" />
                  </div>
                  {/* Size */}
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                    <select id="size" value={companyInfo.size} onChange={(e) => setCompanyInfo({ ...companyInfo, size: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400">
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" id="location" value={companyInfo.location} onChange={(e) => setCompanyInfo({ ...companyInfo, location: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter location" />
                  </div>
                  {/* Website */}
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input type="url" id="website" value={companyInfo.website} onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter website URL" />
                  </div>
                  {/* Social Links */}
                  <div className="md:col-span-2">
                    <label htmlFor="social_links" className="block text-sm font-medium text-gray-700 mb-1">Social Links (JSON array)</label>
                    <input type="text" id="social_links" value={companyInfo.social_links} onChange={(e) => setCompanyInfo({ ...companyInfo, social_links: e.target.value })} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder='e.g. [{"platform":"LinkedIn","url":"https://..."}]' />
                  </div>
                  {/* Description */}
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                    <textarea id="description" value={companyInfo.description} onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })} rows={3} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter company description" />
                  </div>
                  {/* Culture */}
                  <div className="md:col-span-2">
                    <label htmlFor="culture" className="block text-sm font-medium text-gray-700 mb-1">Company Culture</label>
                    <textarea id="culture" value={companyInfo.culture} onChange={(e) => setCompanyInfo({ ...companyInfo, culture: e.target.value })} rows={2} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Describe your company culture" />
                  </div>
                  {/* Benefits */}
                  <div className="md:col-span-2">
                    <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                    <textarea id="benefits" value={companyInfo.benefits} onChange={(e) => setCompanyInfo({ ...companyInfo, benefits: e.target.value })} rows={2} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="List company benefits" />
                  </div>
                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Company Bio</label>
                    <textarea id="bio" value={companyInfo.bio} onChange={(e) => setCompanyInfo({ ...companyInfo, bio: e.target.value })} rows={2} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Write a short bio about your company" />
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setEditCompany(false)} className="mr-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl">Cancel</button>
                    <button type="submit" disabled={loading} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl">{loading ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </form>
              ) : (
                renderCompanyView()
              )
            ) : (
              editPersonal ? (
                renderPersonalEdit()
              ) : (
                renderPersonalView()
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerProfile; 
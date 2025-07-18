import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { FaCamera, FaTrash, FaPlus, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface CompanyInfo {
  id?: string;
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

const deepOceanBlue = 'from-[#185a9d] to-[#00c6fb]';

const defaultCompany: CompanyInfo = {
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
};

const EmployerProfile: React.FC = () => {
  const { user, profile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'company' | 'personal'>('company');
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [editCompany, setEditCompany] = useState(false);
  const [addCompany, setAddCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState<CompanyInfo>(defaultCompany);
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
  const [editPersonal, setEditPersonal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchCompanies();
    }
  }, [user]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      // Fetch all company_ids for this user from employer_companies
      const { data: links, error: linkError } = await supabase
        .from('employer_companies')
        .select('company_id')
        .eq('user_id', user?.id);
      if (linkError) throw linkError;
      const companyIds = (links || []).map((l: any) => l.company_id);
      let companiesData: CompanyInfo[] = [];
      if (companyIds.length > 0) {
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds)
          .order('created_at', { ascending: true });
        if (companiesError) throw companiesError;
        companiesData = companies || [];
      }
      setCompanies(companiesData);
      if (companiesData.length === 1) {
        setSelectedCompany(companiesData[0]);
      } else {
        setSelectedCompany(null);
      }
    } catch (err) {
      setError('Failed to fetch companies');
    } finally {
      setLoading(false);
      setEditCompany(false);
      setAddCompany(false);
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
    setCompanyForm((prev) => ({ ...prev, logo_url: '' }));
  };

  const uploadLogoToSupabase = async (file: File) => {
    if (!user?.id || !file) return '';
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('company-logos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanyFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let logoUrl = companyForm.logo_url;
      if (logoFile) {
        logoUrl = await uploadLogoToSupabase(logoFile);
      }
      const companyData = {
        ...companyForm,
        logo_url: logoUrl,
        founded_year: companyForm.founded_year ? parseInt(companyForm.founded_year, 10) : null,
        social_links: companyForm.social_links ? JSON.parse(companyForm.social_links) : null,
        updated_at: new Date().toISOString(),
      };
      let result;
      let newCompanyId = companyForm.id;
      if (editCompany && companyForm.id) {
        result = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', companyForm.id)
          .select();
      } else {
        // Insert company
        const insertResult = await supabase
          .from('companies')
          .insert([{ ...companyData }])
          .select();
        if (insertResult.error) throw insertResult.error;
        newCompanyId = insertResult.data[0].id;
        // Link this company to the user in employer_companies
        const linkResult = await supabase
          .from('employer_companies')
          .insert([{ user_id: user?.id, company_id: newCompanyId }]);
        if (linkResult.error) throw linkResult.error;
        result = insertResult;
      }
      if (result.error) throw result.error;
      setSuccess('Company saved successfully!');
      fetchCompanies();
    } catch (err: any) {
      setError(err.message || 'Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = (company: CompanyInfo) => {
    setCompanyForm({ ...company, social_links: company.social_links ? JSON.stringify(company.social_links) : '' });
    setLogoPreview(company.logo_url || '');
    setLogoFile(null);
    setEditCompany(true);
    setAddCompany(false);
  };

  const handleAddCompany = () => {
    setCompanyForm(defaultCompany);
    setLogoPreview('');
    setLogoFile(null);
    setAddCompany(true);
    setEditCompany(false);
  };

  const handleCancelCompanyForm = () => {
    setEditCompany(false);
    setAddCompany(false);
    setCompanyForm(defaultCompany);
    setLogoPreview('');
    setLogoFile(null);
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

            {activeTab === 'company' && !editCompany && !addCompany && (
              <>
                {companies.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No company profile found.</p>
                    <button onClick={handleAddCompany} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#185a9d] to-[#00c6fb] text-white rounded-xl shadow-lg hover:from-[#00c6fb] hover:to-[#185a9d] transition font-semibold"><FaPlus className="mr-2" /> Add Company</button>
                  </div>
                )}
                {companies.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Your Companies</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {companies.map((company) => (
                        <div key={company.id} className="bg-gray-50 rounded-xl p-6 shadow border border-gray-100 flex flex-col">
                          {renderCompanyView(company, false)}
                          <button onClick={() => handleEditCompany(company)} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#185a9d] to-[#00c6fb] text-white rounded-lg flex items-center justify-center"><FaEdit className="mr-2" /> Edit</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-6">
                      <button onClick={handleAddCompany} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#185a9d] to-[#00c6fb] text-white rounded-xl shadow-lg hover:from-[#00c6fb] hover:to-[#185a9d] transition font-semibold"><FaPlus className="mr-2" /> Add Company</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {activeTab === 'company' && (editCompany || addCompany) && (
              <form onSubmit={handleCompanyFormSubmit} className="space-y-6">
                <div className="md:col-span-2 flex flex-col items-center mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo (optional)</label>
                  <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-[#00c6fb] to-[#185a9d] flex items-center justify-center shadow-lg border-2 border-white">
                    {logoPreview || companyForm.logo_url ? (
                      <img src={logoPreview || companyForm.logo_url} alt="Company Logo" className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <FaCamera className="text-4xl text-gray-300" />
                    )}
                    {(logoPreview || companyForm.logo_url) && (
                      <button type="button" onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-red-100"><FaTrash className="text-red-500 text-xs" /></button>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input type="text" id="name" name="name" required value={companyForm.name} onChange={handleCompanyFormChange} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter company name" />
                  </div>
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select id="industry" name="industry" value={companyForm.industry} onChange={handleCompanyFormChange} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400">
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
                  <div>
                    <label htmlFor="company_type" className="block text-sm font-medium text-gray-700 mb-1">Company Type</label>
                    <input type="text" id="company_type" name="company_type" value={companyForm.company_type} onChange={handleCompanyFormChange} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="e.g. Private, Public, Startup" />
                  </div>
                  <div>
                    <label htmlFor="founded_year" className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
                    <input type="number" id="founded_year" name="founded_year" value={companyForm.founded_year} onChange={handleCompanyFormChange} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="e.g. 2015" />
                  </div>
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                    <select id="size" name="size" value={companyForm.size} onChange={handleCompanyFormChange} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400">
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" id="location" name="location" value={companyForm.location} onChange={handleCompanyFormChange} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter location" />
                  </div>
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input type="url" id="website" name="website" value={companyForm.website} onChange={handleCompanyFormChange} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter website URL" />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="social_links" className="block text-sm font-medium text-gray-700 mb-1">Social Links (JSON array)</label>
                    <input type="text" id="social_links" name="social_links" value={companyForm.social_links} onChange={handleCompanyFormChange} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder='e.g. [{"platform":"LinkedIn","url":"https://..."}]' />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                    <textarea id="description" name="description" value={companyForm.description} onChange={handleCompanyFormChange} rows={3} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Enter company description" />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="culture" className="block text-sm font-medium text-gray-700 mb-1">Company Culture</label>
                    <textarea id="culture" name="culture" value={companyForm.culture} onChange={handleCompanyFormChange} rows={2} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Describe your company culture" />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                    <textarea id="benefits" name="benefits" value={companyForm.benefits} onChange={handleCompanyFormChange} rows={2} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="List company benefits" />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Company Bio</label>
                    <textarea id="bio" name="bio" value={companyForm.bio} onChange={handleCompanyFormChange} rows={2} className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-[#185a9d] focus:ring-[#185a9d] text-base transition-colors duration-200 bg-white hover:border-gray-400" placeholder="Write a short bio about your company" />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button type="button" onClick={handleCancelCompanyForm} className="mr-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl">Cancel</button>
                  <button type="submit" disabled={loading} className="px-6 py-3 bg-gradient-to-r from-[#185a9d] to-[#00c6fb] text-white rounded-xl">{loading ? 'Saving...' : 'Save Company'}</button>
                </div>
              </form>
            )}
            {activeTab === 'personal' && (editPersonal ? renderPersonalEdit() : renderPersonalView())}
          </div>
        </div>
      </div>
    </div>
  );
};

function renderCompanyView(company: CompanyInfo, showEditBtn = true) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col items-center mb-4">
        <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[#00c6fb] to-[#185a9d] flex items-center justify-center shadow-lg border-4 border-white">
          {company.logo_url ? (
            <img src={company.logo_url} alt="Company Logo" className="h-full w-full object-cover rounded-full" />
          ) : (
            <FaCamera className="text-3xl text-gray-300" />
          )}
        </div>
      </div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Company Name</span><div className="font-bold text-lg text-[#185a9d]">{company.name || <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Industry</span><div className="text-gray-900">{company.industry || <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Company Type</span><div className="text-gray-900">{company.company_type || <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Founded Year</span><div className="text-gray-900">{company.founded_year || <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Size</span><div className="text-gray-900">{company.size || <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Location</span><div className="text-gray-900">{company.location || <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Website</span><div className="text-[#185a9d] underline hover:text-[#00c6fb] transition">{company.website || <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Social Links</span><div className="flex flex-wrap gap-2">{company.social_links && Array.isArray(JSON.parse(company.social_links)) ? (JSON.parse(company.social_links).map((link: any, idx: number) => (<a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#185a9d] hover:text-[#00c6fb] hover:underline text-sm bg-blue-50 px-2 py-1 rounded transition">{link.platform}</a>))) : <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Description</span><div className="text-gray-600 whitespace-pre-line">{company.description || <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Culture</span><div className="text-gray-600 whitespace-pre-line">{company.culture || <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Benefits</span><div className="text-gray-600 whitespace-pre-line">{company.benefits || <span className="text-gray-400">Not set</span>}</div></div>
      <div><span className="block text-xs text-gray-500 font-medium mb-1">Bio</span><div className="text-gray-600 whitespace-pre-line">{company.bio || <span className="text-gray-400">Not set</span>}</div></div>
    </div>
  );
}

export default EmployerProfile; 
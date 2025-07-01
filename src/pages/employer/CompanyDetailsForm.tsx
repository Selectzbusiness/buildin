import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

interface CompanyInfo {
  name: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  description: string;
}

const CompanyDetailsForm: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    industry: '',
    size: '',
    location: '',
    website: '',
    description: ''
  });

  useEffect(() => {
    checkCompanyProfile();
  }, [user]);

  const checkCompanyProfile = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking company profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Company profile exists, redirect to dashboard
        toast.success('Company profile found! Redirecting to dashboard...');
        navigate('/employer/dashboard');
        return;
      }

      // No company profile found, show the form
      setLoading(false);
    } catch (err) {
      console.error('Error in checkCompanyProfile:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!companyInfo.name.trim()) {
        setError('Company name is required');
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('companies')
        .insert([{
          auth_id: user?.id,
          name: companyInfo.name.trim(),
          industry: companyInfo.industry,
          size: companyInfo.size,
          location: companyInfo.location,
          website: companyInfo.website,
          description: companyInfo.description
        }]);

      if (insertError) {
        console.error('Error saving company profile:', insertError);
        setError('Failed to save company profile. Please try again.');
        setSaving(false);
        return;
      }

      toast.success('Company profile saved successfully!');
      navigate('/employer/dashboard');
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking company profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Company Profile</h1>
              <p className="text-gray-600">Please provide your company details to access employer features.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={companyInfo.name}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={companyInfo.industry}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400"
                  >
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
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size
                  </label>
                  <select
                    id="size"
                    name="size"
                    value={companyInfo.size}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400"
                  >
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
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={companyInfo.location}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400"
                    placeholder="Enter location"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={companyInfo.website}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400"
                    placeholder="Enter website URL"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={companyInfo.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base transition-colors duration-200 bg-white hover:border-gray-400"
                  placeholder="Enter company description"
                />
              </div>

              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-16 py-5 rounded-2xl font-bold text-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-2xl border-2 border-emerald-400 disabled:shadow-none"
                >
                  <div className="flex items-center space-x-3">
                    {saving ? (
                      <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>{saving ? 'Saving...' : 'Save Company Profile'}</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsForm; 
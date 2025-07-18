import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

import { FiBookmark, FiShare2, FiMapPin, FiBriefcase, FiClock, FiUsers, FiDollarSign, FiBookOpen, FiUserCheck } from 'react-icons/fi';
import JobCardNew from '../../components/JobCardNew';
import { useFavorites } from '../../contexts/FavoritesContext';
import ShareButton from '../../components/ShareButton';
import useIsMobile from '../../hooks/useIsMobile';

// Define the types for our data structures
interface Company {
  id: string;
  name: string;
  logo_url: string;
  description: string;
  auth_id: string;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  job_type: string | null;
  location: any | null; // JSONB
  pay_type: string | null;
  min_amount: number | null;
  max_amount: number | null;
  amount: number | null;
  pay_rate: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  company_id: string | null;
  requirements: string | null;
  experience_level: string | null;
  allow_candidate_contact: boolean | null;
  application_deadline: string | null;
  benefits: string[] | null;
  custom_benefit: string | null;
  custom_schedule: string | null;
  custom_supplemental_pay: string | null;
  employment_types: string[] | null;
  experience_type: string | null;
  gender: string | null;
  industries: string[] | null;
  job_profile_description: string | null;
  language_requirement: string | null;
  max_age: number | null;
  min_age: number | null;
  minimum_education: string | null;
  minimum_experience: number | null;
  notification_emails: string[] | null;
  number_of_hires: number | null;
  planned_start_date: string | null;
  recruitment_timeline: string | null;
  require_resume: boolean | null;
  schedules: string[] | null;
  send_individual_emails: boolean | null;
  skills: string[] | null;
  supplemental_pay: string[] | null;
  employer_org_id: string | null;
  resume_required: boolean;
  video_required: boolean;
  openings: number | null;
  applicants: number | null;
  companies: Company;
  application_type: string | null;
  application_link: string | null;
  disclaimer: string | null;
}

// Helper function to normalize requirements/responsibilities
function normalizeListField(field: any): string[] {
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    // Fallback: split by newlines or commas
    return field.split(/\n|,/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

// Helper for requirements
function parseRequirements(req: string | null | undefined): string[] {
  if (!req) return [];
  try {
    // Try to parse as JSON array
    const parsed = JSON.parse(req);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Fallback: split by newlines or commas
  return req.split(/\n|,/).map(s => s.trim()).filter(Boolean);
}

const JobDetails: React.FC = () => {
  const authContext = useContext(AuthContext);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  
  // Use the new favorites context
  const { isJobSaved, toggleJobFavorite } = useFavorites();
  const saved = isJobSaved(job?.id || '');
  const [saving, setSaving] = useState(false);

  // Add resumeRequired and videoRequired fields from job
  const resumeRequired = job?.resume_required ?? false;
  const videoRequired = job?.video_required ?? false;

  // Add more job info fields for demo (replace with real fields if available)
  const postedDate = job?.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently';
  const openings = job?.openings || 1;
  const applicants = job?.applicants || 0;
  const keySkills = job?.skills || ['Communication', 'Teamwork', 'Problem Solving'];

  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select(`
            *,
            companies:company_id(*)
          `)
          .eq('id', id)
          .single();
        if (jobError) throw jobError;
        setJob(jobData as Job);
        
        const profile = authContext.profile;
        if (profile && profile.roles?.includes('jobseeker')) {
          const { data: applicationData, error: applicationError } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', id)
            .eq('job_seeker_id', profile.id)
            .maybeSingle();
          if (applicationError) throw applicationError;
          setHasApplied(!!applicationData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id, authContext.profile]);

  useEffect(() => {
    const fetchSimilarJobs = async () => {
      if (!job) return;
      try {
        let query = supabase
          .from('jobs')
          .select('*, companies(*)')
          .eq('status', 'active')
          .neq('id', job.id);
        
        // Build OR filter for similar jobs
        const filters = [];
        if (job.job_type) filters.push(`job_type.eq.${job.job_type}`);
        if (filters.length > 0) {
          query = query.or(filters.join(','));
        }
        
        const { data, error } = await query.limit(6);
        if (error) throw error;
        setSimilarJobs(data || []);
      } catch (err) {
        console.error('Error fetching similar jobs:', err);
        setSimilarJobs([]);
      }
    };
    fetchSimilarJobs();
  }, [job]);

  const handleApply = () => {
    if (job?.application_type === 'external_link' && job.application_link) {
      window.open(job.application_link, '_blank');
    } else {
      navigate(`/jobs/${id}/apply`);
    }
  };



  const handleSave = async () => {
    if (!job) return;
    setSaving(true);
    try {
      await toggleJobFavorite(job.id);
    } catch (error) {
      console.error('Error toggling job favorite:', error);
    } finally {
      setSaving(false);
    }
  };

  // Add this function to allow re-applying after withdrawal
  const handleWithdrawnExternally = () => {
    setHasApplied(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  if (!job) {
    return <div className="text-center py-10">Job not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {isMobile ? (
        <>
          {/* Mobile Card - Title, Company, then Buttons, then sections in requested order */}
          <div className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-3xl shadow-2xl p-5 mt-6 mb-10 border border-[#185a9d]">
            {/* Job Title, Company, Logo */}
            <div className="flex flex-col items-center gap-2 mb-5">
              <div className="w-20 h-20 rounded-2xl border-4 border-[#185a9d] shadow-lg bg-white flex items-center justify-center mb-3">
                <img src={job.companies?.logo_url || '/placeholder-logo.svg'} alt="Company Logo" className="w-16 h-16 object-cover rounded-xl" />
              </div>
              <div className="text-center">
                <div className="font-extrabold text-lg text-black drop-shadow-sm mb-2 tracking-wide">{job.title}</div>
                <div className="text-xs text-gray-700 font-semibold mb-2">{job.companies?.name}</div>
              </div>
            </div>
            {/* Buttons: Apply, Save, Share */}
            <div className="flex items-center justify-center gap-10 mb-8">
              <button
                className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-200 bg-white shadow-md transition hover:bg-gray-100 focus:outline-none"
                onClick={handleSave}
                disabled={saving}
                aria-pressed={saved}
                aria-label={saved ? 'Unsave job' : 'Save job'}
              >
                {saved ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="#ef4444" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ef4444" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.54 0-2.878.792-3.562 2.008C11.566 4.542 10.228 3.75 8.688 3.75 6.099 3.75 4 5.765 4 8.25c0 7.22 8 11.25 8 11.25s8-4.03 8-11.25z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#9ca3af" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.54 0-2.878.792-3.562 2.008C11.566 4.542 10.228 3.75 8.688 3.75 6.099 3.75 4 5.765 4 8.25c0 7.22 8 11.25 8 11.25s8-4.03 8-11.25z" />
                  </svg>
                )}
              </button>
              <ShareButton
                title={job.title}
                description={job.description || ''}
                url={`${window.location.origin}/jobs/${job.id}`}
                type="job"
                company={job.companies?.name}
                location={typeof job.location === 'object' ? [job.location.city, job.location.area].filter(Boolean).join(', ') : job.location}
                className="flex items-center justify-center gap-2 px-8 py-2 rounded-full border-2 border-gray-200 bg-white shadow-md hover:bg-gray-100 transition font-semibold text-gray-700 text-xs h-10 min-w-[80px]"
              />
              {hasApplied ? (
                <span className="px-5 py-2 rounded-full font-bold text-xs bg-green-100 text-green-700 shadow-md">Applied ✓</span>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applicationLoading}
                  className="px-8 py-2 rounded-full font-bold text-xs transition-all duration-300 shadow-md bg-gradient-to-r from-[#185a9d] to-[#1e3a8a] text-white hover:from-[#1e3a8a] hover:to-[#185a9d] hover:scale-105"
                >
                  Apply
                </button>
              )}
            </div>
            {/* Role Highlights */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Role Highlights</h2>
              <ul className="list-disc list-inside space-y-3 text-gray-600 text-sm">
                {parseRequirements(job.requirements).length > 0
                  ? parseRequirements(job.requirements).map((item, index) => <li key={index}>{item}</li>)
                  : <li className="text-gray-400">No highlights listed.</li>}
              </ul>
            </section>
            {/* Salary Section */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Salary</h2>
              <div className="text-sm text-gray-800 font-semibold mb-2">
                {(() => {
                  if (typeof job.min_amount === 'number' && typeof job.max_amount === 'number' && job.min_amount && job.max_amount) {
                    return `₹${job.min_amount.toLocaleString()} - ₹${job.max_amount.toLocaleString()}${job.pay_rate ? ' / ' + job.pay_rate : ''}`;
                  } else if (typeof job.amount === 'number' && job.amount) {
                    return `₹${job.amount.toLocaleString()}${job.pay_rate ? ' / ' + job.pay_rate : ''}`;
                  } else {
                    return 'Salary not specified';
                  }
                })()}
              </div>
            </section>
            {/* Key Skills */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Key Skills</h2>
              <div className="flex flex-wrap gap-3">
                {(job.skills || []).map((skill: string, idx: number) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-600 px-4 py-2 rounded-full text-xs font-semibold border border-[#d1e7f7]">{skill}</span>
                ))}
              </div>
            </section>
            {/* Education & Eligibility */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Education & Eligibility</h2>
              <div className="text-gray-600 mb-3 text-sm"><b>Education:</b> {job.minimum_education || 'Not specified'}</div>
              <div className="text-gray-600 mb-3 text-sm"><b>Experience Level:</b> {job.experience_level || 'Not specified'}</div>
              <div className="text-gray-600 mb-3 text-sm"><b>Minimum Experience:</b> {job.minimum_experience ? `${job.minimum_experience} years` : 'Not specified'}</div>
              <div className="text-gray-600 mb-3 text-sm"><b>Industries:</b> {job.industries && job.industries.length > 0 ? job.industries.join(', ') : 'Not specified'}</div>
              {job.employment_types && job.employment_types.length > 0 && (
                <div className="text-gray-600 mb-3 text-sm"><b>Employment Types:</b> {job.employment_types.join(', ')}</div>
              )}
              {job.application_deadline && (
                <div className="text-gray-600 mb-3 text-sm"><b>Application Deadline:</b> {new Date(job.application_deadline).toLocaleDateString()}</div>
              )}
              {job.planned_start_date && (
                <div className="text-gray-600 mb-3 text-sm"><b>Planned Start Date:</b> {new Date(job.planned_start_date).toLocaleDateString()}</div>
              )}
            </section>
            {/* Description Section */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Description</h2>
              <div className="text-sm text-gray-600 mb-6 whitespace-pre-line text-center italic">{job.description}</div>
            </section>
            {/* Benefits & Perks */}
            {(job.benefits && job.benefits.length > 0) && (
              <section className="mb-8">
                <h2 className="text-base font-bold text-black mb-4">Benefits & Perks</h2>
                <div className="flex flex-wrap gap-2">
                  {(job.benefits || []).map((benefit: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">{benefit}</span>
                  ))}
                </div>
              </section>
            )}
                          {/* Work Schedule */}
              {job.schedules && job.schedules.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-base font-bold text-black mb-4">Work Schedule</h2>
                  <div className="flex flex-wrap gap-2">
                    {(job.schedules || []).map((schedule: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">{schedule}</span>
                    ))}
                  </div>
                </section>
              )}
              {/* Supplemental Pay */}
              {job.supplemental_pay && job.supplemental_pay.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-base font-bold text-black mb-4">Supplemental Pay</h2>
                  <div className="flex flex-wrap gap-2">
                    {(job.supplemental_pay || []).map((pay: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium border border-purple-200">{pay}</span>
                    ))}
                  </div>
                </section>
              )}
            {/* About Company */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">About Company</h2>
              <div className="flex items-center gap-4 mb-3">
                <img src={job.companies.logo_url || '/placeholder-logo.svg'} alt="Company Logo" className="w-10 h-10 rounded-full border border-gray-200" />
                <span className="font-semibold text-gray-800 text-sm">{job.companies.name}</span>
              </div>
              <div className="text-gray-600 mb-2 text-sm">{job.companies.description}</div>
            </section>
            {/* Beware of imposters */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Beware of imposters!</h2>
              <div className="text-gray-600 text-xs">We do not promise a job or interview in exchange for money. Beware of fraudsters asking for registration or refundable fees.</div>
            </section>
          </div>
          {/* Similar Jobs - OUTSIDE the bordered card */}
          <section className="mt-8 mb-8">
            <h2 className="text-base font-bold text-black mb-4">Similar Jobs</h2>
            {similarJobs.length === 0 ? (
              <div className="text-gray-500 text-xs">No similar jobs found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {similarJobs.map((similar) => {
                  const jobForCard = {
                    id: similar.id,
                    title: similar.title,
                    company: similar.companies?.name || 'Company Name',
                    location: similar.location,
                    type: similar.job_type || 'Not specified',
                    salary: similar.min_amount && similar.max_amount 
                      ? `$${similar.min_amount.toLocaleString()} - $${similar.max_amount.toLocaleString()}`
                      : 'Salary not specified',
                    description: similar.description || '',
                    postedDate: similar.created_at || new Date().toISOString(),
                    requirements: similar.requirements || [],
                    status: 'active' as const,
                    applications: similar.applicants ?? undefined,
                    experience: similar.experience_level || 'Not specified',
                    companies: similar.companies
                  };
                  return <JobCardNew key={similar.id} job={jobForCard} />;
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 py-12">
            {/* Hero Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 flex flex-row items-center justify-between gap-10 mb-12 border-2 border-[#185a9d]">
              <div className="flex items-center gap-10 flex-1">
                <img src={job.companies.logo_url || '/placeholder-logo.svg'} alt={`${job.companies.name} logo`} className="w-32 h-32 rounded-3xl object-cover border-4 border-[#185a9d] bg-white shadow-lg" />
                <div>
                  <h1 className="text-4xl font-extrabold text-black mb-2 tracking-tight drop-shadow">{job.title}</h1>
                  <div className="text-xl text-gray-800 font-semibold mb-2">{job.companies.name}</div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-[#185a9d] px-4 py-2 rounded-full text-sm font-semibold"><FiBriefcase />{job.job_type}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-[#185a9d] px-4 py-2 rounded-full text-sm font-semibold"><FiMapPin />{job.location ? (typeof job.location === 'object' && job.location !== null ? [(job.location as any).city, (job.location as any).area].filter(Boolean).join(', ') : job.location) : 'Not specified'}</span>
                    {typeof job.min_amount === 'number' && typeof job.max_amount === 'number' && (
                      <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-[#185a9d] px-4 py-2 rounded-full text-sm font-semibold"><FiDollarSign />${job.min_amount.toLocaleString()} - ${job.max_amount.toLocaleString()}</span>
                    )}
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-[#185a9d] px-4 py-2 rounded-full text-sm font-semibold"><FiClock />{postedDate}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-[#185a9d] px-4 py-2 rounded-full text-sm font-semibold"><FiUsers />{openings} Openings</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-[#185a9d] px-4 py-2 rounded-full text-sm font-semibold"><FiUserCheck />{applicants}+ Applicants</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-6 min-w-[220px]">
                <div className="flex gap-4 mb-2">
                  <button
                    className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-gray-200 bg-white shadow-lg transition hover:bg-gray-100 focus:outline-none"
                    onClick={handleSave}
                    disabled={saving}
                    aria-pressed={saved}
                    aria-label={saved ? 'Unsave job' : 'Save job'}
                  >
                    {saved ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="#ef4444" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ef4444" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.54 0-2.878.792-3.562 2.008C11.566 4.542 10.228 3.75 8.688 3.75 6.099 3.75 4 5.765 4 8.25c0 7.22 8 11.25 8 11.25s8-4.03 8-11.25z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#9ca3af" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.54 0-2.878.792-3.562 2.008C11.566 4.542 10.228 3.75 8.688 3.75 6.099 3.75 4 5.765 4 8.25c0 7.22 8 11.25 8 11.25s8-4.03 8-11.25z" />
                      </svg>
                    )}
                  </button>
                  <ShareButton
                    title={job.title}
                    description={job.description || ''}
                    url={`${window.location.origin}/jobs/${job.id}`}
                    type="job"
                    company={job.companies?.name}
                    location={typeof job.location === 'object' ? [job.location.city, job.location.area].filter(Boolean).join(', ') : job.location}
                    className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-gray-200 bg-white shadow-lg hover:bg-gray-100 transition font-semibold text-gray-700 text-base min-w-[120px]"
                  />
                </div>
                {hasApplied ? (
                  <span className="px-10 py-4 rounded-2xl font-bold text-lg bg-green-100 text-green-700 shadow-lg">Applied ✓</span>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={applicationLoading}
                    className="w-full px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white shadow-sm hover:from-[#12406a] hover:to-[#185a9d] hover:scale-105"
                  >
                    Apply Now
                  </button>
                )}
                {(resumeRequired || videoRequired) && (
                  <div className="text-sm text-gray-500 mt-2 text-right">
                    {resumeRequired && <span className="block">Resume required</span>}
                    {videoRequired && <span className="block">Video required</span>}
                  </div>
                )}
              </div>
            </div>
            {/* Unified Main Content */}
            <div className="bg-white rounded-2xl shadow p-10 border border-[#e3f0fa] mb-16">
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-black mb-4">Job Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">{job.description}</p>
              </section>
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-black mb-4">Role Highlights</h2>
                <ul className="list-disc list-inside space-y-3 text-gray-800 text-lg">
                  {parseRequirements(job.requirements).length > 0
                    ? parseRequirements(job.requirements).map((item, index) => <li key={index}>{item}</li>)
                    : <li className="text-gray-400">No highlights listed.</li>}
                </ul>
              </section>
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-black mb-4">Key Skills</h2>
                <div className="flex flex-wrap gap-4">
                  {(job.skills || []).map((skill: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-700 px-5 py-2 rounded-full text-base font-semibold border border-[#d1e7f7]">{skill}</span>
                  ))}
                </div>
              </section>
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-black mb-4">Education & Eligibility</h2>
                <div className="text-gray-800 mb-3 text-lg"><b>Education:</b> {job.minimum_education || 'Not specified'}</div>
                <div className="text-gray-800 mb-3 text-lg"><b>Experience Level:</b> {job.experience_level || 'Not specified'}</div>
                <div className="text-gray-800 mb-3 text-lg"><b>Minimum Experience:</b> {job.minimum_experience ? `${job.minimum_experience} years` : 'Not specified'}</div>
                <div className="text-gray-800 mb-3 text-lg"><b>Industries:</b> {job.industries && job.industries.length > 0 ? job.industries.join(', ') : 'Not specified'}</div>
                {job.employment_types && job.employment_types.length > 0 && (
                  <div className="text-gray-800 mb-3 text-lg"><b>Employment Types:</b> {job.employment_types.join(', ')}</div>
                )}
                {job.application_deadline && (
                  <div className="text-gray-800 mb-3 text-lg"><b>Application Deadline:</b> {new Date(job.application_deadline).toLocaleDateString()}</div>
                )}
                {job.planned_start_date && (
                  <div className="text-gray-800 mb-3 text-lg"><b>Planned Start Date:</b> {new Date(job.planned_start_date).toLocaleDateString()}</div>
                )}
              </section>
              {/* Benefits & Perks */}
              {(job.benefits && job.benefits.length > 0) && (
                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-black mb-4">Benefits & Perks</h2>
                  <div className="flex flex-wrap gap-3">
                    {(job.benefits || []).map((benefit: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-4 py-2 rounded-full text-base font-medium border border-green-200">{benefit}</span>
                    ))}
                  </div>
                </section>
              )}
              {/* Work Schedule */}
              {job.schedules && job.schedules.length > 0 && (
                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-black mb-4">Work Schedule</h2>
                  <div className="flex flex-wrap gap-3">
                    {(job.schedules || []).map((schedule: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-base font-medium border border-blue-200">{schedule}</span>
                    ))}
                  </div>
                </section>
              )}
              {/* Supplemental Pay */}
              {job.supplemental_pay && job.supplemental_pay.length > 0 && (
                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-black mb-4">Supplemental Pay</h2>
                  <div className="flex flex-wrap gap-3">
                    {(job.supplemental_pay || []).map((pay: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-base font-medium border border-purple-200">{pay}</span>
                    ))}
                  </div>
                </section>
              )}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-black mb-4">About Company</h2>
                <div className="flex items-center gap-5 mb-3">
                  <img src={job.companies.logo_url || '/placeholder-logo.svg'} alt="Company Logo" className="w-14 h-14 rounded-full border-2 border-[#185a9d]" />
                  <span className="font-semibold text-gray-900 text-lg">{job.companies.name}</span>
                </div>
                <div className="text-gray-700 mb-2 text-lg">{job.companies.description}</div>
              </section>
              <section className="mb-4">
                <h2 className="text-2xl font-bold text-black mb-4">Beware of imposters!</h2>
                <div className="text-gray-600 text-base">We do not promise a job or interview in exchange for money. Beware of fraudsters asking for registration or refundable fees.</div>
              </section>
            </div>
            {/* Similar Jobs */}
            <section className="mt-16 mb-8">
              <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Similar Jobs</h2>
              {similarJobs.length === 0 ? (
                <div className="text-gray-500 text-lg">No similar jobs found.</div>
              ) : (
                <div className="grid grid-cols-2 gap-8">
                  {similarJobs.map((similar) => {
                    const jobForCard = {
                      id: similar.id,
                      title: similar.title,
                      company: similar.companies?.name || 'Company Name',
                      location: similar.location,
                      type: similar.job_type || 'Not specified',
                      salary: similar.min_amount && similar.max_amount 
                        ? `$${similar.min_amount.toLocaleString()} - $${similar.max_amount.toLocaleString()}`
                        : 'Salary not specified',
                      description: similar.description || '',
                      postedDate: similar.created_at || new Date().toISOString(),
                      requirements: similar.requirements || [],
                      status: 'active' as const,
                      applications: similar.applicants ?? undefined,
                      experience: similar.experience_level || 'Not specified',
                      companies: similar.companies
                    };
                    return <JobCardNew key={similar.id} job={jobForCard} />;
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
      {job?.application_type === 'external_link' && job?.disclaimer && (
        <div className="mt-8 text-xs text-gray-500 border-t pt-4">
          <strong>Note:</strong> {job.disclaimer}
        </div>
      )}
    </div>
  );
};

export default JobDetails;
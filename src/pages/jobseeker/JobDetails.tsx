import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import ApplyModal from '../../components/ApplyModal';
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
  companies: Company;
  description: string;
  responsibilities: string[];
  requirements: string[];
  salary_min: number;
  salary_max: number;
  location: string | { city: string; area: string };
  job_type: string; // e.g., Full-time, Part-time
  company_id: string;
  resume_required: boolean;
  video_required: boolean;
  experience?: string;
  created_at?: string;
  openings?: number;
  applicants?: number;
  skills?: string[];
  department?: string;
  industry?: string;
  role_category?: string;
  education?: string;
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

const JobDetails: React.FC = () => {
  const authContext = useContext(AuthContext);
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  
  // Use the new favorites context
  const { isJobSaved, toggleJobFavorite } = useFavorites();
  const saved = isJobSaved(job?.id || '');
  const [saving, setSaving] = useState(false);

  // Add resumeRequired and videoRequired fields from job
  const resumeRequired = job?.resume_required ?? false;
  const videoRequired = job?.video_required ?? false;

  // Add more job info fields for demo (replace with real fields if available)
  const experience = job?.experience || '0-3 years';
  const postedDate = job?.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently';
  const openings = job?.openings || 1;
  const applicants = job?.applicants || 0;
  const keySkills = job?.skills || ['Communication', 'Teamwork', 'Problem Solving'];
  const department = job?.department || 'Customer Success';
  const industry = job?.industry || 'IT Services & Consulting';
  const roleCategory = job?.role_category || 'Customer Service';
  const education = job?.education || 'Any Graduate';

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
        if (job.department) filters.push(`department.eq.${job.department}`);
        // Do NOT filter by location at all to avoid JSONB errors
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
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async (resumeUrl: string | null, videoUrl: string | null) => {
    if (!authContext.profile || !job) return;
    setApplicationLoading(true);
    setError(null);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, auth_id')
        .eq('auth_id', authContext.user?.id)
        .single();
      if (profileError) throw profileError;
      const payload: any = {
        job_id: job.id,
        job_seeker_id: profileData.id,
        status: 'pending',
        applied_at: new Date().toISOString(),
      };
      if (resumeUrl) payload.resume_url = resumeUrl;
      if (videoUrl) payload.video_url = videoUrl;
      console.log('profile.id:', profileData.id);
      console.log('profile.auth_id:', profileData.auth_id);
      console.log('job_seeker_id being sent:', profileData.id);
      console.log('Submitting application payload:', payload);
      if (!payload.job_id || !payload.job_seeker_id) {
        setError('Missing required fields for application.');
        setApplicationLoading(false);
        return;
      }
      const { error: applyError } = await supabase
        .from('applications')
        .insert(payload);
      if (applyError) throw applyError;
      setHasApplied(true);
      setShowApplyModal(false);
      toast.success('Application submitted successfully!');
    } catch (err: any) {
      setError('An error occurred while submitting your application. Please try again.');
    } finally {
      setApplicationLoading(false);
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
          {/* Mobile Brand Title */}
          <div className="w-full flex justify-center pt-6 pb-2">
            <span className="text-3xl font-extrabold tracking-tight text-blue-700 drop-shadow-sm select-none">Selectz</span>
          </div>
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-4 mt-4 mb-8">
            {/* Top: Only Job Title, Company, and Description */}
            <section className="mb-4">
                <div className="flex items-center gap-3 mb-1">
                  <img src={job.companies?.logo_url || '/placeholder-logo.svg'} alt="Company Logo" className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-gray-900 truncate">{job.title}</div>
                    <div className="text-xs text-gray-500 truncate">{job.companies?.name}</div>
                  </div>
                </div>
              <div className="text-xs text-gray-500 mb-3 whitespace-pre-line">{job.description}</div>
              <div className="flex items-center gap-2 mt-2 mb-4">
                  <button
                    className={`flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs transition ${saved ? 'bg-[#185a9d] text-white' : 'bg-gray-100 text-[#185a9d] hover:bg-[#d1e7f7]'}`}
                    onClick={handleSave}
                    disabled={saving}
                    aria-pressed={saved}
                    aria-label={saved ? 'Unsave job' : 'Save job'}
                  >
                    <FiBookmark className={saved ? 'fill-current' : ''} />
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <ShareButton
                    title={job.title}
                    description={job.description}
                    url={`${window.location.origin}/jobs/${job.id}`}
                    type="job"
                    company={job.companies?.name}
                    location={typeof job.location === 'object' ? [job.location.city, job.location.area].filter(Boolean).join(', ') : job.location}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-[#185a9d] font-semibold text-xs hover:bg-[#d1e7f7] transition"
                  />
                  {hasApplied ? (
                    <span className="px-3 py-1 rounded-full font-bold text-xs bg-green-100 text-green-700 shadow">Applied ✓</span>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={applicationLoading}
                      className="px-4 py-1 rounded-full font-bold text-xs transition-all duration-300 shadow bg-[#185a9d] text-white hover:bg-[#216aad] hover:scale-105"
                    >
                      Apply
                    </button>
                  )}
                </div>
            </section>
            {/* Role Highlights: Move meta info here */}
            <section className="mb-4">
              <h2 className="text-base font-bold text-black mb-2">Role Highlights</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                <li><b>Job Mode:</b> {job.job_type}</li>
                <li><b>Experience Required:</b> {experience}</li>
                <li><b>Openings:</b> {openings}</li>
                <li><b>Salary:</b> {job.salary_min} - {job.salary_max}</li>
                <li><b>Location:</b> {
                  typeof job.location === 'object' && job.location !== null && 'city' in job.location && 'area' in job.location
                    ? [job.location.city, job.location.area].filter(Boolean).join(', ')
                    : typeof job.location === 'string'
                      ? job.location
                      : ''
                }</li>
                {normalizeListField(job.responsibilities).length > 0
                  ? normalizeListField(job.responsibilities).map((item, index) => <li key={index}>{item}</li>)
                  : <li className="text-gray-400">No highlights listed.</li>}
              </ul>
            </section>
            <section className="mb-4">
              <h2 className="text-base font-bold text-black mb-2">Key Skills</h2>
              <div className="flex flex-wrap gap-2">
                {keySkills.map((skill: string, idx: number) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-600 px-3 py-1 rounded-full text-xs font-semibold border border-[#d1e7f7]">{skill}</span>
                ))}
              </div>
            </section>
            <section className="mb-4">
              <h2 className="text-base font-bold text-black mb-2">Education & Eligibility</h2>
              <div className="text-gray-600 mb-1 text-sm"><b>Education:</b> {education}</div>
              <div className="text-gray-600 mb-1 text-sm"><b>Department:</b> {department}</div>
              <div className="text-gray-600 mb-1 text-sm"><b>Industry:</b> {industry}</div>
              <div className="text-gray-600 mb-1 text-sm"><b>Role Category:</b> {roleCategory}</div>
            </section>
            <section className="mb-4">
              <h2 className="text-base font-bold text-black mb-2">About Company</h2>
              <div className="flex items-center gap-3 mb-2">
                <img src={job.companies.logo_url || '/placeholder-logo.svg'} alt="Company Logo" className="w-8 h-8 rounded-full border border-gray-200" />
                <span className="font-semibold text-gray-800 text-sm">{job.companies.name}</span>
              </div>
              <div className="text-gray-600 mb-2 text-sm">{job.companies.description}</div>
            </section>
            <section className="mb-4">
              <h2 className="text-base font-bold text-black mb-2">Beware of imposters!</h2>
              <div className="text-gray-600 text-xs">We do not promise a job or interview in exchange for money. Beware of fraudsters asking for registration or refundable fees.</div>
            </section>
            <section className="mb-4">
              <h2 className="text-base font-bold text-black mb-2">Similar Jobs</h2>
              {similarJobs.length === 0 ? (
                <div className="text-gray-500 text-xs">No similar jobs found.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {similarJobs.map((similar) => {
                    const jobForCard = {
                      id: similar.id,
                      title: similar.title,
                      company: similar.companies?.name || 'Company Name',
                      location: similar.location,
                      type: similar.job_type,
                      salary: similar.salary_min && similar.salary_max 
                        ? `$${similar.salary_min.toLocaleString()} - $${similar.salary_max.toLocaleString()}`
                        : 'Salary not specified',
                      description: similar.description,
                      postedDate: similar.created_at || new Date().toISOString(),
                      requirements: similar.requirements || [],
                      status: 'active' as const,
                      applications: similar.applicants,
                      experience: similar.experience || 'Not specified',
                      companies: similar.companies
                    };
                    return <JobCardNew key={similar.id} job={jobForCard} />;
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <div className="bg-[#f7fafd] min-h-screen">
          <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
            {/* Hero Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div className="flex items-center gap-6 flex-1">
                <img src={job.companies.logo_url || '/placeholder-logo.svg'} alt={`${job.companies.name} logo`} className="w-20 h-20 rounded-2xl object-cover border border-gray-200 bg-white" />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-black mb-1">{job.title}</h1>
                  <div className="text-lg text-gray-700 font-semibold mb-1">{job.companies.name}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-600 px-3 py-1 rounded-full text-xs font-semibold"><FiBriefcase />{job.job_type}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-600 px-3 py-1 rounded-full text-xs font-semibold"><FiMapPin />{job.location ? (typeof job.location === 'object' && job.location !== null ? [(job.location as any).city, (job.location as any).area].filter(Boolean).join(', ') : job.location) : 'Not specified'}</span>
                    {typeof job.salary_min === 'number' && typeof job.salary_max === 'number' && (
                      <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-600 px-3 py-1 rounded-full text-xs font-semibold"><FiDollarSign />${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}</span>
                    )}
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-600 px-3 py-1 rounded-full text-xs font-semibold"><FiClock />{postedDate}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-600 px-3 py-1 rounded-full text-xs font-semibold"><FiUsers />{openings} Openings</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-600 px-3 py-1 rounded-full text-xs font-semibold"><FiUserCheck />{applicants}+ Applicants</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 min-w-[180px]">
                <div className="flex gap-2 mb-2">
                  <button
                    className={`flex items-center gap-1 px-4 py-2 rounded-full font-semibold transition ${saved ? 'bg-[#185a9d] text-white' : 'bg-[#e3f0fa] text-[#185a9d] hover:bg-[#d1e7f7]'}`}
                    onClick={handleSave}
                    disabled={saving}
                    aria-pressed={saved}
                    aria-label={saved ? 'Unsave job' : 'Save job'}
                  >
                    <FiBookmark className={saved ? 'fill-current' : ''} />
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <ShareButton
                    title={job.title}
                    description={job.description}
                    url={`${window.location.origin}/jobs/${job.id}`}
                    type="job"
                    company={job.companies.name}
                    location={job.location ? (typeof job.location === 'object' && job.location !== null ? [(job.location as any).city, (job.location as any).area].filter(Boolean).join(', ') : job.location) : 'Not specified'}
                    className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#e3f0fa] text-[#185a9d] font-semibold hover:bg-[#d1e7f7] transition"
                  />
                </div>
                {hasApplied ? (
                  <span className="px-8 py-3 rounded-xl font-bold text-lg bg-green-100 text-green-700 shadow">Applied ✓</span>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={isApplying || applicationLoading}
                    className="w-full px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg bg-[#185a9d] text-white hover:bg-[#216aad] hover:scale-105"
                  >
                    Apply Now
                  </button>
                )}
                {(resumeRequired || videoRequired) && (
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {resumeRequired && <span className="block">Resume required</span>}
                    {videoRequired && <span className="block">Video required</span>}
                  </div>
                )}
              </div>
            </div>
            {/* Main Content */}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-8">
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">Job Description</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                </section>
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">Role Highlights</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {normalizeListField(job.responsibilities).length > 0
                      ? normalizeListField(job.responsibilities).map((item, index) => <li key={index}>{item}</li>)
                      : <li className="text-gray-400">No highlights listed.</li>}
                  </ul>
                </section>
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">Key Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {keySkills.map((skill: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-600 px-3 py-1 rounded-full text-xs font-semibold border border-[#d1e7f7]">{skill}</span>
                    ))}
                  </div>
                </section>
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">Education & Eligibility</h2>
                  <div className="text-gray-600 mb-2"><b>Education:</b> {education}</div>
                  <div className="text-gray-600 mb-2"><b>Department:</b> {department}</div>
                  <div className="text-gray-600 mb-2"><b>Industry:</b> {industry}</div>
                  <div className="text-gray-600 mb-2"><b>Role Category:</b> {roleCategory}</div>
                </section>
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">About Company</h2>
                  <div className="flex items-center gap-3 mb-2">
                    <img src={job.companies.logo_url || '/placeholder-logo.svg'} alt="Company Logo" className="w-10 h-10 rounded-full border border-gray-200" />
                    <span className="font-semibold text-gray-800">{job.companies.name}</span>
                  </div>
                  <div className="text-gray-600 mb-2">{job.companies.description}</div>
                  <div className="flex gap-2 mt-2">
                    <a href="#" className="text-[#185a9d] hover:underline">Website</a>
                    <a href="#" className="text-[#185a9d] hover:underline">LinkedIn</a>
                  </div>
                </section>
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">Beware of imposters!</h2>
                  <div className="text-gray-600 text-sm">We do not promise a job or interview in exchange for money. Beware of fraudsters asking for registration or refundable fees.</div>
                </section>
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">Similar Jobs</h2>
                  {similarJobs.length === 0 ? (
                    <div className="text-gray-500 text-sm">No similar jobs found.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {similarJobs.map((similar) => {
                        // Map the database job to the JobCardNew interface
                        const jobForCard = {
                          id: similar.id,
                          title: similar.title,
                          company: similar.companies?.name || 'Company Name',
                          location: similar.location,
                          type: similar.job_type,
                          salary: similar.salary_min && similar.salary_max 
                            ? `$${similar.salary_min.toLocaleString()} - $${similar.salary_max.toLocaleString()}`
                            : 'Salary not specified',
                          description: similar.description,
                          postedDate: similar.created_at || new Date().toISOString(),
                          requirements: similar.requirements || [],
                          status: 'active' as const,
                          applications: similar.applicants,
                          experience: similar.experience || 'Not specified',
                          companies: similar.companies
                        };
                        return <JobCardNew key={similar.id} job={jobForCard} />;
                      })}
                    </div>
                  )}
                </section>
              </div>
              {/* Sidebar (future: more company info, save/share, other jobs) */}
              <aside className="w-full md:w-80 flex-shrink-0 space-y-6">
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
                  <img src={job.companies.logo_url || '/placeholder-logo.svg'} alt="Company Logo" className="w-16 h-16 rounded-full border border-gray-200 mb-2" />
                  <div className="font-bold text-lg text-black mb-1">{job.companies.name}</div>
                  <div className="text-gray-600 text-sm mb-2">{industry}</div>
                  <a href="#" className="text-[#185a9d] hover:underline text-sm">Visit Website</a>
                  <div className="flex gap-2 mt-2">
                    <a href="#" className="text-[#185a9d] hover:underline"><FiShare2 /></a>
                    <a href="#" className="text-[#185a9d] hover:underline"><FiBookmark /></a>
                  </div>
                </div>
              </aside>
            </div>
            <ApplyModal
              isOpen={showApplyModal}
              onClose={() => setShowApplyModal(false)}
              onSubmit={handleSubmitApplication}
              loading={applicationLoading}
              resumeRequired={resumeRequired}
              videoRequired={videoRequired}
              existingResumeUrl={authContext.profile?.resume_url}
              existingVideoUrl={authContext.profile?.intro_video_url}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
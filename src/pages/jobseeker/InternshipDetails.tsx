import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import ApplyModal from '../../components/ApplyModal';
import { FiBookmark, FiShare2, FiMapPin, FiBriefcase, FiClock, FiUsers, FiDollarSign, FiBookOpen, FiUserCheck } from 'react-icons/fi';
import { InternshipCard } from '../../components/InternshipCard';
import { useFavorites } from '../../contexts/FavoritesContext';
import ShareButton from '../../components/ShareButton';
import useIsMobile from '../../hooks/useIsMobile';

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  stipend: string;
  duration: string;
  created_at: string;
  resume_required?: boolean;
  video_required?: boolean;
  experience?: string;
  openings?: number;
  applicants?: number;
  skills?: string[];
  department?: string;
  industry?: string;
  role_category?: string;
  education?: string;
  company_logo_url?: string;
  company_website?: string;
  company_linkedin?: string;
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

const InternshipDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useContext(AuthContext);
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [similarInternships, setSimilarInternships] = useState<any[]>([]);
  
  // Use the new favorites context
  const { isInternshipSaved, toggleInternshipFavorite } = useFavorites();
  const saved = isInternshipSaved(internship?.id || '');
  const [saving, setSaving] = useState(false);

  const resumeRequired = internship?.resume_required ?? false;
  const videoRequired = internship?.video_required ?? false;

  // Add more internship info fields for demo (replace with real fields if available)
  const experience = internship?.experience || '0-1 years';
  const postedDate = internship?.created_at ? new Date(internship.created_at).toLocaleDateString() : 'Recently';
  const openings = internship?.openings || 1;
  const applicants = internship?.applicants || 0;
  const keySkills = internship?.skills || ['Communication', 'Teamwork', 'Problem Solving'];
  const department = internship?.department || 'Engineering';
  const industry = internship?.industry || 'IT Services & Consulting';
  const roleCategory = internship?.role_category || 'Internship';
  const education = internship?.education || 'Any Graduate';
  const companyLogo = internship?.company_logo_url || '/placeholder-logo.svg';
  const companyWebsite = internship?.company_website || '#';
  const companyLinkedIn = internship?.company_linkedin || '#';

  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const { data, error } = await supabase
          .from('internships')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setInternship(data);
        // Check if already applied
        if (profile && id) {
          const { data: appData, error: appError } = await supabase
            .from('internship_applications')
            .select('id')
            .eq('internship_id', id)
            .eq('job_seeker_id', profile.id)
            .maybeSingle();
          if (appError) throw appError;
          setHasApplied(!!appData);
        }
      } catch (err) {
        setError('Failed to load internship details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInternship();
  }, [id, profile]);

  useEffect(() => {
    const fetchSimilarInternships = async () => {
      if (!internship) return;
      try {
        let query = supabase
          .from('internships')
          .select('*, companies(*)')
          .eq('status', 'active')
          .neq('id', internship.id);
        
        // Build OR filter for similar internships
        const filters = [];
        if (internship.type) filters.push(`internship_type.eq.${internship.type}`);
        if (department) filters.push(`department.eq.${department}`);
        // Do NOT filter by location at all to avoid JSONB errors
        if (filters.length > 0) {
          query = query.or(filters.join(','));
        }
        
        const { data, error } = await query.limit(6);
        if (error) throw error;
        setSimilarInternships(data || []);
      } catch (err) {
        console.error('Error fetching similar internships:', err);
        setSimilarInternships([]);
      }
    };
    fetchSimilarInternships();
  }, [internship, department]);

  const handleApply = () => {
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async (resumeUrl: string | null, videoUrl: string | null) => {
    setApplicationLoading(true);
    setError(null);
    try {
      if (!profile || !user || !internship) {
        setError('Missing user, profile, or internship information.');
        setApplicationLoading(false);
        return;
      }
      const payload: any = {
        internship_id: internship.id,
        user_id: user.id,
        job_seeker_id: profile.id,
        status: 'pending',
        applied_at: new Date().toISOString(),
      };
      if (resumeUrl) payload.resume_url = resumeUrl;
      if (videoUrl) payload.video_url = videoUrl;
      console.log('Submitting internship application payload:', payload);
      if (!payload.internship_id || !payload.user_id || !payload.job_seeker_id) {
        setError('Missing required fields for application.');
        setApplicationLoading(false);
        return;
      }
      const { error } = await supabase
        .from('internship_applications')
        .insert(payload);
      if (error) throw error;
      setHasApplied(true);
      setShowApplyModal(false);
      toast.success('Application submitted successfully!');
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setApplicationLoading(false);
    }
  };

  const handleSave = async () => {
    if (!internship) return;
    setSaving(true);
    try {
      await toggleInternshipFavorite(internship.id);
    } catch (error) {
      console.error('Error toggling internship favorite:', error);
    } finally {
      setSaving(false);
    }
  };

  // Add this function to allow re-applying after withdrawal
  const handleWithdrawnExternally = () => {
    setHasApplied(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600">{error || 'Internship not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {isMobile ? (
        <>
          {/* Mobile Brand Title */}
          <div className="w-full flex justify-center pt-6 pb-2">
            <span className="text-3xl font-extrabold tracking-tight text-blue-700 drop-shadow-sm select-none">Selectz</span>
          </div>
          {/* Main Card/Section (mobile padding, rounded, shadow) */}
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-4 mt-4 mb-8">
            {/* ...existing mobile internship details UI... */}
          </div>
        </>
      ) : (
        <div className="bg-[#f7fafd] min-h-screen">
          <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
            {/* Hero Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div className="flex items-center gap-6 flex-1">
                <img src={companyLogo} alt="Company Logo" className="w-20 h-20 rounded-2xl object-cover border border-gray-200 bg-white" />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-black mb-1">{internship.title}</h1>
                  <div className="text-lg text-gray-600 font-semibold mb-1">{internship.company}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-3 py-1 rounded-full text-xs font-semibold"><FiBriefcase />{internship.type}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-3 py-1 rounded-full text-xs font-semibold"><FiMapPin />{internship.location ? (typeof internship.location === 'object' && internship.location !== null ? [(internship.location as any).city, (internship.location as any).area].filter(Boolean).join(', ') : internship.location) : 'Not specified'}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-3 py-1 rounded-full text-xs font-semibold"><FiDollarSign />{internship.stipend}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-3 py-1 rounded-full text-xs font-semibold"><FiClock />{postedDate}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-3 py-1 rounded-full text-xs font-semibold"><FiUsers />{openings} Openings</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-3 py-1 rounded-full text-xs font-semibold"><FiUserCheck />{applicants}+ Applicants</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 min-w-[180px]">
                <div className="flex gap-2 mb-2">
                  <button
                    className={`flex items-center gap-1 px-4 py-2 rounded-full font-semibold transition ${saved ? 'bg-[#185a9d] text-white' : 'bg-[#e3f0fa] text-black hover:bg-[#d1e7f7]'}`}
                    onClick={handleSave}
                    disabled={saving}
                    aria-pressed={saved}
                    aria-label={saved ? 'Unsave internship' : 'Save internship'}
                  >
                    <FiBookmark className={saved ? 'fill-current' : ''} />
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <ShareButton
                    title={internship.title}
                    description={internship.description}
                    url={`${window.location.origin}/internships/${internship.id}`}
                    type="internship"
                    company={internship.company}
                    location={internship.location ? (typeof internship.location === 'object' && internship.location !== null ? [(internship.location as any).city, (internship.location as any).area].filter(Boolean).join(', ') : internship.location) : 'Not specified'}
                    className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#e3f0fa] text-black font-semibold hover:bg-[#d1e7f7] transition"
                  />
                </div>
                {hasApplied ? (
                  <span className="px-8 py-3 rounded-xl font-bold text-lg bg-green-100 text-green-700 shadow">Applied ✓</span>
                ) : (
                <button
                  onClick={handleApply}
                    disabled={applicationLoading}
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
                  <h2 className="text-xl font-bold text-black mb-3">Internship Description</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{internship.description}</p>
                </section>
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">Role Highlights</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {normalizeListField(internship.requirements).length > 0
                      ? normalizeListField(internship.requirements).map((item, index) => <li key={index}>{item}</li>)
                      : <li className="text-gray-400">No highlights listed.</li>}
                  </ul>
                </section>
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">Key Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {keySkills.map((skill: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-3 py-1 rounded-full text-xs font-semibold border border-[#d1e7f7]">{skill}</span>
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
                    <img src={companyLogo} alt="Company Logo" className="w-10 h-10 rounded-full border border-gray-200" />
                    <span className="font-semibold text-gray-800">{internship.company}</span>
                  </div>
                  <div className="text-gray-600 mb-2">{industry}</div>
                  <div className="flex gap-2 mt-2">
                    <a href={companyWebsite} className="text-black hover:underline">Website</a>
                    <a href={companyLinkedIn} className="text-black hover:underline">LinkedIn</a>
                </div>
                </section>
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">Beware of imposters!</h2>
                  <div className="text-gray-600 text-sm">We do not promise a job or interview in exchange for money. Beware of fraudsters asking for registration or refundable fees.</div>
                </section>
                <section className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-black mb-3">Similar Internships</h2>
                  {similarInternships.length === 0 ? (
                    <div className="text-gray-500 text-sm">No similar internships found.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {similarInternships.map((similar) => (
                        <div key={similar.id} className="bg-[#f4f8fb] rounded-lg border border-[#e3f0fa] shadow-lg hover:shadow-xl hover:border-[#b3d4fc] transition-shadow duration-200 p-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">{similar.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">{similar.company || 'Company Name'}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{similar.description}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {similar.internship_type || similar.type}
                            </span>
                            <button 
                              onClick={() => navigate(`/internships/${similar.id}`)}
                              className="text-black hover:underline text-sm font-medium"
                            >
                              View Details →
                            </button>
                </div>
              </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
              {/* Sidebar (future: more company info, save/share, other internships) */}
              <aside className="w-full md:w-80 flex-shrink-0 space-y-6">
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
                  <img src={companyLogo} alt="Company Logo" className="w-16 h-16 rounded-full border border-gray-200 mb-2" />
                  <div className="font-bold text-lg text-black mb-1">{internship.company}</div>
                  <div className="text-gray-600 text-sm mb-2">{industry}</div>
                  <a href={companyWebsite} className="text-black hover:underline text-sm">Visit Website</a>
                  <div className="flex gap-2 mt-2">
                    <a href={companyLinkedIn} className="text-black hover:underline"><FiShare2 /></a>
                    <a href="#" className="text-black hover:underline"><FiBookmark /></a>
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
              existingResumeUrl={profile?.resume_url}
              existingVideoUrl={profile?.intro_video_url}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipDetails; 
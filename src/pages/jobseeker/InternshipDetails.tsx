import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

import { FiBookmark, FiShare2, FiMapPin, FiBriefcase, FiClock, FiUsers, FiBookOpen, FiUserCheck } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { InternshipCard } from '../../components/InternshipCard';
import { useFavorites } from '../../contexts/FavoritesContext';
import ShareButton from '../../components/ShareButton';
import useIsMobile from '../../hooks/useIsMobile';

interface Internship {
  id: string;
  company_id: string;
  title: string;
  description: string;
  type: string;
  location: any; // JSONB
  duration: string;
  stipend: any; // JSONB
  requirements: string[] | null;
  skills: string[] | null;
  responsibilities: string[] | null;
  perks: string[] | null;
  application_deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  companies?: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    industry: string | null;
    website: string | null;
  };
  application_type?: 'in_app' | 'external_link';
  application_link?: string;
  disclaimer?: string;
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

// Fix stipend display helper
function formatStipend(stipend: any): string {
  if (!stipend) return 'Not specified';
  if (typeof stipend === 'string') return stipend === 'Unpaid' ? 'Unpaid' : `₹${stipend}`;
  if (typeof stipend === 'object') {
    if (stipend.type && stipend.type.toLowerCase() === 'unpaid') return 'Unpaid';
    if (stipend.amount && stipend.frequency) return `₹${stipend.amount} / ${stipend.frequency}`;
    if (stipend.amount) return `₹${stipend.amount}`;
    return 'Not specified';
  }
  return 'Not specified';
}

const InternshipDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useContext(AuthContext);
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [similarInternships, setSimilarInternships] = useState<any[]>([]);
  
  // Use the new favorites context
  const { isInternshipSaved, toggleInternshipFavorite } = useFavorites();
  const saved = isInternshipSaved(internship?.id || '');
  const [saving, setSaving] = useState(false);

  // These fields don't exist in the actual schema, so we'll use defaults
  const resumeRequired = false;
  const videoRequired = false;

  // Add more internship info fields for demo (replace with real fields if available)
  const experience = '0-1 years';
  const postedDate = internship?.created_at ? new Date(internship.created_at).toLocaleDateString() : 'Recently';
  const openings = 1;
  const applicants = 0;
  const keySkills = internship?.skills || ['Communication', 'Teamwork', 'Problem Solving'];
  const department = 'Engineering';
  const industry = internship?.companies?.industry || 'IT Services & Consulting';
  const roleCategory = 'Internship';
  const education = 'Any Graduate';
  const companyLogo = internship?.companies?.logo_url || '/placeholder-logo.svg';
  const companyWebsite = internship?.companies?.website || '#';
  const companyLinkedIn = '#';

  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const { data, error } = await supabase
          .from('internships')
          .select(`
            *,
            companies:company_id(*)
          `)
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
        if (internship.type) filters.push(`type.eq.${internship.type}`);
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
    if (internship?.application_type === 'external_link' && internship.application_link) {
      window.open(internship.application_link, '_blank');
    } else {
      navigate(`/internships/${id}/apply`);
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
          {/* Mobile Card - Title, Company, then Buttons, then sections in requested order */}
          <div className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-3xl shadow-2xl p-5 mt-6 mb-10 border border-[#185a9d]">
            {/* Internship Title, Company, Logo */}
            <div className="flex flex-col items-center gap-2 mb-5">
              <div className="w-20 h-20 rounded-2xl border-4 border-[#185a9d] shadow-lg bg-white flex items-center justify-center mb-3">
                <img src={companyLogo} alt="Company Logo" className="w-16 h-16 object-cover rounded-xl" />
              </div>
              <div className="text-center">
                <div className="font-extrabold text-lg text-black drop-shadow-sm mb-2 tracking-wide">{internship.title}</div>
                <div className="text-xs text-gray-700 font-semibold mb-2">{internship.companies?.name || 'Company Name'}</div>
              </div>
            </div>
            {/* Buttons: Apply, Save, Share */}
            <div className="flex items-center justify-center gap-10 mb-8">
              <button
                className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-200 bg-white shadow-md transition hover:bg-gray-100 focus:outline-none"
                onClick={handleSave}
                disabled={saving}
                aria-pressed={saved}
                aria-label={saved ? 'Unsave internship' : 'Save internship'}
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
                title={internship.title}
                description={internship.description}
                url={`${window.location.origin}/internships/${internship.id}`}
                type="internship"
                company={internship.companies?.name || 'Company Name'}
                location={internship.location ? (typeof internship.location === 'object' && internship.location !== null ? [(internship.location as any).city, (internship.location as any).area].filter(Boolean).join(', ') : internship.location) : 'Not specified'}
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
                {normalizeListField(internship.requirements).length > 0
                  ? normalizeListField(internship.requirements).map((item, index) => <li key={index}>{item}</li>)
                  : <li className="text-gray-400">No highlights listed.</li>}
              </ul>
            </section>
            {/* Stipend Section */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Stipend</h2>
              <div className="text-sm text-gray-800 font-semibold mb-2">
                {formatStipend(internship.stipend)}
              </div>
            </section>
            {/* Key Skills */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Key Skills</h2>
              <div className="flex flex-wrap gap-3">
                {keySkills.map((skill: string, idx: number) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-600 px-4 py-2 rounded-full text-xs font-semibold border border-[#d1e7f7]">{skill}</span>
                ))}
              </div>
            </section>
            {/* Education & Eligibility */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Education & Eligibility</h2>
              <div className="text-gray-600 mb-3 text-sm"><b>Education:</b> {education}</div>
              <div className="text-gray-600 mb-3 text-sm"><b>Department:</b> {department}</div>
              <div className="text-gray-600 mb-3 text-sm"><b>Industry:</b> {industry}</div>
              <div className="text-gray-600 mb-3 text-sm"><b>Role Category:</b> {roleCategory}</div>
              {internship.application_deadline && (
                <div className="text-gray-600 mb-3 text-sm"><b>Application Deadline:</b> {new Date(internship.application_deadline).toLocaleDateString()}</div>
              )}
            </section>
            {/* Description Section */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Description</h2>
              <div className="text-sm text-gray-600 mb-6 whitespace-pre-line text-center italic">{internship.description}</div>
            </section>
            {/* Responsibilities */}
            {internship.responsibilities && internship.responsibilities.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base font-bold text-black mb-4">Responsibilities</h2>
                <ul className="list-disc list-inside space-y-3 text-gray-600 text-sm">
                  {internship.responsibilities.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </section>
            )}
            {/* Perks */}
            {internship.perks && internship.perks.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base font-bold text-black mb-4">Perks & Benefits</h2>
                <div className="flex flex-wrap gap-2">
                  {internship.perks.map((perk: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">{perk}</span>
                  ))}
                </div>
              </section>
            )}
            {/* About Company */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">About Company</h2>
              <div className="flex items-center gap-4 mb-3">
                <img src={companyLogo} alt="Company Logo" className="w-10 h-10 rounded-full border border-gray-200" />
                <span className="font-semibold text-gray-800 text-sm">{internship.companies?.name || 'Company Name'}</span>
              </div>
              <div className="text-gray-600 mb-2 text-sm">{industry}</div>
              <div className="flex gap-2 mt-2">
                <a href={companyWebsite} className="text-black hover:underline">Website</a>
                <a href={companyLinkedIn} className="text-black hover:underline">LinkedIn</a>
              </div>
            </section>
            {/* Beware of imposters */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-black mb-4">Beware of imposters!</h2>
              <div className="text-gray-600 text-xs">We do not promise a job or interview in exchange for money. Beware of fraudsters asking for registration or refundable fees.</div>
            </section>
          </div>
          {/* Similar Internships - OUTSIDE the bordered card */}
          <section className="mt-8 mb-8">
            <h2 className="text-base font-bold text-black mb-4">Similar Internships</h2>
            {similarInternships.length === 0 ? (
              <div className="text-gray-500 text-xs">No similar internships found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {similarInternships.map((similar) => (
                  <div key={similar.id} className="bg-[#f4f8fb] rounded-lg border border-[#e3f0fa] shadow-lg hover:shadow-xl hover:border-[#b3d4fc] transition-shadow duration-200 p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{similar.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{similar.companies?.name || 'Company Name'}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{similar.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {similar.type}
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
        </>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 py-12">
            {/* Hero Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 flex flex-row items-center justify-between gap-10 mb-12 border-2 border-[#185a9d]">
              <div className="flex items-center gap-10 flex-1">
                <img src={companyLogo} alt="Company Logo" className="w-32 h-32 rounded-3xl object-cover border-4 border-[#185a9d] bg-white shadow-lg" />
                <div>
                  <h1 className="text-4xl font-extrabold text-black mb-2 tracking-tight drop-shadow">{internship.title}</h1>
                  <div className="text-xl text-gray-800 font-semibold mb-2">{internship.companies?.name || 'Company Name'}</div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-4 py-2 rounded-full text-sm font-semibold"><FiBriefcase />{internship.type}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-4 py-2 rounded-full text-sm font-semibold"><FiMapPin />{internship.location ? (typeof internship.location === 'object' && internship.location !== null ? [(internship.location as any).city, (internship.location as any).area].filter(Boolean).join(', ') : internship.location) : 'Not specified'}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-4 py-2 rounded-full text-sm font-semibold">{formatStipend(internship.stipend)}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-4 py-2 rounded-full text-sm font-semibold"><FiClock />{postedDate}</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-4 py-2 rounded-full text-sm font-semibold"><FiUsers />{openings} Openings</span>
                    <span className="inline-flex items-center gap-1 bg-[#e3f0fa] text-black px-4 py-2 rounded-full text-sm font-semibold"><FiUserCheck />{applicants}+ Applicants</span>
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
                    aria-label={saved ? 'Unsave internship' : 'Save internship'}
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
                    title={internship.title}
                    description={internship.description}
                    url={`${window.location.origin}/internships/${internship.id}`}
                    type="internship"
                    company={internship.companies?.name || 'Company Name'}
                    location={internship.location ? (typeof internship.location === 'object' && internship.location !== null ? [(internship.location as any).city, (internship.location as any).area].filter(Boolean).join(', ') : internship.location) : 'Not specified'}
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
                <h2 className="text-2xl font-bold text-black mb-4">Internship Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">{internship.description}</p>
              </section>
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-black mb-4">Role Highlights</h2>
                <ul className="list-disc list-inside space-y-3 text-gray-800 text-lg">
                  {normalizeListField(internship.requirements).length > 0
                    ? normalizeListField(internship.requirements).map((item, index) => <li key={index}>{item}</li>)
                    : <li className="text-gray-400">No highlights listed.</li>}
                </ul>
              </section>
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-black mb-4">Key Skills</h2>
                <div className="flex flex-wrap gap-4">
                  {keySkills.map((skill: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-[#e3f0fa] text-gray-700 px-5 py-2 rounded-full text-base font-semibold border border-[#d1e7f7]">{skill}</span>
                  ))}
                </div>
              </section>
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-black mb-4">Education & Eligibility</h2>
                <div className="text-gray-800 mb-3 text-lg"><b>Education:</b> {education}</div>
                <div className="text-gray-800 mb-3 text-lg"><b>Department:</b> {department}</div>
                <div className="text-gray-800 mb-3 text-lg"><b>Industry:</b> {industry}</div>
                <div className="text-gray-800 mb-3 text-lg"><b>Role Category:</b> {roleCategory}</div>
                {internship.application_deadline && (
                  <div className="text-gray-800 mb-3 text-lg"><b>Application Deadline:</b> {new Date(internship.application_deadline).toLocaleDateString()}</div>
                )}
                {internship.start_date && (
                  <div className="text-gray-800 mb-3 text-lg"><b>Start Date:</b> {new Date(internship.start_date).toLocaleDateString()}</div>
                )}
                {internship.end_date && (
                  <div className="text-gray-800 mb-3 text-lg"><b>End Date:</b> {new Date(internship.end_date).toLocaleDateString()}</div>
                )}
              </section>
              {/* Responsibilities */}
              {internship.responsibilities && internship.responsibilities.length > 0 && (
                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-black mb-4">Responsibilities</h2>
                  <ul className="list-disc list-inside space-y-3 text-gray-800 text-lg">
                    {internship.responsibilities.map((item: string, index: number) => <li key={index}>{item}</li>)}
                  </ul>
                </section>
              )}
              {/* Perks */}
              {internship.perks && internship.perks.length > 0 && (
                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-black mb-4">Perks & Benefits</h2>
                  <div className="flex flex-wrap gap-3">
                    {internship.perks.map((perk: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-4 py-2 rounded-full text-base font-medium border border-green-200">{perk}</span>
                    ))}
                  </div>
                </section>
              )}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-black mb-4">About Company</h2>
                <div className="flex items-center gap-5 mb-3">
                  <img src={companyLogo} alt="Company Logo" className="w-14 h-14 rounded-full border-2 border-[#185a9d]" />
                  <span className="font-semibold text-gray-900 text-lg">{internship.companies?.name || 'Company Name'}</span>
                </div>
                <div className="text-gray-700 mb-2 text-lg">{industry}</div>
                <div className="flex gap-3 mt-2">
                  <a href={companyWebsite} className="text-[#185a9d] hover:underline text-lg">Website</a>
                  <a href={companyLinkedIn} className="text-[#185a9d] hover:underline text-lg">LinkedIn</a>
                </div>
              </section>
              <section className="mb-4">
                <h2 className="text-2xl font-bold text-black mb-4">Beware of imposters!</h2>
                <div className="text-gray-600 text-base">We do not promise a job or interview in exchange for money. Beware of fraudsters asking for registration or refundable fees.</div>
              </section>
            </div>
            {/* Similar Internships */}
            <section className="mt-16 mb-8">
              <h2 className="text-2xl font-bold text-[#185a9d] mb-6">Similar Internships</h2>
              {similarInternships.length === 0 ? (
                <div className="text-gray-500 text-lg">No similar internships found.</div>
              ) : (
                <div className="grid grid-cols-2 gap-8">
                  {similarInternships.map((similar) => (
                    <div key={similar.id} className="bg-[#f4f8fb] rounded-lg border border-[#e3f0fa] shadow-lg hover:shadow-xl hover:border-[#b3d4fc] transition-shadow duration-200 p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{similar.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">{similar.companies?.name || 'Company Name'}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{similar.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {similar.type}
                        </span>
                        <button 
                          onClick={() => navigate(`/internships/${similar.id}`)}
                          className="text-[#185a9d] hover:underline text-sm font-medium"
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
        </div>
      )}
      {internship?.application_type === 'external_link' && internship?.disclaimer && (
        <div className="mt-8 text-xs text-gray-500 border-t pt-4">
          <strong>Note:</strong> {internship.disclaimer}
        </div>
      )}
    </div>
  );
};

export default InternshipDetails; 
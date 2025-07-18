import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  title: string;
  experience: string;
  summary: string;
  intro_video_url?: string;
  resume_url?: string;
  skills: { name: string }[];
  education: { degree: string; institution: string; year: string; field: string; }[];
}

const EmployerJobSeekerProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    const checkAccessAndFetchProfile = async () => {
      if (!user || !id) {
        setError('Authentication required.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Check if employer has access to this profile using database function
        const { data: accessData, error: accessError } = await supabase.rpc('check_profile_access', {
          employer_id: user.id,
          job_seeker_id: id // id is now auth_id (uuid)
        });

        if (accessError) {
          console.error('Access check error:', accessError);
          setError('Access denied. You may need to unlock this profile first.');
          setLoading(false);
          return;
        }

        if (!accessData) {
          setError('Access denied. You may need to unlock this profile first.');
          setLoading(false);
          return;
        }

        setAccessGranted(true);

        // Fetch the profile data using auth_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_id', id)
          .single();

        if (profileError || !profileData) {
          setError('Profile not found.');
          setLoading(false);
          return;
        }

        setProfile(profileData);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndFetchProfile();
  }, [id, user]);

  // Helper to trigger download
  const handleDownloadResume = () => {
    if (profile?.resume_url) {
      const link = document.createElement('a');
      link.href = profile.resume_url;
      link.download = profile.resume_url.split('/').pop() || 'resume';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/employer/reels')}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors duration-200"
            >
              Browse Job Seeker Reels
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-lg" 
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-emerald-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              {accessGranted && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                  Unlocked
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.full_name}</h1>
              <p className="text-xl text-emerald-600 font-semibold mb-1">{profile.title}</p>
              <p className="text-gray-500 flex items-center gap-2">
                📍 {profile.location || 'Location not specified'}
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Intro Video */}
        {profile.intro_video_url && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🎥 Intro Video
            </h2>
            <video 
              src={profile.intro_video_url} 
              controls 
              className="rounded-xl w-full max-h-96 bg-black shadow-lg" 
              preload="metadata"
            />
          </div>
        )}

        {/* Resume Section */}
        {profile.resume_url && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📄 Resume
            </h2>
            <div className="flex gap-4">
              <button
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition-colors duration-200"
                onClick={() => setShowResume(true)}
              >
                View Resume
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              <button
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-full font-semibold shadow hover:bg-green-700 transition-colors duration-200"
                onClick={handleDownloadResume}
              >
                Download Resume
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
              </button>
            </div>
            {showResume && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full relative">
                  <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
                    onClick={() => setShowResume(false)}
                    aria-label="Close resume preview"
                  >
                    &times;
                  </button>
                  {profile.resume_url.endsWith('.pdf') ? (
                    <iframe
                      src={profile.resume_url}
                      title="Resume PDF"
                      className="w-full h-96 rounded-xl border border-gray-200 shadow"
                    />
                  ) : (
                    <div className="text-gray-600 text-center py-12">
                      <span>Preview not available for this file type. Please download to view.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact & Professional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📞 Contact Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-20">Email:</span>
                <a href={`mailto:${profile.email}`} className="text-emerald-600 hover:text-emerald-800 underline">
                  {profile.email}
                </a>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-20">Phone:</span>
                  <a href={`tel:${profile.phone}`} className="text-gray-900">
                    {profile.phone}
                  </a>
                </div>
              )}
              {profile.linkedin && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-20">LinkedIn:</span>
                  <a href={profile.linkedin} className="text-emerald-600 hover:text-emerald-800 underline" target="_blank" rel="noopener noreferrer">
                    View Profile
                  </a>
                </div>
              )}
              {profile.github && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-20">GitHub:</span>
                  <a href={profile.github} className="text-emerald-600 hover:text-emerald-800 underline" target="_blank" rel="noopener noreferrer">
                    View Profile
                  </a>
                </div>
              )}
              {profile.portfolio && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-20">Portfolio:</span>
                  <a href={profile.portfolio} className="text-emerald-600 hover:text-emerald-800 underline" target="_blank" rel="noopener noreferrer">
                    View Portfolio
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              💼 Professional Summary
            </h2>
            <div className="space-y-4">
              {profile.experience && (
                <div>
                  <span className="text-gray-500 text-sm">Experience:</span>
                  <p className="text-gray-900 font-medium">{profile.experience}</p>
                </div>
              )}
              {profile.summary && (
                <div>
                  <span className="text-gray-500 text-sm">Summary:</span>
                  <p className="text-gray-900 whitespace-pre-line leading-relaxed">{profile.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🛠️ Skills
          </h2>
          <div className="flex flex-wrap gap-3">
            {profile.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium border border-emerald-200 hover:bg-emerald-200 transition-colors"
                >
                  {skill.name}
                </span>
              ))
            ) : (
              <span className="text-gray-500 italic">No skills listed</span>
            )}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🎓 Education
          </h2>
          <div className="space-y-4">
            {profile.education && profile.education.length > 0 ? (
              profile.education.map((edu, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                  <div className="font-semibold text-gray-900 text-lg">{edu.degree}</div>
                  <div className="text-emerald-600 font-medium">{edu.field}</div>
                  <div className="text-gray-700">{edu.institution}</div>
                  <div className="text-gray-500 text-sm">{edu.year}</div>
                </div>
              ))
            ) : (
              <span className="text-gray-500 italic">No education listed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerJobSeekerProfileView; 
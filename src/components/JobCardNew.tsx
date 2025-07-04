import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';
import { useFavorites } from '../contexts/FavoritesContext';
import ShareButton from './ShareButton';
import useIsMobile from '../hooks/useIsMobile';

interface JobLocation {
  area?: string;
  city?: string;
  pincode?: string;
  streetAddress?: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | JobLocation;
  type: string;
  salary: string;
  description: string;
  postedDate: string;
  requirements: string[] | any;
  status: 'active' | 'paused' | 'closed' | 'expired';
  applications?: number;
  experience: string;
  companies?: {
    name: string;
    logo_url: string;
  };
  companyLogo?: string;
  skills?: string[];
}

interface JobCardProps {
  job: Job;
}

const JobCardNew: React.FC<JobCardProps> = ({ job }) => {
  const { user, profile } = useContext(AuthContext);
  const [hasApplied, setHasApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Use the new favorites context
  const { isJobSaved, toggleJobFavorite } = useFavorites();
  const saved = isJobSaved(job.id);

  // Check if applied on mount
  useEffect(() => {
    const checkApplied = async () => {
      if (!profile || !job.id) return;
      try {
        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', job.id)
          .eq('job_seeker_id', profile.id)
          .maybeSingle();
        if (appError) throw appError;
        setHasApplied(!!appData);
      } catch (err) {
        console.error('Error checking job application status:', err);
      }
    };
    checkApplied();
  }, [profile, job.id]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile || !job.id) return;
    
    setSaving(true);
    try {
      await toggleJobFavorite(job.id);
    } catch (error) {
      console.error('Error toggling job favorite:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatLocation = (location: string | JobLocation): string => {
    if (typeof location === 'string') {
      return location;
    }
    if (typeof location === 'object' && location !== null) {
      const parts = [];
      if (location.city) parts.push(location.city);
      if (location.area) parts.push(location.area);
      if (location.pincode) parts.push(location.pincode);
      return parts.join(', ') || 'Location not specified';
    }
    return 'Location not specified';
  };

  const formatRequirements = (requirements: string[] | any): string[] => {
    if (Array.isArray(requirements)) {
      return requirements;
    }
    if (typeof requirements === 'string') {
      try {
        const parsed = JSON.parse(requirements);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return requirements.split(',').map((r: string) => r.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const requirements = formatRequirements(job.requirements);
  const companyLogo = job.companies?.logo_url || job.companyLogo;
  const companyName = job.companies?.name || job.company || 'Unknown Company';

  // Card click handler
  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if the click is not on a button or its child
    if ((e.target as HTMLElement).closest('button')) return;
    window.location.href = `/jobs/${job.id}`;
  };

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div
        className="relative flex flex-col bg-white rounded-2xl border border-[#e3f0fa] shadow-lg hover:shadow-xl transition-shadow duration-200 group overflow-hidden cursor-pointer max-w-2xl w-full px-8 py-4 mb-4"
        onClick={handleCardClick}
        style={{ margin: '0 auto', minHeight: 120 }}
      >
        {/* Title at the top, always visible */}
        <div className="flex items-start gap-2 mb-1" style={{paddingLeft: 56}}>
          <h3 className="text-lg font-bold text-black break-words w-full" style={{wordBreak: 'break-word'}}>{job.title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold self-start">Job</span>
        </div>
        <div className="text-sm font-semibold text-gray-700 truncate mb-1" style={{paddingLeft: 56}}>{companyName}</div>
        <div className="flex flex-wrap gap-2 items-center mb-1" style={{paddingLeft: 56}}>
          {job.experience && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              {job.experience}
            </span>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {job.salary}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {formatLocation(job.location)}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {job.type}
          </span>
        </div>
        <div className="mt-1 text-xs text-gray-500 line-clamp-1" style={{paddingLeft: 56}}>{job.description}</div>
        {/* Logo at the bottom left */}
        <div className="absolute left-6 bottom-4 flex items-center">
          {companyLogo ? (
            <img src={companyLogo} alt="Company Logo" className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white" />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 text-black font-bold text-base border border-gray-200">
              {companyName[0]}
            </div>
          )}
        </div>
        {/* Save button at the bottom right */}
        <div className="absolute right-6 bottom-4 flex items-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center justify-center w-10 h-10 rounded-full border border-[#185a9d] ${saved ? 'bg-[#185a9d] text-white' : 'bg-white text-[#185a9d] hover:bg-[#185a9d] hover:text-white'} transition-all duration-200`}
            aria-label={saved ? 'Unsave job' : 'Save job'}
          >
            <svg className={`w-5 h-5 ${saved ? 'fill-white' : 'fill-[#185a9d] group-hover:fill-white'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative bg-white rounded-2xl border border-[#e3f0fa] shadow-lg hover:shadow-2xl transition-shadow duration-200 group overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Job badge */}
      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Job</span>
      <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-black group-hover:text-[#12406a] truncate">{job.title}</h3>
              <div className="text-base font-medium text-gray-600 mt-1 truncate">{companyName}</div>
            </div>
            {/* Company Logo */}
            {companyLogo ? (
              <img src={companyLogo} alt="Company Logo" className="w-12 h-12 object-contain rounded-lg border border-gray-100 bg-white shadow-sm ml-2" />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 text-black font-bold text-lg ml-2">
                {companyName[0]}
              </div>
            )}
          </div>
          {/* Info Chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Experience */}
            {job.experience && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
                {job.experience}
              </span>
            )}
            {/* Salary */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              <svg className="w-4 h-4 mr-1 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              {job.salary}
            </span>
            {/* Location */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              <svg className="w-4 h-4 mr-1 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {formatLocation(job.location)}
            </span>
            {/* Type */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {job.type}
            </span>
          </div>
          {/* Description */}
          <div className="mt-3 text-sm text-gray-600 line-clamp-2">
            {job.description}
          </div>
          {/* Skills/Tags */}
          {Array.isArray(job.skills) && job.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {job.skills.map((skill, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full bg-[#f4f8fb] text-xs text-gray-600 border border-[#b3d4fc] font-medium">
                  {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="flex flex-col items-end gap-2 min-w-[90px]">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm border border-gray-600 ${saved ? 'bg-gray-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-600 hover:text-white'}`}
            aria-label={saved ? 'Unsave job' : 'Save job'}
          >
            <svg className={`w-4 h-4 ${saved ? 'fill-white' : 'fill-gray-600 group-hover:fill-white'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            {saved ? 'Saved' : 'Save'}
          </button>
          
          {/* Share Button */}
          <ShareButton
            title={job.title}
            description={job.description}
            url={`${window.location.origin}/jobs/${job.id}`}
            type="job"
            company={companyName}
            location={formatLocation(job.location)}
            className="w-full"
          />
          
          {hasApplied ? (
            <span className="w-full px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 text-center">Applied ✓</span>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); window.location.href = `/jobs/${job.id}?apply=1`; }}
              className="w-full px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-600 to-[#43cea2] text-white shadow-sm hover:from-[#43cea2] hover:to-gray-600 transition-all duration-200"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCardNew; 
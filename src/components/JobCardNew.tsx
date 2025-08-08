import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';
import { useFavorites } from '../contexts/FavoritesContext';
import ShareButton from './ShareButton';
import useIsMobile from '../hooks/useIsMobile';
import { FaHeart } from 'react-icons/fa';

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
  application_type?: 'external_link' | 'internal_apply';
  disclaimer?: string;
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

  const formatSalary = (salary: string) => {
    if (!salary || salary === 'Salary not specified' || salary === '₹0' || salary === '₹0 / ') return 'Salary not specified';
    // Try to extract numbers and format as INR
    const match = salary.match(/([\d,]+)/g);
    if (match) {
      // If range
      if (salary.includes('-')) {
        return `₹${match.join(' - ₹')}${salary.includes('/') ? ' / ' + salary.split('/')[1].trim() : ''}`;
      }
      return `₹${match[0]}${salary.includes('/') ? ' / ' + salary.split('/')[1].trim() : ''}`;
    }
    return salary;
  };

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
        className="relative flex flex-col bg-white rounded-2xl border border-gray-400 shadow-sm overflow-hidden cursor-pointer w-full px-3 py-3 mb-3 h-[170px]"
        onClick={handleCardClick}
      >
        {/* Top Row: Logo, Title, Badge, Heart */}
        <div className="flex items-start justify-between mb-3 w-full">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img src={companyLogo} alt="Company Logo" className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white" />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 text-black font-bold text-sm border border-gray-200">
                {companyName[0]}
              </div>
            )}
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-black break-words max-w-[230px] line-clamp-2" style={{wordBreak: 'break-word'}}>{job.title}</h3>
              <span className="px-1.5 py-0.5 rounded-full bg-ocean-100 text-ocean-700 text-[10px] font-bold self-start mt-1">Job</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 bg-white"
            aria-label={saved ? 'Unsave job' : 'Save job'}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <FaHeart size={14} color={saved ? '#e63946' : 'transparent'} fill={saved ? '#e63946' : 'none'} style={{stroke: saved ? '#e63946' : '#b0b0b0', strokeWidth: 30}} />
          </button>
        </div>
        {/* Company Name */}
        <div className="text-sm font-semibold text-gray-800 truncate mb-1 max-w-[230px]">{companyName}</div>
        {/* Info Row (desktop-like chips) */}
        <div className="flex flex-wrap gap-1.5 items-center mb-1 text-[12px]">
          {job.experience && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{job.experience}</span>
          )}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{formatSalary(job.salary)}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{formatLocation(job.location)}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{job.type}</span>
        </div>
        {/* No Description on compact mobile card */}
        {/* No Apply button here; spacing balanced for clean look */}
        {job?.application_type === 'external_link' && job?.disclaimer && (
  <div className="mt-2 text-xs text-gray-500">
    <strong>Note:</strong> {job.disclaimer}
  </div>
)
}
      </div>
    );
  }

  // Desktop view
  return (
    <div
      className="relative flex flex-col bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden cursor-pointer w-full px-6 py-5 mb-4 md:transition md:duration-200 md:hover:shadow-lg md:hover:border-gray-400 md:hover:-translate-y-0.5"
      onClick={handleCardClick}
    >
      {/* Top Row: Logo, Title, Badge, Heart */}
      <div className="flex items-start justify-between mb-4 w-full">
        <div className="flex items-center gap-4">
          {companyLogo ? (
            <img src={companyLogo} alt="Company Logo" className="w-14 h-14 object-contain rounded-lg border border-gray-200 bg-white" />
          ) : (
            <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-gray-200 text-black font-bold text-base border border-gray-200">
              {companyName[0]}
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-black break-words max-w-[240px]" style={{wordBreak: 'break-word'}}>{job.title}</h3>
            <span className="px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-700 text-xs font-bold self-start mt-1">Job</span>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition-all duration-200"
          aria-label={saved ? 'Unsave job' : 'Save job'}
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <FaHeart size={18} color={saved ? '#e63946' : 'transparent'} fill={saved ? '#e63946' : 'none'} style={{stroke: saved ? '#e63946' : '#b0b0b0', strokeWidth: 30}} />
        </button>
      </div>
      {/* Company Name */}
      <div className="text-sm font-semibold text-gray-800 truncate mb-2">{companyName}</div>
      {/* Info Row (desktop-style chips) */}
      <div className="flex flex-wrap gap-2 items-center text-[14px]">
        {job.experience && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{job.experience}</span>
        )}
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{formatSalary(job.salary)}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{formatLocation(job.location)}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{job.type}</span>
      </div>
      {/* Description for desktop */}
      <div className="mt-2 text-sm text-gray-600 line-clamp-2">{job.description}</div>
      <div style={{ flex: 1, minHeight: 12 }} />
      {job?.application_type === 'external_link' && job?.disclaimer && (
  <div className="mt-2 text-xs text-gray-500">
    <strong>Note:</strong> {job.disclaimer}
  </div>
)
}
    </div>
  );
};

export default JobCardNew; 
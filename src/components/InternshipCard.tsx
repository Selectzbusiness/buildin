import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiBookmark } from 'react-icons/fi';
import { supabase } from '../config/supabase';
import { AuthContext } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useFavorites } from '../contexts/FavoritesContext';
import ShareButton from './ShareButton';
import useIsMobile from '../hooks/useIsMobile';

interface Location {
  city: string;
  area: string;
  pincode?: string;
  streetAddress?: string;
}

interface Internship {
  id: string;
  title: string;
  description: string;
  internship_type: string;
  location: Location | string;
  stipend_type: string;
  min_amount: number;
  max_amount: number;
  amount: number;
  pay_rate: string;
  duration: string;
  company?: string;
  companyLogo?: string;
  skills?: string[];
}

interface InternshipCardProps {
  internship: Internship;
  onApply?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  saved?: boolean;
}

export const InternshipCard: React.FC<InternshipCardProps> = ({ 
  internship, 
  onApply, 
  onSave, 
  onShare, 
  saved
}) => {
  const { profile } = useContext(AuthContext);
  const [hasApplied, setHasApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Use the new favorites context
  const { isInternshipSaved, toggleInternshipFavorite } = useFavorites();
  const isSaved = isInternshipSaved(internship.id);

  const isMobile = useIsMobile();

  useEffect(() => {
    const checkApplied = async () => {
      if (!profile || !internship.id) return;
      try {
        // Check applied
        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select('id')
          .eq('internship_id', internship.id)
          .eq('job_seeker_id', profile.id)
          .maybeSingle();
        if (appError) throw appError;
        setHasApplied(!!appData);
      } catch (err) {
        console.error('Error checking internship application status:', err);
      }
    };
    checkApplied();
  }, [profile, internship.id]);

  // Format location display
  const formatLocation = (location: Location | string): string => {
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

  // Save/Unsave logic
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile || !internship.id) return;
    
    setSaving(true);
    try {
      await toggleInternshipFavorite(internship.id);
    } catch (error) {
      console.error('Error toggling internship favorite:', error);
    } finally {
      setSaving(false);
    }
  };

  // Card click handler
  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if the click is not on a button or its child
    if ((e.target as HTMLElement).closest('button')) return;
    window.location.href = `/internships/${internship.id}`;
  };

  if (isMobile) {
    return (
      <div
        className="relative flex flex-col bg-white rounded-2xl border border-[#e3f0fa] shadow-lg hover:shadow-xl transition-shadow duration-200 group overflow-hidden cursor-pointer max-w-2xl w-full px-8 py-4 mb-4"
        onClick={handleCardClick}
        style={{ margin: '0 auto', minHeight: 120 }}
      >
        {/* Title at the top, always visible */}
        <div className="flex items-start gap-2 mb-1" style={{paddingLeft: 56}}>
          <h3 className="text-lg font-bold text-black break-words w-full" style={{wordBreak: 'break-word'}}>{internship.title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold self-start">Internship</span>
        </div>
        <div className="text-sm font-semibold text-gray-700 truncate mb-1" style={{paddingLeft: 56}}>{internship.company || 'Unknown Company'}</div>
        <div className="flex flex-wrap gap-2 items-center mb-1" style={{paddingLeft: 56}}>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {internship.duration}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {internship.stipend_type === 'range'
              ? `${internship.min_amount} - ${internship.max_amount} ${internship.pay_rate}`
              : `${internship.amount} ${internship.pay_rate}`}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {formatLocation(internship.location)}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {internship.internship_type}
          </span>
        </div>
        <div className="mt-1 text-xs text-gray-500 line-clamp-1" style={{paddingLeft: 56}}>{internship.description}</div>
        {/* Logo at the bottom left */}
        <div className="absolute left-6 bottom-4 flex items-center">
          {internship.companyLogo ? (
            <img src={internship.companyLogo} alt="Company Logo" className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white" />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 text-black font-bold text-base border border-gray-200">
              {internship.company ? internship.company[0] : 'C'}
            </div>
          )}
        </div>
        {/* Save button at the bottom right */}
        <div className="absolute right-6 bottom-4 flex items-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center justify-center w-10 h-10 rounded-full border border-[#185a9d] ${isSaved ? 'bg-[#185a9d] text-white' : 'bg-white text-[#185a9d] hover:bg-[#185a9d] hover:text-white'} transition-all duration-200`}
            aria-label={isSaved ? 'Unsave internship' : 'Save internship'}
          >
            <svg className={`w-5 h-5 ${isSaved ? 'fill-white' : 'fill-[#185a9d] group-hover:fill-white'}`} fill="currentColor" viewBox="0 0 20 20">
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
      {/* Internship badge */}
      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">Internship</span>
      <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-black group-hover:text-[#12406a] truncate">{internship.title}</h3>
              <div className="text-base font-medium text-gray-600 mt-1 truncate">{internship.company || 'Unknown Company'}</div>
            </div>
            {/* Company Logo */}
            {internship.companyLogo ? (
              <img src={internship.companyLogo} alt="Company Logo" className="w-12 h-12 object-contain rounded-lg border border-gray-100 bg-white shadow-sm ml-2" />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 text-black font-bold text-lg ml-2">
                {internship.company ? internship.company[0] : 'C'}
              </div>
            )}
          </div>
          {/* Info Chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Duration */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {internship.duration}
            </span>
            {/* Stipend */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              <svg className="w-4 h-4 mr-1 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              {internship.stipend_type === 'range'
                ? `${internship.min_amount} - ${internship.max_amount} ${internship.pay_rate}`
                : `${internship.amount} ${internship.pay_rate}`}
            </span>
            {/* Location */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              <svg className="w-4 h-4 mr-1 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {formatLocation(internship.location)}
            </span>
            {/* Type */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {internship.internship_type}
            </span>
          </div>
          {/* Description */}
          <div className="mt-3 text-sm text-gray-600 line-clamp-2">
            {internship.description}
          </div>
          {/* Skills/Tags */}
          {Array.isArray(internship.skills) && internship.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {internship.skills.map((skill, idx) => (
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
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm border border-[#185a9d] ${isSaved ? 'bg-[#185a9d] text-white' : 'bg-white text-[#185a9d] hover:bg-[#185a9d] hover:text-white'}`}
            aria-label={isSaved ? 'Unsave internship' : 'Save internship'}
          >
            <svg className={`w-4 h-4 ${isSaved ? 'fill-white' : 'fill-[#185a9d] group-hover:fill-white'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            {isSaved ? 'Saved' : 'Save'}
          </button>
          
          {/* Share Button */}
          <ShareButton
            title={internship.title}
            description={internship.description}
            url={`${window.location.origin}/internships/${internship.id}`}
            type="internship"
            company={internship.company || 'Unknown Company'}
            location={formatLocation(internship.location)}
            className="w-full"
          />
          
          {hasApplied ? (
            <span className="w-full px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 text-center">Applied ✓</span>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); window.location.href = `/internships/${internship.id}?apply=1`; }}
              className="w-full px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white shadow-sm hover:from-[#43cea2] hover:to-[#185a9d] transition-all duration-200"
            >
              Apply
            </button>
          )}
          {onShare && (
            <button
              onClick={e => { e.stopPropagation(); onShare(); }}
              className="w-full px-3 py-1.5 rounded-full text-xs font-semibold bg-[#f4f8fb] text-[#185a9d] border border-[#b3d4fc] hover:bg-[#e3f0fa] transition-all duration-200"
            >
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 
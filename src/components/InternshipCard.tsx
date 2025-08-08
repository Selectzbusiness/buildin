import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiBookmark } from 'react-icons/fi';
import { supabase } from '../config/supabase';
import { AuthContext } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useFavorites } from '../contexts/FavoritesContext';
import ShareButton from './ShareButton';
import useIsMobile from '../hooks/useIsMobile';
import { FaHeart } from 'react-icons/fa';

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
  application_type?: 'in_app' | 'external_link';
  application_link?: string;
  disclaimer?: string;
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

  const formatStipend = () => {
    if (internship.stipend_type === 'range') {
      return `₹${internship.min_amount.toLocaleString()} - ₹${internship.max_amount.toLocaleString()}${internship.pay_rate ? ' / ' + internship.pay_rate : ''}`;
    }
    if (internship.amount) {
      return `₹${internship.amount.toLocaleString()}${internship.pay_rate ? ' / ' + internship.pay_rate : ''}`;
    }
    return 'Not specified';
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
        className="relative flex flex-col bg-white rounded-2xl border border-gray-400 shadow-sm overflow-hidden cursor-pointer w-full px-3 py-3 mb-3 h-[170px]"
        onClick={handleCardClick}
      >
        {/* Top Row: Logo, Title, Badge, Heart */}
        <div className="flex items-start justify-between mb-3 w-full">
          <div className="flex items-center gap-3">
            {internship.companyLogo ? (
              <img src={internship.companyLogo} alt="Company Logo" className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white" />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 text-black font-bold text-sm border border-gray-200">
                {internship.company ? internship.company[0] : 'C'}
              </div>
            )}
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-black break-words max-w-[230px] line-clamp-2" style={{wordBreak: 'break-word'}}>{internship.title}</h3>
              <span className="px-1.5 py-0.5 rounded-full bg-ocean-100 text-ocean-700 text-[10px] font-bold self-start mt-1">Internship</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 bg-white"
            aria-label={isSaved ? 'Unsave internship' : 'Save internship'}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <FaHeart size={14} color={isSaved ? '#e63946' : 'transparent'} fill={isSaved ? '#e63946' : 'none'} style={{stroke: isSaved ? '#e63946' : '#b0b0b0', strokeWidth: 30}} />
          </button>
        </div>
        {/* Company Name */}
        <div className="text-[13px] font-semibold text-gray-800 truncate mb-1 max-w-[230px]">{internship.company || 'Unknown Company'}</div>
        {/* Info Row (desktop-like chips) */}
        <div className="flex flex-wrap gap-1.5 items-center mb-1 text-[12px]">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{internship.duration}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{formatStipend()}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{formatLocation(internship.location)}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{internship.internship_type}</span>
        </div>
        {/* No Description on compact mobile card */}
        <div style={{ flex: 1, minHeight: 12 }} />
        {/* No Apply button here; spacing balanced for clean look */
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
          {internship.companyLogo ? (
            <img src={internship.companyLogo} alt="Company Logo" className="w-14 h-14 object-contain rounded-lg border border-gray-200 bg-white" />
          ) : (
            <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-gray-200 text-black font-bold text-base border border-gray-200">
              {internship.company ? internship.company[0] : 'C'}
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-black break-words max-w-[240px]" style={{wordBreak: 'break-word'}}>{internship.title}</h3>
            <span className="px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-700 text-xs font-bold self-start mt-1">Internship</span>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition-all duration-200"
          aria-label={isSaved ? 'Unsave internship' : 'Save internship'}
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <FaHeart size={18} color={isSaved ? '#e63946' : 'transparent'} fill={isSaved ? '#e63946' : 'none'} style={{stroke: isSaved ? '#e63946' : '#b0b0b0', strokeWidth: 30}} />
        </button>
      </div>
      {/* Company Name */}
      <div className="text-sm font-semibold text-gray-800 truncate mb-2">{internship.company || 'Unknown Company'}</div>
      {/* Info Row (desktop-style chips) */}
      <div className="flex flex-wrap gap-2 items-center text-[14px]">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{internship.duration}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{formatStipend()}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{formatLocation(internship.location)}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-300">{internship.internship_type}</span>
      </div>
      {/* Description for desktop */}
      <div className="mt-2 text-sm text-gray-600 line-clamp-2">{internship.description}</div>
      {internship?.application_type === 'external_link' && internship?.disclaimer && (
        <div className="mt-2 text-xs text-gray-500">
          <strong>Note:</strong> {internship.disclaimer}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 12 }} />
      {/* No Apply button here; spacing balanced for clean look */}
    </div>
  );
}; 
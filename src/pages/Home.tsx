import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import AdvancedSearch from '../components/AdvancedSearch';
import NotificationCenter from '../components/NotificationCenter';
import MessagingSystem from '../components/MessagingSystem';
import JobCardNew from '../components/JobCardNew';
import { InternshipCard } from '../components/InternshipCard';
import useIsMobile from '../hooks/useIsMobile';
import { FiFilter } from 'react-icons/fi';

interface Location {
  city: string;
  area: string;
  pincode?: string;
  streetAddress?: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: Location | string;
  type: string;
  salary: string;
  description: string;
  postedDate: string;
  requirements: string[] | any;
  status: 'active' | 'paused' | 'closed' | 'expired';
  applications?: number;
  experience: string;
}

interface CombinedOpportunity {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: Location | string;
  type: string;
  salary: string;
  description: string;
  postedDate: string;
  requirements: string[] | any;
  status: string;
  experience: string;
  postType: 'Job' | 'Internship';
  duration?: string | number;
}

// Helper to get company field (name/logo_url) from companies relation
function getCompanyField(companies: any, field: 'name' | 'logo_url'): string {
  if (!companies) return '';
  if (Array.isArray(companies)) {
    return companies[0]?.[field] || '';
  }
  return companies[field] || '';
}

const RECENT_SEARCHES_KEY = 'recent_searches';

const Home: React.FC = () => {
  const { user, profile } = useContext(AuthContext);
  const [jobsAndInternships, setJobsAndInternships] = useState<CombinedOpportunity[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'internships' | 'companies'>('jobs');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();
  const [showMobileSearchModal, setShowMobileSearchModal] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'foryou' | 'jobs' | 'internships'>('foryou');
  // Mobile search modal state
  const [modalType, setModalType] = useState<'jobs' | 'internships'>('jobs');
  const [modalDesignation, setModalDesignation] = useState('');
  const [modalLocation, setModalLocation] = useState('');
  const [showDesignationSuggestions, setShowDesignationSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{designation: string, location: string, type: string}[]>([]);

  // Filter state (add jobType)
  type FilterState = {
    [key: string]: string;
    jobType: string;
    experienceLevel: string;
    salaryRange: string;
    remoteWork: string;
    industry: string;
    postedDate: string;
  };
  const [filters, setFilters] = useState<FilterState>({
    jobType: '',
    experienceLevel: '',
    salaryRange: '',
    remoteWork: '',
    industry: '',
    postedDate: ''
  });

  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // Mobile filter bar options (example: work mode, department, location, etc.)
  const filterOptions = [
    { key: 'jobType', label: 'Job Type', values: ['Full Time', 'Part Time', 'Contract', 'Temporary', 'Internship'] },
    { key: 'internshipType', label: 'Internship Type', values: ['Onsite', 'Remote', 'Hybrid'] },
    { key: 'company', label: 'Company', values: Array.from(new Set(jobsAndInternships.map(j => j.company).filter(Boolean))) },
    { key: 'skills', label: 'Skills', values: Array.from(new Set(jobsAndInternships.flatMap(j => Array.isArray(j.requirements) ? j.requirements : (typeof j.requirements === 'string' ? j.requirements.split(',').map(s => s.trim()) : [])))) },
    { key: 'experienceLevel', label: 'Experience Level', values: ['Fresher', '0-1 years', '1-3 years', '3+ years'] },
    { key: 'salaryRange', label: 'Salary Range', values: ['<20k', '20k-40k', '40k-60k', '60k+'] },
    { key: 'remoteWork', label: 'Work Mode', values: ['Work from office', 'Remote', 'Hybrid'] },
    { key: 'duration', label: 'Duration', values: ['<3 months', '3-6 months', '6+ months'] },
    { key: 'postedDate', label: 'Posted Date', values: ['Last 24 hours', 'Last 3 days', 'Last 7 days', 'Last 30 days'] },
  ];

  useEffect(() => {
    fetchJobsAndInternships();
    fetchCompanies();
  }, []);

  const fetchJobsAndInternships = async () => {
    setLoading(true);
    try {
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*, companies (id, name, logo_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      // Fetch internships
      const { data: internshipsData, error: internshipsError } = await supabase
        .from('internships')
        .select('*, companies (id, name, logo_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (jobsError || internshipsError) throw jobsError || internshipsError;
      const jobs: CombinedOpportunity[] = (jobsData || []).map(job => ({
        id: job.id,
        title: job.title,
        company: job.companies ? (Array.isArray(job.companies) ? job.companies[0]?.name : job.companies.name) : 'Unknown Company',
        companyLogo: job.companies ? (Array.isArray(job.companies) ? job.companies[0]?.logo_url : job.companies.logo_url) : '',
        location: job.location,
        type: job.job_type,
        salary: job.amount && job.pay_rate ? `${job.amount} / ${job.pay_rate}` : '',
        description: job.description,
        postedDate: job.created_at,
        requirements: job.requirements || [],
        status: job.status,
        experience: job.experience_level || job.experience || '',
        postType: 'Job',
      }));
      const internships: CombinedOpportunity[] = (internshipsData || []).map(internship => ({
        id: internship.id,
        title: internship.title,
        company: internship.companies ? (Array.isArray(internship.companies) ? internship.companies[0]?.name : internship.companies.name) : 'Unknown Company',
        companyLogo: internship.companies ? (Array.isArray(internship.companies) ? internship.companies[0]?.logo_url : internship.companies.logo_url) : '',
        location: internship.location,
        type: internship.internship_type,
        salary: internship.amount && internship.pay_rate ? `${internship.amount} / ${internship.pay_rate}` : '',
        description: internship.description,
        postedDate: internship.created_at,
        requirements: internship.requirements || [],
        status: internship.status,
        experience: internship.experience_level || internship.experience || '',
        postType: 'Internship',
      }));
      setJobsAndInternships([...jobs, ...internships].sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()));
    } catch (error) {
      console.error('Error fetching jobs/internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, logo_url, website, description')
      .limit(10);
    if (!error && data) setCompanies(data);
  };

  const stats = [
    { label: 'Active Jobs', value: '2,500+', icon: '💼' },
    { label: 'Companies', value: '500+', icon: '🏢' },
    { label: 'Job Seekers', value: '10,000+', icon: '��' },
    { label: 'Success Rate', value: '85%', icon: '📈' }
  ];

  // Helper function to format location display
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

  // Update the filtering logic for jobsAndInternships and filteredMobileData:
  const filterByAll = (item: CombinedOpportunity): boolean => {
    let matches = true;
    if (filters.jobType) {
      matches = matches && (item.type?.toLowerCase() === filters.jobType.toLowerCase() || item.postType?.toLowerCase() === filters.jobType.toLowerCase());
    }
    if (filters.internshipType) {
      matches = matches && (item.type?.toLowerCase() === filters.internshipType.toLowerCase());
    }
    if (filters.company) {
      matches = matches && (item.company?.toLowerCase() === filters.company.toLowerCase());
    }
    if (filters.skills) {
      const reqs = Array.isArray(item.requirements)
        ? (item.requirements as string[]).map((r: string) => r.toLowerCase())
        : typeof item.requirements === 'string'
          ? (item.requirements as string).toLowerCase().split(',').map((s: string) => s.trim())
          : [];
      matches = matches && reqs.includes(filters.skills.toLowerCase());
    }
    if (filters.experienceLevel) {
      matches = matches && (item.experience?.toLowerCase().includes(filters.experienceLevel.toLowerCase()));
    }
    if (filters.salaryRange) {
      // Assume salary is a string like '40000 / month' or '800000 / year'
      const num = parseInt(item.salary?.replace(/[^0-9]/g, ''));
      if (filters.salaryRange === '<20k') matches = matches && num < 20000;
      if (filters.salaryRange === '20k-40k') matches = matches && num >= 20000 && num < 40000;
      if (filters.salaryRange === '40k-60k') matches = matches && num >= 40000 && num < 60000;
      if (filters.salaryRange === '60k+') matches = matches && num >= 60000;
    }
    if (filters.remoteWork) {
      matches = matches && (item.type?.toLowerCase().includes(filters.remoteWork.toLowerCase()));
    }
    if (filters.duration) {
      // Assume item.duration is a string like '6 months', '3 months', etc. or a number
      if (item.duration !== undefined && item.duration !== null) {
        const dur = typeof item.duration === 'number' ? item.duration : parseInt(item.duration.toString());
        if (filters.duration === '<3 months') matches = matches && dur < 3;
        if (filters.duration === '3-6 months') matches = matches && dur >= 3 && dur <= 6;
        if (filters.duration === '6+ months') matches = matches && dur > 6;
      }
    }
    if (filters.postedDate) {
      const posted = new Date(item.postedDate);
      const now = new Date();
      if (filters.postedDate === 'Last 24 hours') matches = matches && (now.getTime() - posted.getTime() < 24 * 60 * 60 * 1000);
      if (filters.postedDate === 'Last 3 days') matches = matches && (now.getTime() - posted.getTime() < 3 * 24 * 60 * 60 * 1000);
      if (filters.postedDate === 'Last 7 days') matches = matches && (now.getTime() - posted.getTime() < 7 * 24 * 60 * 60 * 1000);
      if (filters.postedDate === 'Last 30 days') matches = matches && (now.getTime() - posted.getTime() < 30 * 24 * 60 * 60 * 1000);
    }
    return matches;
  };

  const filteredJobsAndInternships = jobsAndInternships.filter(item => {
    let matches = filterByAll(item);
    // Also apply searchTerm and locationTerm
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation =
      locationTerm.trim() === '' ||
      (typeof item.location === 'string'
        ? item.location.toLowerCase().includes(locationTerm.toLowerCase())
        : (item.location.city?.toLowerCase().includes(locationTerm.toLowerCase()) ||
           item.location.area?.toLowerCase().includes(locationTerm.toLowerCase()) ||
           item.location.pincode?.toLowerCase().includes(locationTerm.toLowerCase())
          )
        );
    return matches && matchesSearch && matchesLocation;
  });

  const filteredMobileData = jobsAndInternships.filter(item => {
    if (activeMobileTab === 'jobs' && item.postType !== 'Job') return false;
    if (activeMobileTab === 'internships' && item.postType !== 'Internship') return false;
    if (isMobile) {
      let matches = filterByAll(item);
      const matchesSearch =
        searchTerm.trim() === '' ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation =
        locationTerm.trim() === '' ||
        (typeof item.location === 'string'
          ? item.location.toLowerCase().includes(locationTerm.toLowerCase())
          : (item.location.city?.toLowerCase().includes(locationTerm.toLowerCase()) ||
             item.location.area?.toLowerCase().includes(locationTerm.toLowerCase()) ||
             item.location.pincode?.toLowerCase().includes(locationTerm.toLowerCase())
            )
          );
      return matches && matchesSearch && matchesLocation;
    }
    return true;
  });

  // Toggle filter panel
  const handleToggleFilters = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowAdvancedSearch(v => !v);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: typeof filters) => setFilters(newFilters);

  // Handle filter apply
  const handleFilterApply = () => setShowAdvancedSearch(false);

  // Handle filter reset
  const handleFilterReset = () => setFilters({
    jobType: '',
    experienceLevel: '',
    salaryRange: '',
    remoteWork: '',
    industry: '',
    postedDate: ''
  });

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtering is already live
  };

  // Close filter panel on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const panel = filterPanelRef.current;
      const button = filterButtonRef.current;
      if (
        panel &&
        !panel.contains(event.target as Node) &&
        button &&
        !button.contains(event.target as Node)
      ) {
        setShowAdvancedSearch(false);
      }
    };
    if (showAdvancedSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdvancedSearch]);

  // Extract unique designations and locations from jobsAndInternships
  const allDesignations = Array.from(new Set(jobsAndInternships
    .filter(item => item.postType.toLowerCase() === modalType)
    .map(item => item.title)
  ));
  const allLocations = Array.from(new Set(jobsAndInternships
    .filter(item => item.postType.toLowerCase() === modalType)
    .map(item => typeof item.location === 'string' ? item.location : (item.location.city || ''))
  ));
  const filteredDesignationSuggestions = modalDesignation.length > 0
    ? allDesignations.filter(d => d.toLowerCase().includes(modalDesignation.toLowerCase())).slice(0, 6)
    : [];
  const filteredLocationSuggestions = modalLocation.length > 0
    ? allLocations.filter(l => l && l.toLowerCase().includes(modalLocation.toLowerCase())).slice(0, 6)
    : [];

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (isMobile) {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    }
  }, [isMobile]);

  // Save a new search to recent searches
  const saveRecentSearch = (designation: string, location: string, type: string) => {
    if (!designation && !location) return;
    const newEntry = { designation, location, type };
    let updated = [newEntry, ...recentSearches.filter(s => s.designation !== designation || s.location !== location || s.type !== type)];
    if (updated.length > 5) updated = updated.slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  return (
    <>
      {/* Mobile Brand Title (top left, only on mobile) */}
      {isMobile && (
        <div className="w-full flex items-center pt-3 pb-2 px-3">
          <img src="/selectz-logo.png" alt="Selectz Logo" className="w-9 h-9 mr-2" style={{objectFit: 'contain'}} />
          <span className="text-xl font-extrabold tracking-tight select-none" style={{color: '#185a9d', letterSpacing: '0.01em'}}>Selectz</span>
        </div>
      )}
      {/* Responsive Search Bar */}
      <div className="w-full flex flex-col items-center justify-center mt-6 mb-8 px-2">
        {/* Mobile Search Bar (polished for mobile app) */}
        {isMobile && (
          <>
            <div className="flex flex-col gap-2 pt-4 px-0 w-full sticky top-0 z-40 bg-[#f8fafc]">
              <div
                className="flex items-center w-full bg-gradient-to-r from-blue-100 via-emerald-50 to-blue-200 rounded-2xl shadow-2xl border border-gray-100 px-5 py-4 cursor-pointer active:scale-98 hover:shadow-emerald-200 transition-all duration-200 group"
                onClick={() => setShowMobileSearchModal(true)}
                role="button"
                tabIndex={0}
                aria-label="Open search"
                style={{ minHeight: '64px', boxShadow: '0 4px 24px 0 rgba(24,90,157,0.10)' }}
              >
                <svg className="w-8 h-8 mr-4 flex-shrink-0 group-hover:scale-110 transition-transform" style={{color: '#185a9d'}} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" stroke="url(#search-gradient)" strokeWidth="2.5" />
                  <defs>
                    <linearGradient id="search-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#43cea2" />
                      <stop offset="1" stopColor="#185a9d" />
                    </linearGradient>
                  </defs>
                  <path d="M21 21l-2-2" stroke="url(#search-gradient)" strokeWidth="2.5" />
                </svg>
                <div className="flex flex-col flex-1">
                  <span className={`text-lg font-semibold ${searchTerm ? 'text-gray-900' : 'text-gray-400'} group-hover:text-emerald-700 transition-colors`} style={{lineHeight: '1.3'}}>
                    {searchTerm || 'Search jobs, internships, companies...'}
                  </span>
                  <span className={`text-base font-medium ${locationTerm ? 'text-gray-900' : 'text-gray-400'} group-hover:text-emerald-700 transition-colors`} style={{lineHeight: '1.3'}}>
                    {locationTerm || 'Enter city or locality'}
                  </span>
                </div>
              </div>
            </div>
            {showMobileSearchModal && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-fade-in">
                <div className="bg-white rounded-3xl p-6 w-11/12 max-w-md shadow-2xl relative animate-slide-up">
                  <button
                    className="absolute top-2 right-2 text-gray-400 text-2xl hover:text-gray-700 transition-colors"
                    onClick={() => setShowMobileSearchModal(false)}
                    aria-label="Close search modal"
                  >
                    &times;
                  </button>
                  <div className="mb-4">
                    <div className="flex justify-center gap-4 mb-4">
                      <button
                        className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-150 ${modalType === 'internships' ? 'bg-gray-100 text-gray-600' : 'bg-gradient-to-r from-blue-500 to-emerald-400 text-white shadow'}`}
                        onClick={() => setModalType('jobs')}
                        type="button"
                      >Jobs</button>
                      <button
                        className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-150 ${modalType === 'jobs' ? 'bg-gray-100 text-gray-600' : 'bg-gradient-to-r from-blue-500 to-emerald-400 text-white shadow'}`}
                        onClick={() => setModalType('internships')}
                        type="button"
                      >Internships</button>
                    </div>
                    <div className="mb-3 relative">
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-base placeholder-gray-400 mb-2 pr-10 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                        placeholder="Designation, skill and company"
                        value={modalDesignation}
                        onChange={e => { setModalDesignation(e.target.value); setShowDesignationSuggestions(true); }}
                        onFocus={() => setShowDesignationSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowDesignationSuggestions(false), 100)}
                        autoFocus
                        aria-label="Designation, skill and company"
                      />
                      {modalDesignation && (
                        <button
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                          onClick={() => setModalDesignation('')}
                          tabIndex={-1}
                          aria-label="Clear designation"
                          type="button"
                        >
                          &times;
                        </button>
                      )}
                      {showDesignationSuggestions && filteredDesignationSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto animate-fade-in">
                          {filteredDesignationSuggestions.map((d, i) => (
                            <div
                              key={i}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                              onMouseDown={() => { setModalDesignation(d); setShowDesignationSuggestions(false); }}
                            >{d}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mb-3 relative">
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-base placeholder-gray-400 pr-10 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                        placeholder="Location"
                        value={modalLocation}
                        onChange={e => { setModalLocation(e.target.value); setShowLocationSuggestions(true); }}
                        onFocus={() => setShowLocationSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 100)}
                        aria-label="Location"
                      />
                      {modalLocation && (
                        <button
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                          onClick={() => setModalLocation('')}
                          tabIndex={-1}
                          aria-label="Clear location"
                          type="button"
                        >
                          &times;
                        </button>
                      )}
                      {showLocationSuggestions && filteredLocationSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto animate-fade-in">
                          {filteredLocationSuggestions.map((l, i) => (
                            <div
                              key={i}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                              onMouseDown={() => { setModalLocation(l); setShowLocationSuggestions(false); }}
                            >{l}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <div className="font-semibold text-gray-700 mb-2 text-sm">Recent Searches</div>
                      <div className="flex flex-col gap-2">
                        {recentSearches.map((s, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm">
                            <button
                              className="flex-1 flex items-center text-left gap-2 truncate"
                              style={{ minWidth: 0 }}
                              onClick={() => {
                                setModalDesignation(s.designation);
                                setModalLocation(s.location);
                                setModalType(s.type as 'jobs' | 'internships');
                              }}
                              aria-label={`Recent search: ${s.designation} ${s.location}`}
                            >
                              <span className="truncate font-medium text-gray-900">{s.designation || 'Any role'}</span>
                              {s.location && <span className="text-gray-500 ml-2">in {s.location}</span>}
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{s.type.charAt(0).toUpperCase() + s.type.slice(1)}</span>
                            </button>
                            <button
                              className="ml-2 text-gray-400 hover:text-red-500"
                              onClick={() => {
                                const updated = recentSearches.filter((_, idx) => idx !== i);
                                setRecentSearches(updated);
                                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
                              }}
                              aria-label="Delete recent search"
                              type="button"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      className="w-full bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white rounded-xl py-3 font-bold text-base mt-2 flex items-center justify-center gap-2 shadow-lg transition-all duration-200 focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
                      type="button"
                      onClick={() => {
                        setActiveMobileTab(modalType);
                        setSearchTerm(modalDesignation);
                        setLocationTerm(modalLocation);
                        setShowMobileSearchModal(false);
                        saveRecentSearch(modalDesignation, modalLocation, modalType);
                      }}
                      aria-label={`Show ${modalType}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" stroke="url(#search-gradient-btn)" strokeWidth="2.5" />
                        <defs>
                          <linearGradient id="search-gradient-btn" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#43cea2" />
                            <stop offset="1" stopColor="#185a9d" />
                          </linearGradient>
                        </defs>
                        <path d="M21 21l-2-2" stroke="url(#search-gradient-btn)" strokeWidth="2.5" />
                      </svg>
                      Show {modalType === 'jobs' ? 'jobs' : 'internships'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Tabs (pill-style, sticky) */}
            <div className="flex justify-between items-center w-full max-w-md mx-auto mt-4 mb-4 px-2 sticky top-[88px] z-30 bg-[#f8fafc]">
              {['foryou', 'jobs', 'internships'].map(tab => (
                <button
                  key={tab}
                  className={`flex-1 py-2 mx-1 rounded-full font-semibold text-base transition-all duration-150
                    ${activeMobileTab === tab ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setActiveMobileTab(tab as 'foryou' | 'jobs' | 'internships')}
                  style={{ minWidth: 0 }}
                >
                  {tab === 'foryou' ? 'For you' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Mobile Filters Bar (sticky, minimal) */}
            <div className="sticky top-[140px] z-20 bg-[#f8fafc] w-full max-w-md mx-auto flex items-center gap-2 px-2 py-2 border-b border-gray-100 overflow-x-auto">
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                onClick={() => setShowMobileFilterModal(true)}
                aria-label="Open filters"
              >
                <FiFilter className="w-5 h-5" />
              </button>
              {/* Show selected filters as chips */}
              {Object.entries(filters).map(([key, value]) => value && (
                <span key={key} className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-medium mr-2 whitespace-nowrap">
                  {filterOptions.find(opt => opt.key === key)?.label || key}: {value}
                </span>
              ))}
            </div>

            {/* Mobile Filter Modal (unchanged, already mobile-optimized) */}
            {showMobileFilterModal && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-6 w-11/12 max-w-md shadow-lg relative max-h-[80vh] overflow-y-auto">
                  <button
                    className="absolute top-2 right-2 text-gray-500 text-xl"
                    onClick={() => setShowMobileFilterModal(false)}
                    aria-label="Close filter modal"
                  >
                    &times;
                  </button>
                  <div className="text-lg font-semibold mb-4">Filter results</div>
                  <form className="flex flex-col gap-4">
                    {filterOptions.map(opt => (
                      <div key={opt.key}>
                        <div className="font-medium mb-2 text-sm">{opt.label}</div>
                        <div className="flex flex-wrap gap-2">
                          {opt.values.map(val => (
                            <button
                              key={val}
                              type="button"
                              className={`px-3 py-1 rounded-full border text-xs font-medium transition-all duration-150
                                ${filters[opt.key] === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                              onClick={() => setFilters(f => ({ ...f, [opt.key]: f[opt.key] === val ? '' : val }))}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between mt-6">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200"
                        onClick={() => setFilters({ jobType: '', experienceLevel: '', salaryRange: '', remoteWork: '', industry: '', postedDate: '' })}
                      >Clear all</button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-full bg-blue-600 text-white font-semibold shadow"
                        onClick={() => setShowMobileFilterModal(false)}
                      >Apply filters</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Mobile Scrollable Cards (modern, mobile spacing, only one card at a time) */}
            <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-28 pt-2">
              {filteredMobileData.length === 0 && (
                <div className="text-center text-gray-400 py-8">No results found.</div>
              )}
              {filteredMobileData.map((item: CombinedOpportunity) => (
                <div key={item.id} className="rounded-2xl shadow-lg border border-gray-100 bg-white p-2 mx-2">
                  {item.postType === 'Job' ? (
                    <JobCardNew job={item as any} />
                  ) : (
                    <InternshipCard internship={item as any} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {/* Desktop Search Bar */}
        {!isMobile && (
          <div className="w-full max-w-xl mx-auto hidden md:flex flex-row items-center gap-4">
            <form className="flex-1 flex items-center" onSubmit={handleSearchSubmit}>
              <div
                className={`flex-1 flex items-center bg-white border border-gray-200 rounded-full shadow-lg px-3 py-2 transition-all duration-300 group
                  ${isSearchFocused ? 'shadow-2xl border-[#185a9d] scale-105 z-10' : 'hover:shadow-2xl hover:border-[#185a9d] hover:scale-105'}
                  md:w-full md:max-w-xl`}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              >
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search jobs, companies, or keywords..."
                  className="flex-1 px-6 py-3 bg-transparent outline-none text-gray-900 text-base rounded-full placeholder-gray-400"
                />
                <div className="h-8 w-px bg-gray-200 mx-3 hidden md:block" />
                <input
                  type="text"
                  value={locationTerm}
                  onChange={e => setLocationTerm(e.target.value)}
                  placeholder="Location (city, state, or remote)"
                  className="flex-1 px-6 py-3 bg-transparent outline-none text-gray-900 text-base rounded-full placeholder-gray-400"
                />
                <button
                  className="ml-2 flex items-center justify-center bg-[#185a9d] hover:bg-[#12406a] text-white rounded-full w-12 h-12 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#185a9d] focus:ring-offset-2"
                  type="submit"
                  aria-label="Search"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </form>
            <button
              ref={filterButtonRef}
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white rounded-full font-semibold shadow transition-all duration-200 text-sm hover:from-[#43cea2] hover:to-[#185a9d] focus:outline-none focus:ring-2 focus:ring-[#185a9d] focus:ring-offset-2"
              onMouseDown={e => { e.stopPropagation(); setShowAdvancedSearch(v => !v); }}
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" /></svg>
              Filters
            </button>
          </div>
        )}
        {/* Advanced Search Dropdown/Panel - now always below the search bar row */}
        {showAdvancedSearch && (
          <div ref={filterPanelRef} className="w-full max-w-2xl mx-auto mt-3 hidden md:block">
            <AdvancedSearch
              filters={filters}
              onChange={handleFilterChange as any}
              onSearch={handleFilterApply}
              onReset={handleFilterReset}
              isOpen={showAdvancedSearch}
              onToggle={handleFilterApply}
              showJobTypeFilter={true}
            />
          </div>
        )}
      </div>

      {/* Main Content - now full width and more responsive */}
      {!isMobile && (
        <div className="w-full px-2 sm:px-4 md:px-8 lg:px-16 xl:px-24 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content Area: Jobs & Internships Combined */}
            <div className="w-full lg:w-[72%] space-y-8">
              <section className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Latest Opportunities</h2>
                </div>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 h-32 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredJobsAndInternships.map((item) => {
                      // Always pass skills as an array of strings
                      const skills = Array.isArray(item.requirements)
                        ? item.requirements.map(r =>
                            typeof r === 'string'
                              ? r
                              : typeof r === 'object' && r !== null && 'name' in r
                                ? r.name
                                : ''
                          ).filter(Boolean)
                        : typeof item.requirements === 'string'
                          ? item.requirements.split(',').map(s => s.trim()).filter(Boolean)
                          : [];
                      return item.postType === 'Job' ? (
                        <JobCardNew key={item.id} job={{
                          id: item.id,
                          title: item.title,
                          company: item.company,
                          companies: { name: item.company, logo_url: item.companyLogo },
                          location: item.location,
                          type: item.type,
                          salary: item.salary,
                          description: item.description,
                          postedDate: item.postedDate,
                          requirements: skills,
                          status: item.status as 'active' | 'paused' | 'closed' | 'expired',
                          experience: item.experience,
                          companyLogo: item.companyLogo,
                          skills,
                        }} />
                      ) : (
                        <InternshipCard key={item.id} internship={{
                          id: item.id,
                          title: item.title,
                          company: item.company,
                          companyLogo: item.companyLogo,
                          internship_type: item.type,
                          stipend_type: 'fixed',
                          min_amount: 0,
                          max_amount: 0,
                          amount: 0,
                          pay_rate: '',
                          duration: '',
                          location: item.location,
                          description: item.description,
                          skills,
                        }} />
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
            {/* Featured Companies */}
            <div className="w-full lg:w-[28%]">
              <section className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Companies</h3>
                <div className="space-y-4">
                  {companies.map((company) => (
                    <div key={company.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                      {company.logo_url && <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{company.name}</div>
                        <div className="text-gray-500 text-xs line-clamp-1">{company.description}</div>
                        {company.website && (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">{company.website.replace(/^https?:\/\//, '')}</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home; 
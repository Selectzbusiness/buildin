import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import AdvancedSearch from '../components/AdvancedSearch';
import NotificationCenter from '../components/NotificationCenter';
import JobCardNew from '../components/JobCardNew';
import { InternshipCard } from '../components/InternshipCard';
import useIsMobile from '../hooks/useIsMobile';
import { FiFilter, FiSearch, FiMapPin, FiBriefcase, FiUsers } from 'react-icons/fi';
import { useJobs } from '../contexts/JobsContext';
import VideoVerifiedTag from '../components/VideoVerifiedTag';

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
  stipend_type?: string;
  min_amount?: number;
  max_amount?: number;
  amount?: number;
  pay_rate?: string;
  skills?: string[];
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
  const { jobs, internships, loading: jobsLoading, error: jobsError, fetchJobs, fetchInternships } = useJobs();
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

  // Filter state
  type FilterState = {
    [key: string]: string;
    jobType: string;
    company: string;
    experienceLevel: string;
    salaryRange: string;
    remoteWork: string;
    industry: string;
    postedDate: string;
  };
  const [filters, setFilters] = useState<FilterState>({
    jobType: '',
    company: '',
    experienceLevel: '',
    salaryRange: '',
    remoteWork: '',
    industry: '',
    postedDate: ''
  });

  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // Mobile filter bar options - dynamically generated from real data
  const filterOptions = [
    { 
      key: 'jobType', 
      label: 'Job Type', 
      values: Array.from(new Set(jobsAndInternships.map(j => j.type).filter(Boolean)))
    },
    { 
      key: 'company', 
      label: 'Company', 
      values: Array.from(new Set(jobsAndInternships.map(j => j.company).filter(Boolean)))
    },
    { 
      key: 'experienceLevel', 
      label: 'Experience Level', 
      values: Array.from(new Set(jobsAndInternships.map(j => j.experience).filter(Boolean)))
    },
    { 
      key: 'salaryRange', 
      label: 'Salary Range', 
      values: ['<20k', '20k-40k', '40k-60k', '60k+']
    },
    { 
      key: 'remoteWork', 
      label: 'Work Mode', 
      values: ['Remote', 'Hybrid', 'Onsite']
    },
    { 
      key: 'industry', 
      label: 'Industry', 
      values: ['IT', 'Finance', 'Healthcare', 'Education', 'Marketing']
    },
    { 
      key: 'postedDate', 
      label: 'Posted Date', 
      values: ['Last 24 hours', 'Last 3 days', 'Last 7 days', 'Last 30 days']
    },
  ];

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Only fetch if context data is empty
    if (jobs.length === 0) fetchJobs().catch(e => isMounted && setError(e.message));
    if (internships.length === 0) fetchInternships().catch(e => isMounted && setError(e.message));
    // Fetch companies as before
    const fetchCompaniesData = async () => {
      try {
        const { data, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, logo_url, website, description')
          .limit(10);
        if (companiesError) throw companiesError;
        if (isMounted) setCompanies(data || []);
      } catch (e: any) {
        if (isMounted) setError(e.message || 'Error fetching companies');
      }
    };
    fetchCompaniesData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    // Always refetch if data is empty (quick fix for browser navigation state loss)
    if (jobs.length === 0) fetchJobs();
    if (internships.length === 0) fetchInternships();
  }, [jobs.length, internships.length, fetchJobs, fetchInternships]);

  useEffect(() => {
    // Combine jobs and internships from context
    const jobsMapped: CombinedOpportunity[] = (jobs || []).map(job => {
      const amount = typeof job.amount === 'number' ? job.amount : 0;
      const min_amount = typeof job.min_amount === 'number' ? job.min_amount : 0;
      const max_amount = typeof job.max_amount === 'number' ? job.max_amount : 0;
      const pay_rate = typeof job.pay_rate === 'string' ? job.pay_rate : '';
      let salary = 'Salary not specified';
      if (min_amount && max_amount && min_amount !== max_amount) {
        salary = `₹${min_amount} - ₹${max_amount}${pay_rate ? ' / ' + pay_rate : ''}`;
      } else if (amount) {
        salary = `₹${amount}${pay_rate ? ' / ' + pay_rate : ''}`;
      }
      return {
        id: job.id,
        title: job.title,
        company: job.company?.name || 'Unknown Company',
        companyLogo: job.company?.logo_url || '',
        location: job.location,
        type: job.job_type,
        amount,
        min_amount,
        max_amount,
        pay_rate,
        salary,
        description: job.description,
        postedDate: job.created_at,
        requirements: Array.isArray((job as any).requirements) ? (job as any).requirements : [],
        status: job.status,
        experience: job.experience_level || '',
        postType: 'Job',
        skills: Array.isArray((job as any).skills) ? (job as any).skills : [],
      };
    });
    const internshipsMapped: CombinedOpportunity[] = (internships || []).map(internship => {
      const amount = typeof internship.amount === 'number' ? internship.amount : 0;
      const pay_rate = typeof internship.pay_rate === 'string' ? internship.pay_rate : '';
      return {
        id: internship.id,
        title: internship.title,
        company: internship.company?.name || 'Unknown Company',
        companyLogo: internship.company?.logo_url || '',
        location: internship.location,
        type: internship.internship_type,
        stipend_type: internship.stipend_type || '',
        min_amount: typeof internship.min_amount === 'number' ? internship.min_amount : 0,
        max_amount: typeof internship.max_amount === 'number' ? internship.max_amount : 0,
        amount,
        pay_rate,
        salary: `${amount} / ${pay_rate}`,
        description: internship.description,
        postedDate: internship.created_at,
        requirements: Array.isArray((internship as any).requirements) ? (internship as any).requirements : [],
        status: internship.status,
        experience: internship.experience_level || '',
        postType: 'Internship',
        duration: String(internship.duration || ''),
        skills: Array.isArray((internship as any).skills) ? (internship as any).skills : [],
      };
    });
    setJobsAndInternships([...jobsMapped, ...internshipsMapped].sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()));
  }, [jobs, internships]);

  useEffect(() => {
    setLoading(jobsLoading);
    if (jobsError) setError(jobsError);
  }, [jobsLoading, jobsError]);

  const stats = [
    { label: 'Active Jobs', value: '2,500+', icon: '💼' },
    { label: 'Companies', value: '500+', icon: '🏢' },
    { label: 'Job Seekers', value: '10,000+', icon: '👥' },
    { label: 'Success Rate', value: '85%', icon: '📈' }
  ];

  // Helper function to format location display
  const formatLocation = (location: Location | string): string => {
    if (typeof location === 'string') {
      return location;
    }
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.area) parts.push(location.area);
    if (location.pincode) parts.push(location.pincode);
    
    return parts.join(', ');
  };

  // Filter data based on search terms and filters
  const filterByAll = (item: CombinedOpportunity): boolean => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(item.requirements) && item.requirements.some(req => 
        typeof req === 'string' && req.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    const matchesLocation = !locationTerm || 
      formatLocation(item.location).toLowerCase().includes(locationTerm.toLowerCase());

    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      
      switch (key) {
        case 'jobType':
          return item.type.toLowerCase().includes(value.toLowerCase());
        case 'company':
          return item.company.toLowerCase().includes(value.toLowerCase());
        case 'experienceLevel':
          return item.experience.toLowerCase().includes(value.toLowerCase());
        case 'salaryRange':
          // Extract numeric value from salary string for comparison
          const salaryMatch = item.salary.match(/(\d+)/);
          if (!salaryMatch) return false;
          const salary = parseInt(salaryMatch[1]);
          
          switch (value) {
            case '<20k': return salary < 20000;
            case '20k-40k': return salary >= 20000 && salary <= 40000;
            case '40k-60k': return salary >= 40000 && salary <= 60000;
            case '60k+': return salary >= 60000;
            default: return true;
          }
        case 'remoteWork':
          // Check if the job type or location contains remote/hybrid keywords
          const locationStr = formatLocation(item.location).toLowerCase();
          const typeStr = item.type.toLowerCase();
          switch (value.toLowerCase()) {
            case 'remote': return locationStr.includes('remote') || typeStr.includes('remote');
            case 'hybrid': return locationStr.includes('hybrid') || typeStr.includes('hybrid');
            case 'onsite': return !locationStr.includes('remote') && !locationStr.includes('hybrid');
            default: return true;
          }
        case 'industry':
          // For now, we'll check if the company or description contains industry keywords
          const description = item.description.toLowerCase();
          const companyName = item.company.toLowerCase();
          switch (value.toLowerCase()) {
            case 'it': return description.includes('software') || description.includes('technology') || description.includes('it') || companyName.includes('tech');
            case 'finance': return description.includes('finance') || description.includes('banking') || description.includes('accounting');
            case 'healthcare': return description.includes('health') || description.includes('medical') || description.includes('care');
            case 'education': return description.includes('education') || description.includes('teaching') || description.includes('school');
            case 'marketing': return description.includes('marketing') || description.includes('advertising') || description.includes('brand');
            default: return true;
          }
        case 'postedDate':
          const daysAgo = (() => {
            const now = new Date();
            const posted = new Date(item.postedDate);
            return Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
          })();
          
          switch (value) {
            case 'Last 24 hours': return daysAgo <= 1;
            case 'Last 3 days': return daysAgo <= 3;
            case 'Last 7 days': return daysAgo <= 7;
            case 'Last 30 days': return daysAgo <= 30;
            default: return true;
          }
        default:
          return true;
      }
    });

    return matchesSearch && matchesLocation && matchesFilters;
  };

  // Get filtered data for mobile
  const filteredMobileData = jobsAndInternships.filter(item => {
    if (activeMobileTab === 'foryou') {
      return filterByAll(item);
    } else if (activeMobileTab === 'jobs') {
      return item.postType === 'Job' && filterByAll(item);
    } else if (activeMobileTab === 'internships') {
      return item.postType === 'Internship' && filterByAll(item);
    }
    return false;
  });

  // Get filtered data for desktop
  const filteredJobsAndInternships = jobsAndInternships.filter(filterByAll);

  // Suggestions for search - dynamically generated from real data
  const designationSuggestions = [
    ...Array.from(new Set(jobsAndInternships.map(j => j.title).filter(Boolean))),
    'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
    'Marketing Manager', 'Sales Representative', 'Content Writer', 'Graphic Designer',
    'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'QA Engineer',
    'Business Analyst', 'Project Manager', 'HR Manager', 'Finance Analyst'
  ];

  const locationSuggestions = [
    ...Array.from(new Set(jobsAndInternships.map(j => formatLocation(j.location)).filter(Boolean))),
    'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
    'Chennai, Tamil Nadu', 'Pune, Maharashtra', 'Kolkata, West Bengal', 'Ahmedabad, Gujarat',
    'Remote', 'Work from Home', 'Hybrid', 'On-site'
  ];

  const filteredDesignationSuggestions = designationSuggestions.filter(d => 
    d.toLowerCase().includes(modalDesignation.toLowerCase())
  );

  const filteredLocationSuggestions = locationSuggestions.filter(l => 
    l.toLowerCase().includes(modalLocation.toLowerCase())
  );

  const handleToggleFilters = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowAdvancedSearch(v => !v);
  };

  const handleFilterChange = (newFilters: typeof filters) => setFilters(newFilters);

  const handleFilterApply = () => setShowAdvancedSearch(false);

  const handleFilterReset = () => setFilters({
    jobType: '',
    company: '',
    experienceLevel: '',
    salaryRange: '',
    remoteWork: '',
    industry: '',
    postedDate: ''
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search logic is handled by the filter function
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node) &&
          filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
        setShowAdvancedSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing recent searches:', e);
      }
    }
  }, []);

  const saveRecentSearch = (designation: string, location: string, type: string) => {
    const newSearch = { designation, location, type };
    const updated = [newSearch, ...recentSearches.filter(s => 
      !(s.designation === designation && s.location === location && s.type === type)
    )].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  return (
    <>
      {/* Header Section with Search */}
      <div className="relative">
        {/* Mobile Search Bar - Airbnb Style */}
        {isMobile && (
          <>
            {/* Minimalist Hero Section: Light blue, rounded, only around the search bar */}
            <div className="w-full flex flex-col items-center mt-4 mb-4">
              <div className="max-w-md w-full bg-blue-50 rounded-3xl shadow-lg px-3 py-3 mx-auto" style={{marginBottom: '1.5rem'}}>
                {/* Airbnb-style Search Bar */}
                <div className="w-full flex items-center justify-center">
                  <div 
                    className="bg-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm cursor-pointer transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full"
                    onClick={() => setShowMobileSearchModal(true)}
                    style={{ minHeight: '56px' }}
                  >
                    <div className="flex items-center p-4">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 bg-ocean-dark rounded-full flex items-center justify-center">
                          <FiSearch className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <span className={`text-base font-semibold ${searchTerm ? 'text-gray-900' : 'text-gray-500'} truncate`}>
                            {searchTerm || 'What role are you looking for?'}
                          </span>
                          <span className={`text-sm ${locationTerm ? 'text-gray-700' : 'text-gray-400'} truncate`}>
                            {locationTerm || 'Add location'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <FiFilter className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Search Modal - Enhanced */}
            {showMobileSearchModal && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center animate-fade-in">
                <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-20">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Search Opportunities</h2>
                      <button
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                        onClick={() => setShowMobileSearchModal(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Modal Content (scrollable) */}
                  <div className="px-6 py-4 space-y-6 overflow-y-auto flex-1">
                    {/* Type Selector */}
                    <div className="flex bg-gray-100 rounded-2xl p-1">
                      {['jobs', 'internships'].map(type => (
                        <button
                          key={type}
                          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            modalType === type 
                              ? 'bg-white text-ocean-dark shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          onClick={() => setModalType(type as 'jobs' | 'internships')}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Search Fields */}
                    <div className="space-y-4">
                      {/* Role/Designation Field */}
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <FiBriefcase className="inline w-4 h-4 mr-1" />
                          Role or Skills
                        </label>
                        <div className="relative">
                          <input
                            className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-base placeholder-gray-400 focus:ring-2 focus:ring-ocean-dark focus:border-ocean-dark transition-all"
                            placeholder="e.g., Software Engineer, React, Marketing"
                            value={modalDesignation}
                            onChange={e => { setModalDesignation(e.target.value); setShowDesignationSuggestions(true); }}
                            onFocus={() => setShowDesignationSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowDesignationSuggestions(false), 100)}
                            autoFocus
                          />
                          {modalDesignation && (
                            <button
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors"
                              onClick={() => setModalDesignation('')}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        {/* Suggestions Dropdown */}
                        {showDesignationSuggestions && filteredDesignationSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full bg-white border-2 border-ocean-dark rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {filteredDesignationSuggestions.map((suggestion, i) => (
                              <div
                                key={i}
                                className="px-4 py-3 hover:bg-ocean-dark/5 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                onMouseDown={() => { setModalDesignation(suggestion); setShowDesignationSuggestions(false); }}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Location Field */}
                      <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <FiMapPin className="inline w-4 h-4 mr-1" />
                          Location
                        </label>
                        <div className="relative">
                          <input
                            className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-base placeholder-gray-400 focus:ring-2 focus:ring-ocean-dark focus:border-ocean-dark transition-all"
                            placeholder="e.g., Mumbai, Remote, Hybrid"
                            value={modalLocation}
                            onChange={e => { setModalLocation(e.target.value); setShowLocationSuggestions(true); }}
                            onFocus={() => setShowLocationSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 100)}
                          />
                          {modalLocation && (
                            <button
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors"
                              onClick={() => setModalLocation('')}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        {/* Location Suggestions */}
                        {showLocationSuggestions && filteredLocationSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full bg-white border-2 border-ocean-dark rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {filteredLocationSuggestions.map((suggestion, i) => (
                              <div
                                key={i}
                                className="px-4 py-3 hover:bg-ocean-dark/5 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                onMouseDown={() => { setModalLocation(suggestion); setShowLocationSuggestions(false); }}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Searches</h3>
                        <div className="space-y-2">
                          {recentSearches.map((search, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                              <button
                                className="flex-1 flex items-center text-left gap-3"
                                onClick={() => {
                                  setModalDesignation(search.designation);
                                  setModalLocation(search.location);
                                  setModalType(search.type as 'jobs' | 'internships');
                                }}
                              >
                                <div className="w-8 h-8 bg-ocean-dark/10 rounded-full flex items-center justify-center">
                                  <FiSearch className="w-4 h-4 text-ocean-dark" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{search.designation || 'Any role'}</div>
                                  {search.location && <div className="text-sm text-gray-500">in {search.location}</div>}
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-ocean-dark/10 text-ocean-dark font-medium">
                                  {search.type.charAt(0).toUpperCase() + search.type.slice(1)}
                                </span>
                              </button>
                              <button
                                className="ml-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors"
                                onClick={() => {
                                  const updated = recentSearches.filter((_, idx) => idx !== i);
                                  setRecentSearches(updated);
                                  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
                                }}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Sticky Search Button */}
                  <div className="px-6 pb-6 bg-white sticky bottom-0 z-30">
                    <button
                      className="w-full bg-gradient-to-r from-ocean-dark to-ocean-light hover:from-ocean-light hover:to-ocean-dark text-white rounded-xl py-4 font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => {
                        setActiveMobileTab(modalType);
                        setSearchTerm(modalDesignation);
                        setLocationTerm(modalLocation);
                        setShowMobileSearchModal(false);
                        saveRecentSearch(modalDesignation, modalLocation, modalType);
                      }}
                    >
                      <FiSearch className="w-5 h-5" />
                      Search {modalType === 'jobs' ? 'Jobs' : 'Internships'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Mobile Tabs */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
              <div className="flex justify-center items-center px-4 py-3">
                <div className="flex bg-gray-100 rounded-2xl p-1 w-full max-w-sm">
                  {[
                    { key: 'foryou', label: 'For You', icon: '⭐' },
                    { key: 'jobs', label: 'Jobs', icon: '💼' },
                    { key: 'internships', label: 'Internships', icon: '🎓' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-1 ${
                        activeMobileTab === tab.key 
                          ? 'bg-white text-ocean-dark shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveMobileTab(tab.key as 'foryou' | 'jobs' | 'internships')}
                    >
                      <span className="text-xs">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Mobile Filters Bar */}
            <div className="bg-white border-b border-gray-100 sticky top-[60px] z-20">
              <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto">
                <button
                  className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors flex-shrink-0 ${
                    showMobileFilterModal || Object.values(filters).some(value => value)
                      ? 'bg-ocean-dark/10 text-ocean-dark border-ocean-dark/20 hover:bg-ocean-dark/20'
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                  onClick={() => setShowMobileFilterModal(true)}
                >
                  <FiFilter className="w-5 h-5" />
                </button>
                
                {/* Active Filters */}
                {Object.entries(filters).map(([key, value]) => value && (
                  <span key={key} className="bg-ocean-dark/10 text-ocean-dark rounded-full px-3 py-1 text-xs font-medium border border-ocean-dark/20 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                    {filterOptions.find(opt => opt.key === key)?.label || key}: {value}
                    <button
                      type="button"
                      className="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${key} filter`}
                      onClick={() => setFilters(f => ({ ...f, [key]: '' }))}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Enhanced Mobile Filter Modal */}
            {showMobileFilterModal && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
                <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                      <button
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                        onClick={() => setShowMobileFilterModal(false)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="px-6 py-4 space-y-6 max-h-[48vh] overflow-y-auto flex-1">
                    {filterOptions.map(opt => (
                      <div key={opt.key}>
                        <div className="font-semibold text-gray-900 mb-3">{opt.label}</div>
                        <div className="flex flex-wrap gap-2">
                          {opt.values.map(val => (
                            <button
                              key={val}
                              type="button"
                              className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                                filters[opt.key] === val 
                                  ? 'bg-ocean-dark text-white border-ocean-dark' 
                                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-ocean-dark/50'
                              }`}
                              onClick={() => setFilters(f => ({ ...f, [opt.key]: f[opt.key] === val ? '' : val }))}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-gray-100 px-6 pb-6 bg-white sticky bottom-0">
                    <button
                      type="button"
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold border border-gray-200 hover:bg-gray-200 transition-colors"
                      onClick={() => setFilters({ jobType: '', company: '', experienceLevel: '', salaryRange: '', remoteWork: '', industry: '', postedDate: '' })}
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-4 py-3 rounded-xl bg-ocean-dark text-white font-semibold shadow-lg hover:bg-ocean-light transition-colors"
                      onClick={() => setShowMobileFilterModal(false)}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Mobile Content */}
            <div className="bg-gray-50 min-h-screen">
              <div className="max-w-md mx-auto py-4 px-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredMobileData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-ocean-dark/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiSearch className="w-8 h-8 text-ocean-dark" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or filters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMobileData.map((item: CombinedOpportunity) => (
                      <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transform transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                        {item.postType === 'Job' ? (
                          <JobCardNew job={item as any} />
                        ) : (
                          <InternshipCard internship={{
                            ...(item as any),
                            internship_type: String((item as any).internship_type ?? (item as any).type ?? ''),
                            stipend_type: String((item as any).stipend_type ?? ''),
                            min_amount: typeof (item as any).min_amount === 'number' ? (item as any).min_amount : 0,
                            max_amount: typeof (item as any).max_amount === 'number' ? (item as any).max_amount : 0,
                            duration: String((item as any).duration || ''),
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Desktop Search Bar - Keep existing */}
        {!isMobile && (
          <div className="w-full max-w-xl mx-auto hidden md:flex flex-row items-center gap-4 mt-6">
            <form className="flex-1 flex items-center" onSubmit={handleSearchSubmit}>
              <div
                className={`flex-1 flex items-center bg-white border border-gray-200 rounded-full shadow-lg px-3 py-2 transition-all duration-300 group
                  ${isSearchFocused ? 'shadow-2xl border-ocean-dark scale-105 z-10' : 'hover:shadow-2xl hover:border-ocean-dark hover:scale-105'}
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
                  className="ml-2 flex items-center justify-center bg-ocean-dark hover:bg-ocean-light text-white rounded-full w-12 h-12 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ocean-dark focus:ring-offset-2"
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
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-ocean-dark to-ocean-light text-white rounded-full font-semibold shadow transition-all duration-200 text-sm hover:from-ocean-light hover:to-ocean-dark focus:outline-none focus:ring-2 focus:ring-ocean-dark focus:ring-offset-2"
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
                ) : error ? (
                  <div className="text-center text-red-600 py-4">{error}</div>
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
                          stipend_type: item.stipend_type ?? '',
                          min_amount: typeof item.min_amount === 'number' ? item.min_amount : 0,
                          max_amount: typeof item.max_amount === 'number' ? item.max_amount : 0,
                          amount: typeof item.amount === 'number' ? item.amount : 0,
                          pay_rate: item.pay_rate || '',
                          duration: String(item.duration || ''),
                          location: item.location,
                          description: item.description,
                          skills: Array.isArray(item.skills) ? item.skills : [],
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
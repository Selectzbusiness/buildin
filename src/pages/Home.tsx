import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import AdvancedSearch from '../components/AdvancedSearch';
import NotificationCenter from '../components/NotificationCenter';
import MessagingSystem from '../components/MessagingSystem';
import JobCardNew from '../components/JobCardNew';
import { InternshipCard } from '../components/InternshipCard';

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
}

// Helper to get company field (name/logo_url) from companies relation
function getCompanyField(companies: any, field: 'name' | 'logo_url'): string {
  if (!companies) return '';
  if (Array.isArray(companies)) {
    return companies[0]?.[field] || '';
  }
  return companies[field] || '';
}

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

  // Filter state (add jobType)
  const [filters, setFilters] = useState({
    jobType: '',
    experienceLevel: '',
    salaryRange: '',
    remoteWork: '',
    industry: '',
    postedDate: ''
  });

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

  // Filtering logic
  const filteredJobsAndInternships = jobsAndInternships.filter(item => {
    let matches = true;
    if (filters.jobType) {
      if (filters.jobType === 'jobs') matches = matches && item.postType === 'Job';
      if (filters.jobType === 'internships') matches = matches && item.postType === 'Internship';
    }
    if (filters.experienceLevel) {
      matches = matches && (item.experience || '').toLowerCase().includes(filters.experienceLevel.toLowerCase());
    }
    if (filters.salaryRange) {
      // Implement salary filtering logic as per your data structure
    }
    if (filters.remoteWork) {
      matches = matches && (item.type || '').toLowerCase().includes(filters.remoteWork.toLowerCase());
    }
    if (filters.industry) {
      matches = matches && ('industry' in item && (item as any).industry ? (item as any).industry.toLowerCase().includes(filters.industry.toLowerCase()) : true);
    }
    if (filters.postedDate) {
      // Implement posted date filtering logic as per your data structure
    }
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

  return (
    <>
      {/* Modern, large, centered Search Bar with Filters and AI Match to the right */}
      <div className="w-full flex flex-col items-center justify-center mt-10 mb-10 px-2">
        {/* Search bar row */}
        <div className="w-full max-w-xl mx-auto flex flex-row items-center gap-4">
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
        {/* Advanced Search Dropdown/Panel - now always below the search bar row */}
        {showAdvancedSearch && (
          <div ref={filterPanelRef} className="w-full max-w-2xl mx-auto mt-3">
            <AdvancedSearch
              filters={filters}
              onChange={handleFilterChange}
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
    </>
  );
};

export default Home; 
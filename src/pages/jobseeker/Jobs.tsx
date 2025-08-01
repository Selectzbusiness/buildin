import React, { useEffect, useState } from 'react';
import { useJobs } from '../../contexts/JobsContext';
import JobCardNew from '../../components/JobCardNew';
import FilterBar from '../../components/FilterBar';
import SearchBar from '../../components/SearchBar';
import useIsMobile from '../../hooks/useIsMobile';

// Define the Job interface that matches what's used in JobsContext
interface Job {
  id: string;
  title: string;
  description: string;
  job_type: string;
  location: {
    city: string;
    area: string;
  };
  pay_type: string;
  min_amount: number;
  max_amount: number;
  amount: number;
  pay_rate: string;
  status: string;
  created_at: string;
  company?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  experience_level?: string;
}

// Define the Job interface that JobCardNew expects
interface JobCardJob {
  id: string;
  title: string;
  company: string;
  location: string | {
    area?: string;
    city?: string;
    pincode?: string;
    streetAddress?: string;
  };
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

const Jobs: React.FC = () => {
  const { jobs, loading, error, fetchJobs } = useJobs();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    company: '',
    minSalary: '',
    maxSalary: '',
    experience: '',
    sort: '',
  });
  const isMobile = useIsMobile();
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [showMobileSearchModal, setShowMobileSearchModal] = useState(false);

  useEffect(() => {
    if (jobs.length === 0 && !loading) fetchJobs();
  }, [fetchJobs, jobs.length, loading]);

  // Unique filter options
  const uniqueLocations = Array.from(new Set(jobs.map(job => job.location?.city).filter((city): city is string => Boolean(city))));
  const uniqueTypes = Array.from(new Set(jobs.map(job => job.job_type).filter((type): type is string => Boolean(type))));
  const uniqueCompanies = Array.from(new Set(jobs.map(job => job.company?.name).filter((name): name is string => Boolean(name))));

  // Filtering logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filters.type || job.job_type === filters.type;
    const matchesLocation = !filters.location || job.location?.city === filters.location;
    const matchesCompany = !filters.company || job.company?.name === filters.company;
    const matchesMinSalary = !filters.minSalary || (job.min_amount || 0) >= Number(filters.minSalary);
    const matchesMaxSalary = !filters.maxSalary || (job.max_amount || job.amount || 0) <= Number(filters.maxSalary);
    const matchesExperience = !filters.experience || (job.experience_level && job.experience_level.includes(filters.experience));
    return matchesSearch && matchesType && matchesLocation && matchesCompany && matchesMinSalary && matchesMaxSalary && matchesExperience;
  });

  // Sorting
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (filters.sort === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (filters.sort === 'salary') {
      return (b.max_amount || b.amount || 0) - (a.max_amount || a.amount || 0);
    }
    // Default or relevance
    return 0;
  });

  // Transform jobs to match JobCardNew interface
  const transformedJobs: JobCardJob[] = sortedJobs.map(job => {
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
      location: job.location,
      type: job.job_type,
      salary,
      description: job.description,
      postedDate: job.created_at,
      requirements: [], // Add requirements if available in your database
      status: job.status as 'active' | 'paused' | 'closed' | 'expired',
      experience: job.experience_level || 'Experience not specified',
      companies: job.company ? {
        name: job.company.name,
        logo_url: job.company.logo_url || ''
      } : undefined,
      companyLogo: job.company?.logo_url
    };
  });

  // For mobile: show selected filters as chips
  const filterChips = Object.entries(filters).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {isMobile ? (
        <>
          {/* Mobile Brand Title */}
          <div className="w-full flex justify-center pt-6 pb-2">
            <span className="text-3xl font-extrabold tracking-tight text-blue-700 drop-shadow-sm select-none">Selectz</span>
          </div>
          {/* Mobile Search Bar */}
          <div className="flex flex-col gap-2 pt-4 px-0 w-full sticky top-0 z-40 bg-[#f8fafc]">
            <div
              className="flex items-center w-full bg-white rounded-full shadow-lg border border-gray-200 px-5 py-4 cursor-pointer active:scale-95 transition-all duration-100"
              onClick={() => setShowMobileSearchModal(true)}
              role="button"
              tabIndex={0}
              aria-label="Open search"
              style={{ minHeight: '64px' }}
            >
              <svg className="w-7 h-7 text-gray-400 mr-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-2-2" />
              </svg>
              <div className="flex flex-col flex-1">
                <span className={`text-lg font-medium ${searchTerm ? 'text-gray-900' : 'text-gray-400'}`}
                  style={{lineHeight: '1.3'}}>
                  {searchTerm || 'Job title, keywords, or company'}
                </span>
                <span className="text-lg font-medium text-gray-400" style={{lineHeight: '1.3'}}>
                  Enter city or locality
                </span>
              </div>
            </div>
          </div>
          {/* Mobile Filter Bar */}
          <div className="sticky top-[140px] z-20 bg-[#f8fafc] w-full flex items-center gap-2 px-2 py-2 border-b border-gray-100 overflow-x-auto">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
              onClick={() => setShowMobileFilterModal(true)}
              aria-label="Open filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            {filterChips.map((chip, i) => (
              <span key={i} className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-medium mr-2 whitespace-nowrap">{chip}</span>
            ))}
          </div>
          {/* Mobile Filter Modal (simple version) */}
          {showMobileFilterModal && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-6 w-11/12 max-w-md shadow-lg relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 text-xl"
                  onClick={() => setShowMobileFilterModal(false)}
                  aria-label="Close filter modal"
                >
                  &times;
                </button>
                <div className="text-lg font-semibold mb-4">Filter jobs</div>
                <FilterBar
                  filters={filters}
                  onChange={setFilters}
                  locations={uniqueLocations}
                  types={uniqueTypes}
                  companies={uniqueCompanies}
                />
                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200"
                    onClick={() => setFilters({ type: '', location: '', company: '', minSalary: '', maxSalary: '', experience: '', sort: '' })}
                  >Clear all</button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-blue-600 text-white font-semibold shadow"
                    onClick={() => setShowMobileFilterModal(false)}
                  >Apply filters</button>
                </div>
              </div>
            </div>
          )}
          {/* Mobile Job Cards */}
          <div className="w-full flex flex-col gap-6 pb-28 pt-2">
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow animate-pulse h-32" />
                ))}
              </div>
            ) : transformedJobs.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-lg">No jobs found.</div>
            ) : (
              transformedJobs.map(job => (
                <div key={job.id} className="rounded-2xl shadow-lg border border-gray-100 bg-white p-2 mx-2">
                  <JobCardNew job={job} />
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        // Desktop view (unchanged)
        <div className="min-h-screen bg-[#f1f5f9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar Filters */}
              <div className="md:w-1/4 w-full">
                <FilterBar
                  filters={filters}
                  onChange={setFilters}
                  locations={uniqueLocations}
                  types={uniqueTypes}
                  companies={uniqueCompanies}
                />
              </div>
              {/* Main Content */}
              <div className="flex-1">
                {/* Search Bar */}
                <div className="mb-8">
                  <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search jobs by title, company, or description..."
                    className="max-w-2xl mx-auto"
                  />
                </div>
                {/* Results */}
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Available Jobs</h2>
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-white p-6 rounded-2xl shadow animate-pulse h-48" />
                    ))}
                  </div>
                ) : transformedJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
                    <div className="mb-4 text-4xl">🔍</div>
                    <div className="font-semibold mb-2">No jobs found</div>
                    <div>Try adjusting your search or filters.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    {transformedJobs.map(job => (
                      <JobCardNew key={job.id} job={job} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {error && <div className="text-red-500 text-center mt-4">{error} <button onClick={fetchJobs} className="underline text-blue-600">Retry</button></div>}
    </div>
  );
};

export default Jobs; 
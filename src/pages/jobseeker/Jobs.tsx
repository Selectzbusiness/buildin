import React, { useEffect, useState } from 'react';
import { useJobs } from '../../contexts/JobsContext';
import JobCardNew from '../../components/JobCardNew';
import FilterBar from '../../components/FilterBar';
import SearchBar from '../../components/SearchBar';

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

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
  const transformedJobs: JobCardJob[] = sortedJobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company?.name || 'Unknown Company',
    location: job.location,
    type: job.job_type,
    salary: job.amount && job.pay_rate ? `${job.amount} / ${job.pay_rate}` : 'Salary not specified',
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
  }));

  return (
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
  );
};

export default Jobs; 
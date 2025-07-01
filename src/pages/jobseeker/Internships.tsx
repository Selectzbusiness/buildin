import React, { useEffect, useState } from 'react';
import { useJobs } from '../../contexts/JobsContext';
import { InternshipCard } from '../../components/InternshipCard';
import FilterBar from '../../components/FilterBar';
import SearchBar from '../../components/SearchBar';

// Define the Internship interface that matches what's used in JobsContext
interface Internship {
  id: string;
  title: string;
  description: string;
  internship_type: string;
  location: {
    city: string;
    area: string;
  };
  stipend_type: string;
  min_amount: number;
  max_amount: number;
  amount: number;
  pay_rate: string;
  duration: string;
  status: string;
  created_at: string;
  company?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  experience_level?: string;
}

// Define the Internship interface that InternshipCard expects
interface InternshipCardInternship {
  id: string;
  title: string;
  description: string;
  internship_type: string;
  location: {
    city: string;
    area: string;
    pincode?: string;
    streetAddress?: string;
  } | string;
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

const Internships: React.FC = () => {
  const { internships, loading, error, fetchInternships } = useJobs();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    company: '',
    minSalary: '',
    maxSalary: '',
    duration: '',
    sort: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Attempting to fetch internships...');
        await fetchInternships();
        console.log('Fetch internships completed.');
      } catch (err) {
        console.error('Error loading internships in Internships.tsx:', err);
      }
    };
    loadData();
  }, [fetchInternships]);

  // Unique filter options
  const uniqueLocations = Array.from(new Set(internships.map(internship => internship.location?.city).filter((city): city is string => Boolean(city))));
  const uniqueTypes = Array.from(new Set(internships.map(internship => internship.internship_type).filter((type): type is string => Boolean(type))));
  const uniqueCompanies = Array.from(new Set(internships.map(internship => internship.company?.name).filter((name): name is string => Boolean(name))));
  const uniqueDurations = Array.from(new Set(internships.map(internship => internship.duration).filter((duration): duration is string => Boolean(duration))));

  // Filtering logic
  const filteredInternships = internships.filter(internship => {
    const matchesSearch =
      internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (internship.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filters.type || internship.internship_type === filters.type;
    const matchesLocation = !filters.location || internship.location?.city === filters.location;
    const matchesCompany = !filters.company || internship.company?.name === filters.company;
    const matchesMinSalary = !filters.minSalary || (internship.min_amount || 0) >= Number(filters.minSalary);
    const matchesMaxSalary = !filters.maxSalary || (internship.max_amount || internship.amount || 0) <= Number(filters.maxSalary);
    const matchesDuration = !filters.duration || internship.duration === filters.duration;
    return matchesSearch && matchesType && matchesLocation && matchesCompany && matchesMinSalary && matchesMaxSalary && matchesDuration;
  });

  // Sorting
  const sortedInternships = [...filteredInternships].sort((a, b) => {
    if (filters.sort === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (filters.sort === 'salary') {
      return (b.max_amount || b.amount || 0) - (a.max_amount || a.amount || 0);
    }
    // Default or relevance
    return 0;
  });

  // Transform internships to match InternshipCard interface
  const transformedInternships: InternshipCardInternship[] = sortedInternships.map(internship => ({
    id: internship.id,
    title: internship.title,
    description: internship.description,
    internship_type: internship.internship_type,
    location: internship.location,
    stipend_type: internship.stipend_type,
    min_amount: internship.min_amount,
    max_amount: internship.max_amount,
    amount: internship.amount,
    pay_rate: internship.pay_rate,
    duration: internship.duration,
    company: internship.company?.name || 'Unknown Company',
    companyLogo: internship.company?.logo_url,
    skills: [] // Add skills if available in your database
  }));

  if (error) {
    return (
      <div className="min-h-screen bg-[#f1f5f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

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
              durations={uniqueDurations}
            />
          </div>
          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-8">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search internships by title, company, or description..."
                className="max-w-2xl mx-auto"
              />
            </div>
            {/* Results */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Available Internships</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow animate-pulse h-48" />
                ))}
              </div>
            ) : transformedInternships.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
                <div className="mb-4 text-4xl">🔍</div>
                <div className="font-semibold mb-2">No internships found</div>
                <div>Try adjusting your search or filters.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {transformedInternships.map(internship => (
                  <InternshipCard key={internship.id} internship={internship} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Internships; 
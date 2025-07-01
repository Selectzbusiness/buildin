import React, { useEffect, useRef } from 'react';

interface SearchFilters {
  jobType: string;
  experienceLevel: string;
  salaryRange: string;
  remoteWork: string;
  industry: string;
  postedDate: string;
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  showJobTypeFilter?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ filters, onChange, onSearch, onReset, loading = false, isOpen, onToggle, showJobTypeFilter }) => {
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleReset = () => {
    onReset();
  };

  if (!isOpen) return null;

  return (
    <div ref={filterRef} className="w-full max-w-2xl mx-auto mt-3 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-4 animate-fade-in">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Advanced Filters</h3>
              <p className="text-sm text-gray-500">Refine your search with detailed filters</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Filter Grid - Horizontal Layout */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Job Type */}
          {showJobTypeFilter && (
            <div>
              <label className="block text-sm font-medium text-[#185a9d] mb-1">Job Type</label>
              <select
                name="jobType"
                value={filters.jobType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-[#185a9d]/20 focus:border-[#185a9d] focus:ring-[#185a9d]/20 hover:border-[#43cea2] transition-all duration-200 shadow-sm bg-gradient-to-r from-[#f4f8fb] to-[#f0f9ff] text-[#185a9d] text-sm"
              >
                <option value="">All</option>
                <option value="jobs">Jobs</option>
                <option value="internships">Internships</option>
              </select>
            </div>
          )}
          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-[#185a9d] mb-1">Experience</label>
            <select
              name="experienceLevel"
              value={filters.experienceLevel}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#185a9d]/20 focus:border-[#185a9d] focus:ring-[#185a9d]/20 hover:border-[#43cea2] transition-all duration-200 shadow-sm bg-gradient-to-r from-[#f4f8fb] to-[#f0f9ff] text-[#185a9d] text-sm"
            >
              <option value="">All</option>
              <option value="fresher">Fresher</option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5-10">5-10 years</option>
              <option value="10-15">10-15 years</option>
              <option value="15-25">15-25 years</option>
              <option value="25+">25+ years</option>
            </select>
          </div>
          {/* Salary Range */}
          <div>
            <label className="block text-sm font-medium text-[#185a9d] mb-1">Salary Range</label>
            <select
              name="salaryRange"
              value={filters.salaryRange}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#185a9d]/20 focus:border-[#185a9d] focus:ring-[#185a9d]/20 hover:border-[#43cea2] transition-all duration-200 shadow-sm bg-gradient-to-r from-[#f4f8fb] to-[#f0f9ff] text-[#185a9d] text-sm"
            >
              <option value="">Any Salary</option>
              <option value="0-30000">$0 - $30,000</option>
              <option value="30000-50000">$30,000 - $50,000</option>
              <option value="50000-75000">$50,000 - $75,000</option>
              <option value="75000-100000">$75,000 - $100,000</option>
              <option value="100000+">$100,000+</option>
            </select>
          </div>
          {/* Remote Work */}
          <div>
            <label className="block text-sm font-medium text-[#185a9d] mb-1">Remote Work</label>
            <select
              name="remoteWork"
              value={filters.remoteWork}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#185a9d]/20 focus:border-[#185a9d] focus:ring-[#185a9d]/20 hover:border-[#43cea2] transition-all duration-200 shadow-sm bg-gradient-to-r from-[#f4f8fb] to-[#f0f9ff] text-[#185a9d] text-sm"
            >
              <option value="">Any</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site Only</option>
            </select>
          </div>
          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-[#185a9d] mb-1">Industry</label>
            <select
              name="industry"
              value={filters.industry}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#185a9d]/20 focus:border-[#185a9d] focus:ring-[#185a9d]/20 hover:border-[#43cea2] transition-all duration-200 shadow-sm bg-gradient-to-r from-[#f4f8fb] to-[#f0f9ff] text-[#185a9d] text-sm"
            >
              <option value="">All Industries</option>
              <option value="it">IT</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </select>
          </div>
          {/* Posted Date */}
          <div>
            <label className="block text-sm font-medium text-[#185a9d] mb-1">Posted Date</label>
            <select
              name="postedDate"
              value={filters.postedDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-[#185a9d]/20 focus:border-[#185a9d] focus:ring-[#185a9d]/20 hover:border-[#43cea2] transition-all duration-200 shadow-sm bg-gradient-to-r from-[#f4f8fb] to-[#f0f9ff] text-[#185a9d] text-sm"
            >
              <option value="">Any Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="3months">Last 3 Months</option>
            </select>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={handleReset}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-200 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear All
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white py-2 px-4 rounded-lg hover:from-[#43cea2] hover:to-[#185a9d] disabled:bg-gray-400 transition-all duration-200 font-medium shadow hover:scale-105 text-sm"
          >
            {loading ? 'Searching...' : 'Apply Filters'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdvancedSearch; 
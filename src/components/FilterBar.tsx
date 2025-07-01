import React, { useState } from 'react';

interface FilterBarProps {
  filters: any;
  onChange: (filters: any) => void;
  locations: string[];
  types: string[];
  companies: string[];
  durations?: string[]; // Optional for internships
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, locations, types, companies, durations }) => {
  const [minSalary, setMinSalary] = useState(filters.minSalary || '');
  const [maxSalary, setMaxSalary] = useState(filters.maxSalary || '');

  const handleReset = () => {
    const resetFilters: any = { search: '', location: '', type: '', company: '', minSalary: '', maxSalary: '', experience: '', sort: '' };
    if (durations) {
      resetFilters.duration = '';
    }
    onChange(resetFilters);
    setMinSalary('');
    setMaxSalary('');
  };

  return (
    <aside className="w-full md:w-64 bg-white rounded-2xl shadow-md p-6 mb-6 md:mb-0 sticky top-8">
      <h3 className="text-lg font-bold mb-4 text-[#185a9d]">Filters</h3>
      {/* Job/Internship Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {durations ? 'Internship Type' : 'Job Type'}
        </label>
        <select
          className="w-full rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-[#43cea2]"
          value={filters.type}
          onChange={e => onChange({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          {types.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-[#43cea2]"
          list="locations"
          value={filters.location}
          onChange={e => onChange({ ...filters, location: e.target.value })}
          placeholder="Type or select..."
        />
        <datalist id="locations">
          {locations.map(loc => <option key={loc} value={loc} />)}
        </datalist>
      </div>
      {/* Company */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-[#43cea2]"
          list="companies"
          value={filters.company}
          onChange={e => onChange({ ...filters, company: e.target.value })}
          placeholder="Type or select..."
        />
        <datalist id="companies">
          {companies.map(c => <option key={c} value={c} />)}
        </datalist>
      </div>
      {/* Duration (for internships) */}
      {durations && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <select
            className="w-full rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-[#43cea2]"
            value={filters.duration}
            onChange={e => onChange({ ...filters, duration: e.target.value })}
          >
            <option value="">All Durations</option>
            {durations.map(duration => <option key={duration} value={duration}>{duration}</option>)}
          </select>
        </div>
      )}
      {/* Salary Range */}
      <div className="mb-4 flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {durations ? 'Min Stipend' : 'Min Salary'}
          </label>
          <input
            type="number"
            className="w-full rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-[#43cea2]"
            value={minSalary}
            onChange={e => { setMinSalary(e.target.value); onChange({ ...filters, minSalary: e.target.value }); }}
            placeholder="0"
            min={0}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {durations ? 'Max Stipend' : 'Max Salary'}
          </label>
          <input
            type="number"
            className="w-full rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-[#43cea2]"
            value={maxSalary}
            onChange={e => { setMaxSalary(e.target.value); onChange({ ...filters, maxSalary: e.target.value }); }}
            placeholder="Any"
            min={0}
          />
        </div>
      </div>
      {/* Experience (only for jobs) */}
      {!durations && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
          <select
            className="w-full rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-[#43cea2]"
            value={filters.experience}
            onChange={e => onChange({ ...filters, experience: e.target.value })}
          >
            <option value="">Any</option>
            <option value="0-1">0-1 years</option>
            <option value="1-3">1-3 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5+">5+ years</option>
          </select>
        </div>
      )}
      {/* Sort By */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
        <select
          className="w-full rounded-lg border border-gray-200 py-2 px-3 focus:ring-2 focus:ring-[#43cea2]"
          value={filters.sort}
          onChange={e => onChange({ ...filters, sort: e.target.value })}
        >
          <option value="">Default</option>
          <option value="newest">Newest</option>
          <option value="salary">Salary</option>
          <option value="relevance">Relevance</option>
        </select>
      </div>
      {/* Reset Button */}
      <button
        className="w-full mt-2 py-2 rounded-lg bg-gray-100 text-[#185a9d] font-semibold hover:bg-gray-200 transition"
        onClick={handleReset}
        type="button"
      >
        Reset Filters
      </button>
    </aside>
  );
};

export default FilterBar; 
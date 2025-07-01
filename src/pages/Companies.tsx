import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Company {
  id: number;
  name: string;
  industry: string;
  location: string;
  size: string;
  description: string;
  openPositions: number;
}

const Companies: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  // Mock data - replace with actual API call
  const companies: Company[] = [
    {
      id: 1,
      name: 'Tech Corp',
      industry: 'Technology',
      location: 'San Francisco, CA',
      size: '500-1000',
      description: 'Leading technology company specializing in cloud solutions and AI.',
      openPositions: 15
    },
    {
      id: 2,
      name: 'Design Studio',
      industry: 'Design',
      location: 'New York, NY',
      size: '50-200',
      description: 'Creative design agency focused on user experience and digital products.',
      openPositions: 8
    },
    {
      id: 3,
      name: 'AI Solutions',
      industry: 'Technology',
      location: 'Seattle, WA',
      size: '200-500',
      description: 'Pioneering AI research and development company.',
      openPositions: 12
    },
    {
      id: 4,
      name: 'Growth Co',
      industry: 'Marketing',
      location: 'Chicago, IL',
      size: '50-200',
      description: 'Digital marketing agency helping businesses scale their online presence.',
      openPositions: 6
    }
  ];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Discover Top Companies
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Explore companies that match your career goals and values.
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search companies, industries, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Industries</option>
            <option value="Technology">Technology</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
          </select>
        </div>
      </div>

      {/* Companies List */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCompanies.map(company => (
          <div
            key={company.id}
            className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  <Link to={`/companies/${company.id}`} className="hover:text-blue-600">
                    {company.name}
                  </Link>
                </h3>
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {company.industry}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                {company.description}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {company.location}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {company.size} employees
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to={`/companies/${company.id}`}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View {company.openPositions} open positions
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
            Previous
          </a>
          <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            1
          </a>
          <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            2
          </a>
          <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            3
          </a>
          <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
            Next
          </a>
        </nav>
      </div>
    </div>
  );
};

export default Companies; 
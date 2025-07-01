// This is a placeholder component for the Careers page. Replace with actual content and routing as needed.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  requirements: string[];
}

const Careers: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const jobOpenings: JobOpening[] = [
    {
      id: '1',
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Join our engineering team to build the future of job matching and recruitment technology.',
      requirements: ['React/TypeScript', '5+ years experience', 'Team leadership']
    },
    {
      id: '2',
      title: 'Product Manager',
      department: 'Product',
      location: 'Hybrid (NYC)',
      type: 'Full-time',
      description: 'Lead product strategy and development for our AI-powered job matching platform.',
      requirements: ['Product management', 'AI/ML experience', 'User research']
    },
    {
      id: '3',
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Create beautiful and intuitive user experiences for job seekers and employers.',
      requirements: ['Figma/Sketch', 'User testing', 'Design systems']
    },
    {
      id: '4',
      title: 'Marketing Intern',
      department: 'Marketing',
      location: 'Remote',
      type: 'Internship',
      description: 'Learn digital marketing while helping us grow our platform reach.',
      requirements: ['Marketing interest', 'Social media savvy', 'Creative thinking']
    },
    {
      id: '5',
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Hybrid (SF)',
      type: 'Full-time',
      description: 'Help employers and job seekers succeed with our platform.',
      requirements: ['Customer service', 'Problem solving', 'Communication']
    }
  ];

  const departments = ['all', ...Array.from(new Set(jobOpenings.map(job => job.department)))];
  const jobTypes = ['all', ...Array.from(new Set(jobOpenings.map(job => job.type)))];

  const filteredJobs = jobOpenings.filter(job => {
    const deptMatch = selectedDepartment === 'all' || job.department === selectedDepartment;
    const typeMatch = selectedType === 'all' || job.type === selectedType;
    return deptMatch && typeMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Join Our Mission to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600"> Transform Hiring</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're building the future of recruitment technology. Join a team that's passionate about 
            connecting talented people with amazing opportunities.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
            <div className="text-gray-600">Team Members</div>
          </div>
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold text-green-600 mb-2">10K+</div>
            <div className="text-gray-600">Jobs Posted</div>
          </div>
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">Constantly pushing boundaries in recruitment technology</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">People First</h3>
              <p className="text-gray-600">Empowering individuals to achieve their career goals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality</h3>
              <p className="text-gray-600">Delivering exceptional experiences and results</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Collaboration</h3>
              <p className="text-gray-600">Working together to achieve common goals</p>
            </div>
          </div>
        </div>

        {/* Job Openings Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Open Positions</h2>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {jobTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>

          {/* Job Listings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {job.department}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    job.type === 'Full-time' ? 'bg-blue-100 text-blue-800' :
                    job.type === 'Part-time' ? 'bg-green-100 text-green-800' :
                    job.type === 'Contract' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {job.type}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{job.description}</p>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Requirements:</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map((req, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105">
                  Apply Now
                </button>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No positions found</h3>
              <p className="text-gray-600">Try adjusting your filters or check back later for new opportunities.</p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Don't see the right fit?</h2>
          <p className="text-xl mb-6 opacity-90">
            We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300">
              Send Resume
            </button>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-300"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Careers; 
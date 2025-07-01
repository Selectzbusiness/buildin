import React, { useState } from 'react';

interface Application {
  id: number;
  jobTitle: string;
  company: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected';
  appliedDate: string;
}

interface SavedJob {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  postedDate: string;
}

const JobseekerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'saved'>('applications');

  // Mock data - replace with actual API calls
  const applications: Application[] = [
    {
      id: 1,
      jobTitle: 'Senior React Developer',
      company: 'Tech Corp',
      status: 'interviewing',
      appliedDate: '2024-03-15',
    },
    {
      id: 2,
      jobTitle: 'Frontend Engineer',
      company: 'Design Studio',
      status: 'applied',
      appliedDate: '2024-03-14',
    },
    {
      id: 3,
      jobTitle: 'Full Stack Developer',
      company: 'AI Solutions',
      status: 'offered',
      appliedDate: '2024-03-10',
    },
  ];

  const savedJobs: SavedJob[] = [
    {
      id: 1,
      title: 'UI/UX Designer',
      company: 'Design Studio',
      location: 'New York, NY',
      salary: '$80,000 - $100,000',
      postedDate: '2024-03-15',
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      salary: '$120,000 - $150,000',
      postedDate: '2024-03-14',
    },
  ];

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'interviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Update Profile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{applications.length}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Saved Jobs</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{savedJobs.length}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Interviews Scheduled</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {applications.filter(app => app.status === 'interviewing').length}
            </dd>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="sm:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as 'applications' | 'saved')}
            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="applications">Applications</option>
            <option value="saved">Saved Jobs</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('applications')}
                className={`${
                  activeTab === 'applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Applications
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`${
                  activeTab === 'saved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Saved Jobs
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === 'applications' ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {applications.map((application) => (
                <li key={application.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {application.jobTitle}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{application.company}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Applied on {new Date(application.appliedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {savedJobs.map((job) => (
                <li key={job.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 truncate">{job.title}</p>
                        <p className="mt-1 text-sm text-gray-500">{job.company}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {job.location}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {job.salary}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        Posted {new Date(job.postedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobseekerDashboard; 
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobs } from '../api/jobs';
import { Job } from '../types/job';

interface Location {
  city: string;
  area: string;
  pincode?: string;
  streetAddress?: string;
}

const FeaturedJobs: React.FC = () => {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        const jobs = await getJobs();
        // Get the first 3 jobs as featured jobs
        setFeaturedJobs(jobs.slice(0, 3));
      } catch (error) {
        console.error('Error fetching featured jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedJobs();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Featured Jobs
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Discover the most exciting opportunities
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      <Link to={`/jobs/${job.id}`} className="hover:text-gray-700">
                        {job.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{job.company}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {job.type}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {formatLocation(job.location)}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {job.salary}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 line-clamp-2">{job.description}</p>
                </div>
                <div className="mt-4">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedJobs;
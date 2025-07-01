import React from 'react';
import { Link } from 'react-router-dom';

interface Location {
  city: string;
  area: string;
  pincode?: string;
  streetAddress?: string;
}

interface BaseItem {
  id: string;
  title: string;
  description: string;
  location: Location | string;
  created_at: string;
  company?: {
    name: string;
    logo_url?: string;
  };
}

interface Job extends BaseItem {
  job_type: string;
  pay_type: string;
  min_amount: number;
  max_amount: number;
  amount: number;
  pay_rate: string;
}

interface Internship extends BaseItem {
  internship_type: string;
  stipend_type: string;
  min_amount: number;
  max_amount: number;
  amount: number;
  pay_rate: string;
  duration: string;
}

interface JobListProps {
  items: (Job | Internship)[];
  type: 'job' | 'internship';
  loading?: boolean;
}

const JobList: React.FC<JobListProps> = ({ items, type, loading = false }) => {
  // Format location display
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">No {type}s found</h3>
        <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/${type}s/${item.id}`}
          className="block bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-500">
                {item.company?.name || 'Company Name'} • {formatLocation(item.location)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                {type === 'job' ? (item as Job).job_type : (item as Internship).internship_type}
              </span>
              {type === 'internship' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  {(item as Internship).duration}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-600 line-clamp-2">{item.description}</p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {type === 'job' ? (item as Job).pay_type : (item as Internship).stipend_type}:
                {item.min_amount && item.max_amount
                  ? ` $${item.min_amount} - $${item.max_amount}`
                  : ` $${item.amount}`}
                /{item.pay_rate}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              Posted {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default JobList; 
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

interface Application {
  id: string;
  job_id: string;
  user_id: string;
  status: 'applied' | 'reviewed' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  applied_date: string;
  updated_date: string;
  job: {
    title: string;
    company: string;
  };
}

const ApplicationStatusTracker: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          user_id,
          status,
          applied_date,
          updated_date,
          jobs (
            title,
            companies (
              name
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('applied_date', { ascending: false });

      if (error) throw error;

      const formattedApplications = data?.map((app: any) => ({
        id: app.id,
        job_id: app.job_id,
        user_id: app.user_id,
        status: app.status,
        applied_date: app.applied_date,
        updated_date: app.updated_date,
        job: {
          title: app.jobs?.title || 'Unknown Job',
          company: app.jobs?.companies?.name || 'Unknown Company'
        }
      })) || [];

      setApplications(formattedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'interviewing':
        return 'bg-purple-100 text-purple-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'reviewed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'interviewing':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-4 4m4-4l4 4m0 0v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4m6 0h6m-6 0l4-4m-4 4l-4-4" />
          </svg>
        );
      case 'offered':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const filteredApplications = selectedStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === selectedStatus);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Status</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-20 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Application Status</h2>
        <div className="flex items-center space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="all">All Applications</option>
            <option value="applied">Applied</option>
            <option value="reviewed">Reviewed</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">No applications found</p>
          <p className="text-sm text-gray-400">
            {selectedStatus === 'all' 
              ? "You haven't applied to any jobs yet." 
              : `No applications with status "${selectedStatus}"`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {application.job.title}
                  </h3>
                  <p className="text-gray-600 mb-2">{application.job.company}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Applied: {new Date(application.applied_date).toLocaleDateString()}</span>
                    <span>Updated: {new Date(application.updated_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span className="ml-1 capitalize">{application.status}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationStatusTracker; 
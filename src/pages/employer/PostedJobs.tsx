import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { FaBriefcase, FaPlus, FaSearch, FaFilter, FaEdit } from 'react-icons/fa';

interface Job {
  id: string;
  title: string;
  location: { city: string; area: string };
  job_type: string;
  status: string;
  created_at: string;
  applications: { count: number }[];
}

const PostedJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useContext(AuthContext);

  const fetchPostedJobs = useCallback(async () => {
    console.log('profile', profile);
    console.log('profile.auth_id', profile?.auth_id);
    console.log('profile.user_id', profile?.user_id);
    console.log('profile.roles', profile?.roles);
    if (!profile) {
      setError('Profile not found. Please log in again.');
      setLoading(false);
      return;
    }
    
    // Check if user has employer role or if they have a company (which indicates they're an employer)
    const hasEmployerRole = profile.roles?.includes('employer');
    if (!hasEmployerRole) {
      // Try to check if they have a company instead of relying on roles
      console.log('User does not have employer role, checking for company...');
    }
    
    const userId = profile.auth_id || profile.user_id;
    if (!userId) {
      setError('Your profile is missing user identification. Please contact support or re-login.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch all company_ids for this user from employer_companies
      const { data: links, error: linkError } = await supabase
        .from('employer_companies')
        .select('company_id')
        .eq('user_id', userId);
      if (linkError) throw linkError;
      const companyIds = (links || []).map((l: any) => l.company_id);
      if (companyIds.length === 0) {
        setJobs([]);
        setLoading(false);
        setError('No company found for your account. Please create a company profile.');
        return;
      }
      // Fetch jobs for all companies
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, location, job_type, status, created_at, applications (count)')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs(data as Job[]);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load your job postings. ' + (err?.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchPostedJobs();
  }, [fetchPostedJobs]);

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));
    } catch (err) {
      console.error('Error updating job status:', err);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;

    try {
      await supabase.from('jobs').delete().eq('id', jobId);
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'all' || job.status === filter;
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: jobs.length,
    active: jobs.filter(job => job.status === 'active').length,
    paused: jobs.filter(job => job.status === 'paused').length,
    closed: jobs.filter(job => job.status === 'closed').length,
  };

  if (loading) {
    return (
        <div className="p-8">
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb]">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#185a9d] mb-2">Posted Jobs</h1>
            <p className="text-gray-600">Manage and track your job postings</p>
          </div>
          <Link
            to="/employer/post-job"
            className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-white bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-2xl shadow-lg hover:from-[#43cea2] hover:to-[#185a9d] transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-2xl transition-all duration-300 ease-out group-hover:from-[#43cea2] group-hover:to-[#185a9d]"></div>
            <div className="relative flex items-center space-x-3">
              <FaBriefcase className="w-5 h-5" />
              <span className="font-semibold">Post New Job</span>
              <FaPlus className="w-4 h-4 opacity-80" />
            </div>
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat cards */}
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-500 capitalize">{key}</span>
                  <p className="text-3xl font-bold text-[#185a9d] mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  key === 'total' ? 'bg-blue-100' :
                  key === 'active' ? 'bg-green-100' :
                  key === 'paused' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  <FaBriefcase className={`w-6 h-6 ${
                    key === 'total' ? 'text-blue-600' :
                    key === 'active' ? 'text-green-600' :
                    key === 'paused' ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#185a9d] focus:border-transparent bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#185a9d] focus:border-transparent bg-white/50 backdrop-blur-sm appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredJobs.length > 0 ? filteredJobs.map(job => (
              <div key={job.id} className="p-6 bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg hover:shadow-xl hover:border-[#43cea2]/30 transition-all duration-300">
                  <div className="flex justify-between items-start">
                      <div>
                          <h3 className="text-xl font-bold text-[#185a9d]">{job.title}</h3>
                          <p className="text-gray-600 mt-1">{
                            job.location
                              ? (typeof job.location === 'object' && job.location !== null
                                  ? [(job.location as any).city, (job.location as any).area].filter(Boolean).join(', ')
                                  : job.location)
                              : 'Not specified'
                          }</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              job.status === 'active' ? 'bg-green-100 text-green-800' :
                              job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500">
                              Posted {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                      </div>
                      <div className="flex items-center space-x-4">
                          <Link to={`/employer/applications/${job.id}`} className="text-[#185a9d] font-semibold hover:text-[#43cea2] transition-colors">
                              {job.applications[0]?.count || 0} Applications
                          </Link>
                          <Link 
                            to={`/employer/edit-job/${job.id}`}
                            className="text-[#185a9d] hover:text-[#43cea2] transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 flex items-center"
                          >
                            <FaEdit className="w-4 h-4 mr-1" />
                            Edit
                          </Link>
                          <select 
                            value={job.status} 
                            onChange={(e) => handleStatusChange(job.id, e.target.value)} 
                            className="rounded-lg border border-gray-200 px-3 py-1 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                          >
                              <option value="active">Active</option>
                              <option value="paused">Paused</option>
                              <option value="closed">Closed</option>
                          </select>
                          <button 
                            onClick={() => handleDelete(job.id)} 
                            className="text-red-500 hover:text-red-700 transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
                          >
                            Delete
                          </button>
                      </div>
                  </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBriefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
                <Link
                  to="/employer/post-job"
                  className="inline-flex items-center px-6 py-3 bg-[#185a9d] text-white rounded-xl hover:bg-[#43cea2] transition-colors"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostedJobs; 
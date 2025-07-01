import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { 
  FaBriefcase, 
  FaGraduationCap, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaUser, 
  FaCalendarAlt, 
  FaStar, 
  FaCheckCircle, 
  FaTimes, 
  FaClock, 
  FaChartLine
} from 'react-icons/fa';
import MessagingSystem from '../../components/MessagingSystem';
import Modal from '../../components/Modal';

// Define types for data structures
interface Applicant {
  id: string;
  full_name: string;
  avatar_url?: string;
  auth_id?: string;
}

interface Job {
  id: string;
  title: string;
}

interface Application {
  id: string;
  created_at: string;
  status: string;
  job?: Job;
  user?: Applicant;
}

interface Internship {
  id: string;
  title: string;
}

interface InternshipApplication {
  id: string;
  created_at: string;
  status: string;
  internship?: Internship;
  user?: Applicant;
}

const Applications: React.FC = () => {
  const { profile } = useContext(AuthContext);
  const [applications, setApplications] = useState<Application[]>([]);
  const [internshipApplications, setInternshipApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'internships'>('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageTargetId, setMessageTargetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllApplications = async () => {
      if (!profile || !profile.roles?.includes('employer')) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch employer's company
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('auth_id', profile.auth_id)
          .single();
        if (companyError || !companyData) {
          setApplications([]);
          setInternshipApplications([]);
          setLoading(false);
          return;
        }
        // Fetch jobs for this company
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('id')
          .eq('company_id', companyData.id);
        if (jobsError) throw jobsError;
        const jobIds = (jobsData || []).map((job: any) => job.id);
        // Fetch internships for this company
        const { data: internshipsData, error: internshipsError } = await supabase
          .from('internships')
          .select('id')
          .eq('company_id', companyData.id);
        if (internshipsError) throw internshipsError;
        const internshipIds = (internshipsData || []).map((i: any) => i.id);
        // Fetch job applications
        let mapped: Application[] = [];
        if (jobIds.length > 0) {
          const { data, error } = await supabase
            .from('applications')
            .select(`
              id,
              created_at,
              status,
              jobs (id, title),
              user:profiles!job_seeker_id (id, auth_id, full_name)
            `)
            .in('job_id', jobIds)
            .order('created_at', { ascending: false });
          if (error) throw error;
          mapped = (data as any[]).map(app => ({
            ...app,
            job: Array.isArray(app.jobs) ? app.jobs[0] : app.jobs,
            user: Array.isArray(app.user)
              ? { ...app.user[0], auth_id: app.user[0]?.auth_id }
              : { ...app.user, auth_id: app.user?.auth_id },
          }));
        }
        setApplications(mapped);
        // Fetch internship applications
        let mappedIntern: InternshipApplication[] = [];
        if (internshipIds.length > 0) {
          const { data, error } = await supabase
            .from('internship_applications')
            .select(`
              id,
              created_at,
              status,
              internship:internships!internship_id (id, title),
              user:profiles!job_seeker_id (id, auth_id, full_name)
            `)
            .in('internship_id', internshipIds)
            .order('created_at', { ascending: false });
          if (error) throw error;
          mappedIntern = (data as any[]).map(app => ({
            ...app,
            internship: Array.isArray(app.internship) ? app.internship[0] : app.internship,
            user: Array.isArray(app.user)
              ? { ...app.user[0], auth_id: app.user[0]?.auth_id }
              : { ...app.user, auth_id: app.user?.auth_id },
          }));
        }
        setInternshipApplications(mappedIntern);
      } catch (err: any) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllApplications();
  }, [profile]);
  
  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleInternshipStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('internship_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setInternshipApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error('Error updating internship status:', err);
    }
  };

  // Helper functions for enhanced UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FaClock className="w-3 h-3" />;
      case 'reviewed': return <FaEye className="w-3 h-3" />;
      case 'shortlisted': return <FaStar className="w-3 h-3" />;
      case 'rejected': return <FaTimes className="w-3 h-3" />;
      case 'hired': return <FaCheckCircle className="w-3 h-3" />;
      default: return <FaClock className="w-3 h-3" />;
    }
  };

  // Filter applications based on search and status
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInternshipApplications = internshipApplications.filter(app => {
    const matchesSearch = 
      app.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.internship?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: applications.length + internshipApplications.length,
    pending: [...applications, ...internshipApplications].filter(app => app.status === 'pending').length,
    reviewed: [...applications, ...internshipApplications].filter(app => app.status === 'reviewed').length,
    shortlisted: [...applications, ...internshipApplications].filter(app => app.status === 'shortlisted').length,
    rejected: [...applications, ...internshipApplications].filter(app => app.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb] p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-white/50 rounded-2xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white/50 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-96 bg-white/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb] p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTimes className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Applications</h3>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!profile || !profile.roles?.includes('employer')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb] p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-500">This page is for employers only.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb]">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#185a9d] mb-2">Applications</h1>
            <p className="text-gray-600">Manage and review all job and internship applications</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <FaChartLine className="w-5 h-5 text-[#185a9d]" />
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-[#185a9d]">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaChartLine className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <FaClock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Reviewed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaEye className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Shortlisted</p>
                <p className="text-2xl font-bold text-green-600">{stats.shortlisted}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaStar className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FaTimes className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-2">
          <div className="flex space-x-2">
        <button
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeTab === 'jobs' 
                  ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
          onClick={() => setActiveTab('jobs')}
        >
              <FaBriefcase className="w-4 h-4" />
              <span>Job Applications ({applications.length})</span>
        </button>
        <button
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeTab === 'internships' 
                  ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
          onClick={() => setActiveTab('internships')}
        >
              <FaGraduationCap className="w-4 h-4" />
              <span>Internship Applications ({internshipApplications.length})</span>
        </button>
      </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search applicants or positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#185a9d] focus:border-transparent bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#185a9d] focus:border-transparent bg-white/50 backdrop-blur-sm appearance-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-sm text-gray-500">
                Showing {activeTab === 'jobs' ? filteredApplications.length : filteredInternshipApplications.length} results
              </span>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {activeTab === 'jobs' && (
            <>
              {filteredApplications.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-12 border border-white/20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaBriefcase className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-[#185a9d] mb-2">No job applications found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                          </div>
              ) : (
                filteredApplications.map((application) => (
                  <div key={application.id} className="bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg hover:shadow-xl hover:border-[#43cea2]/30 transition-all duration-300 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img 
                            className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-lg" 
                            src={application.user?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTI0IDI4QzMwLjYyNzQgMjggMzYgMjIuNjI3NCAzNiAxNkMzNiA5LjM3MjU4IDMwLjYyNzQgNCAyNCA0QzE3LjM3MjYgNCAxMiA5LjM3MjU4IDEyIDE2QzEyIDIyLjYyNzQgMTcuMzcyNiAyOCAyNCAyOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI0IDMyQzE2LjI2ODkgMzIgMTAgMzguMjY4OSAxMCA0NkgyNEMzMS43MzExIDQ2IDM4IDM5LjczMTEgMzggMzJIMjRaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='} 
                            alt={application.user?.full_name || 'Applicant'} 
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                            </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#185a9d]">{application.user?.full_name || 'N/A'}</h3>
                          <p className="text-gray-600">{application.job?.title || 'N/A'}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <FaCalendarAlt className="w-3 h-3" />
                              <span>{new Date(application.created_at).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 inline-flex items-center space-x-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span>{application.status}</span>
                        </span>
                        <select
                          value={application.status}
                          onChange={(e) => handleStatusChange(application.id, e.target.value)}
                          className="rounded-lg border border-gray-200 px-3 py-1 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/employer/job-seeker-profile/${application.user?.id}`}
                            className="p-2 text-[#185a9d] hover:bg-[#185a9d]/10 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <FaUser className="w-4 h-4" />
                          </Link>
                        </div>
                        <button
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Message Applicant"
                          onClick={() => { setMessageTargetId(application.user?.auth_id || null); setIsMessageModalOpen(true); }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </button>
                      </div>
                    </div>
            </div>
                ))
              )}
            </>
          )}

          {activeTab === 'internships' && (
            <>
              {filteredInternshipApplications.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-12 border border-white/20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaGraduationCap className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-[#185a9d] mb-2">No internship applications found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                          </div>
              ) : (
                filteredInternshipApplications.map((application) => (
                  <div key={application.id} className="bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg hover:shadow-xl hover:border-[#43cea2]/30 transition-all duration-300 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img 
                            className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-lg" 
                            src={application.user?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTI0IDI4QzMwLjYyNzQgMjggMzYgMjIuNjI3NCAzNiAxNkMzNiA5LjM3MjU4IDMwLjYyNzQgNCAyNCA0QzE3LjM3MjYgNCAxMiA5LjM3MjU4IDEyIDE2QzEyIDIyLjYyNzQgMTcuMzcyNiAyOCAyNCAyOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI0IDMyQzE2LjI2ODkgMzIgMTAgMzguMjY4OSAxMCA0NkgyNEMzMS43MzExIDQ2IDM4IDM5LjczMTEgMzggMzJIMjRaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='} 
                            alt={application.user?.full_name || 'Applicant'} 
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                            </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#185a9d]">{application.user?.full_name || 'N/A'}</h3>
                          <p className="text-gray-600">{application.internship?.title || 'N/A'}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <FaCalendarAlt className="w-3 h-3" />
                              <span>{new Date(application.created_at).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 inline-flex items-center space-x-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span>{application.status}</span>
                        </span>
                        <select
                          value={application.status}
                          onChange={(e) => handleInternshipStatusChange(application.id, e.target.value)}
                          className="rounded-lg border border-gray-200 px-3 py-1 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/employer/job-seeker-profile/${application.user?.id}`}
                            className="p-2 text-[#185a9d] hover:bg-[#185a9d]/10 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <FaUser className="w-4 h-4" />
                          </Link>
                        </div>
                        <button
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Message Applicant"
                          onClick={() => { setMessageTargetId(application.user?.auth_id || null); setIsMessageModalOpen(true); }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </button>
                      </div>
                    </div>
            </div>
                ))
          )}
        </>
      )}
        </div>
      </div>

      {/* Message Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
          <div className="relative w-full max-w-5xl p-2">
            {messageTargetId ? (
              <MessagingSystem
                initialTargetId={messageTargetId}
                onClose={() => setIsMessageModalOpen(false)}
                currentRole="employer"
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications; 
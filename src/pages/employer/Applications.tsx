import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { format } from 'date-fns';
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
  FaChartLine,
  FaPaperPlane,
  FaUndo
} from 'react-icons/fa';
import Modal from '../../components/Modal';
import useIsMobile from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';

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
  job_seeker_id?: string; // Add this for clarity
}

const ACTIONS = [
  { key: 'shortlisted', label: 'Shortlist' },
  { key: 'rejected', label: 'Reject' },
  { key: 'interview_scheduled', label: 'Invite for Interview' },
  { key: 'video_requested', label: 'Request Video Resume' },
];

const Applications: React.FC = () => {
  const { profile } = useContext(AuthContext);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [internshipApplications, setInternshipApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'internships'>('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageTargetId, setMessageTargetId] = useState<string | null>(null);
  const isMobile = useIsMobile();

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
          .select('id, title')
          .eq('company_id', companyData.id);
        if (jobsError) throw jobsError;
        setJobs(jobsData || []);
        // Fetch internships for this company
        const { data: internshipsData, error: internshipsError } = await supabase
          .from('internships')
          .select('id, title')
          .eq('company_id', companyData.id);
        if (internshipsError) throw internshipsError;
        setInternships(internshipsData || []);

        // Fetch job applications
        let mapped: Application[] = [];
        if (jobsData.length > 0) {
          const { data, error } = await supabase
            .from('applications')
            .select(`
              id,
              created_at,
              status,
              jobs (id, title),
              user:profiles!job_seeker_id (id, auth_id, full_name, intro_video_url, resume_url)
            `)
            .in('job_id', jobsData.map(job => job.id))
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
        if (internshipsData.length > 0) {
          const { data, error } = await supabase
            .from('internship_applications')
            .select(`
              id,
              created_at,
              status,
              internship:internships!internship_id (id, title),
              user:profiles!job_seeker_id (id, auth_id, full_name, intro_video_url, resume_url)
            `)
            .in('internship_id', internshipsData.map(internship => internship.id))
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
  
  // Test function to debug notification creation
  const testNotificationCreation = async (userId: string) => {
    try {
      const testPayload = {
        user_id: userId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system',
        read: false,
        channel: 'in-app'
      };

      console.log('Testing notification creation with payload:', testPayload);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([testPayload])
        .select();

      if (error) {
        console.error('Test notification creation failed:', error);
        return false;
      } else {
        console.log('Test notification created successfully:', data);
        return true;
      }
    } catch (err) {
      console.error('Test notification creation error:', err);
      return false;
    }
  };

  const handleInternshipStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      console.log('Starting internship status update for:', applicationId, 'to status:', newStatus);
      
      // 1. Update the internship application status
      const { error } = await supabase
        .from('internship_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating internship application status:', error);
        throw error;
      }

      console.log('Internship application status updated successfully');

      // 2. Fetch the updated application to get the job_seeker_id
      const { data: appData, error: fetchError } = await supabase
        .from('internship_applications')
        .select('id, job_seeker_id')
        .eq('id', applicationId)
        .single();

      if (fetchError) {
        console.error('Error fetching updated internship application:', fetchError);
        throw fetchError;
      }

      console.log('Fetched application data:', appData);

      if (appData && appData.id && appData.job_seeker_id) {
        // Test notification creation first
        const testResult = await testNotificationCreation(appData.job_seeker_id);
        console.log('Test notification result:', testResult);

        // Validate internship_application_id is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(appData.id)) {
          console.error('Invalid internship_application_id (not a UUID):', appData.id);
          throw new Error('Invalid internship_application_id (not a UUID)');
        }
        // Construct notification object with only the required keys
        const notification = {
          user_id: appData.job_seeker_id,
          internship_application_id: appData.id,
          title: `Internship Application Status Updated`,
          message: `Your internship application status has been updated to "${newStatus}"`,
          type: 'application',
          read: false,
          channel: 'in-app'
        };
        // Debug: log the notification object and its keys
        console.log('Notification payload (internship):', notification);
        // Insert notification directly
        const { data: notifData, error: notifError } = await supabase
          .from('notifications')
          .insert([notification])
          .select();
        if (notifError) {
          console.error('Error creating internship notification:', notifError);
          console.error('Error details:', {
            code: notifError.code,
            message: notifError.message,
            details: notifError.details,
            hint: notifError.hint
          });
        } else {
          console.log('Internship notification created successfully:', notifData);
        }
      } else {
        console.error('Internship application not found or missing job_seeker_id for notification.');
        console.error('App data:', appData);
      }

      // Update the UI state
      setInternshipApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      console.log('UI state updated successfully');
    } catch (err) {
      console.error('Error updating internship status:', err);
      // You might want to show a toast error here
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // Fetch the updated application to get the job_seeker_id
      const { data: appData, error: fetchError } = await supabase
        .from('applications')
        .select('id, job_seeker_id')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      if (appData && appData.id && appData.job_seeker_id) {
        // Insert notification for job application (do NOT include internship_application_id)
        const notification = {
          user_id: appData.job_seeker_id,
          application_id: appData.id,
          title: `Job Application Status Updated`,
          message: `Your job application status has been updated to "${newStatus}"`,
          type: 'application',
          read: false,
          channel: 'in-app'
        };
        const { error: notifError } = await supabase
          .from('notifications')
          .insert([notification]);
        if (notifError) {
          console.error('Error creating job notification:', notifError);
        }
      } else {
        console.error('Job application not found or missing job_seeker_id for notification.');
      }

      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAction = async (type: string, app: any, isInternship = false) => {
    if (isInternship) {
      await supabase
        .from('internship_applications')
        .update({ status: type, status_updated_at: new Date() })
        .eq('id', app.id);
      await supabase
        .from('application_actions')
        .insert({
          internship_application_id: app.id,
          action: type,
          performed_by: profile?.id,
          notes: null,
        });
    } else {
      await supabase
        .from('applications')
        .update({ status: type, status_updated_at: new Date() })
        .eq('id', app.id);
      await supabase
        .from('application_actions')
        .insert({
          application_id: app.id,
          action: type,
          performed_by: profile?.id,
          notes: null,
        });
    }
    // Optionally, refresh data
    // ...
  };

  // Helper functions for enhanced UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'accepted': return 'bg-purple-100 text-purple-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <FaPaperPlane className="w-3 h-3" />;
      case 'pending': return <FaClock className="w-3 h-3" />;
      case 'reviewed': return <FaEye className="w-3 h-3" />;
      case 'shortlisted': return <FaStar className="w-3 h-3" />;
      case 'rejected': return <FaTimes className="w-3 h-3" />;
      case 'accepted': return <FaCheckCircle className="w-3 h-3" />;
      case 'withdrawn': return <FaUndo className="w-3 h-3" />;
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
    submitted: [...applications, ...internshipApplications].filter(app => app.status === 'submitted').length,
    pending: [...applications, ...internshipApplications].filter(app => app.status === 'pending').length,
    reviewed: [...applications, ...internshipApplications].filter(app => app.status === 'reviewed').length,
    shortlisted: [...applications, ...internshipApplications].filter(app => app.status === 'shortlisted').length,
    rejected: [...applications, ...internshipApplications].filter(app => app.status === 'rejected').length,
    accepted: [...applications, ...internshipApplications].filter(app => app.status === 'accepted').length,
    withdrawn: [...applications, ...internshipApplications].filter(app => app.status === 'withdrawn').length,
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
  
  // --- MOBILE UI ---
  if (isMobile) {
    const cardVariants = {
      hidden: { opacity: 0, y: 30, scale: 0.97 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { delay: i * 0.07, stiffness: 120, damping: 14 }
      })
    };
    return (
      <div className="min-h-screen bg-[#f1f5f9] pb-20">
        {/* Stats summary */}
        <div className="flex gap-2 overflow-x-auto px-2 py-3">
          <div className="flex flex-col items-center bg-white rounded-xl px-3 py-2 min-w-[80px] shadow text-[#185a9d]">
            <span className="text-xs font-medium">Total</span>
            <span className="text-lg font-bold">{stats.total}</span>
          </div>
          <div className="flex flex-col items-center bg-yellow-50 rounded-xl px-3 py-2 min-w-[80px] shadow text-yellow-700">
            <span className="text-xs font-medium">Pending</span>
            <span className="text-lg font-bold">{stats.pending}</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-xl px-3 py-2 min-w-[80px] shadow text-gray-800">
            <span className="text-xs font-medium">Reviewed</span>
            <span className="text-lg font-bold">{stats.reviewed}</span>
          </div>
          <div className="flex flex-col items-center bg-green-50 rounded-xl px-3 py-2 min-w-[80px] shadow text-green-700">
            <span className="text-xs font-medium">Shortlisted</span>
            <span className="text-lg font-bold">{stats.shortlisted}</span>
          </div>
          <div className="flex flex-col items-center bg-red-50 rounded-xl px-3 py-2 min-w-[80px] shadow text-red-700">
            <span className="text-xs font-medium">Rejected</span>
            <span className="text-lg font-bold">{stats.rejected}</span>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex w-full px-2 gap-2 mt-2">
          <button
            className={`flex-1 py-2 rounded-lg font-semibold text-xs ${activeTab === 'jobs' ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white shadow' : 'bg-white text-[#185a9d] border border-[#185a9d]'}`}
            onClick={() => setActiveTab('jobs')}
          >
            Jobs ({applications.length})
          </button>
          <button
            className={`flex-1 py-2 rounded-lg font-semibold text-xs ${activeTab === 'internships' ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white shadow' : 'bg-white text-[#185a9d] border border-[#185a9d]'}`}
            onClick={() => setActiveTab('internships')}
          >
            Internships ({internshipApplications.length})
          </button>
        </div>
        {/* Filters/Search */}
        <div className="flex gap-2 px-2 mt-3 mb-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2 py-2 rounded-lg border border-gray-200 bg-white text-sm"
          >
            <option value="all">All</option>
            <option value="submitted">Submitted</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
        {/* Applications List with Animation */}
        <AnimatePresence mode="wait">
          {activeTab === 'jobs' ? (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3 px-2 mt-2"
            >
              {filteredApplications.length === 0 ? (
                <motion.div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>No job applications found</motion.div>
              ) : (
                filteredApplications.map((application, i) => (
                  <motion.div
                    key={application.id}
                    className="bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-2 border-2 border-[#e3f0fa]"
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={cardVariants}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        className="w-12 h-12 rounded-full object-cover border"
                        src={application.user?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTI0IDI4QzMwLjYyNzQgMjggMzYgMjIuNjI3NCAzNiAxNkMzNiA5LjM3MjU4IDMwLjYyNzQgNCAyNCA0QzE3LjM3MjYgNCAxMiA5LjM3MjU4IDEyIDE2QzEyIDIyLjYyNzQgMTcuMzcyNiAyOCAyNCAyOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI0IDMyQzE2LjI2ODkgMzIgMTAgMzguMjY4OSAxMCA0NkgyNEMzMS43MzExIDQ2IDM4IDM5LjczMTEgMzggMzJIMjRaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='}
                        alt={application.user?.full_name || 'Applicant'}
                      />
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-base">{application.user?.full_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{application.job?.title || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{new Date(application.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>{application.status}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <select
                        value={application.status}
                        onChange={e => handleStatusChange(application.id, e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                        <option value="accepted">Accepted</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                      <Link
                        to={`/employer/job-seeker-profile/${application.user?.id}`}
                        className="flex-1 py-2 rounded-lg bg-gray-100 text-[#185a9d] text-xs font-semibold text-center shadow"
                      >
                        View Profile
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="internships"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3 px-2 mt-2"
            >
              {filteredInternshipApplications.length === 0 ? (
                <motion.div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>No internship applications found</motion.div>
              ) : (
                filteredInternshipApplications.map((application, i) => (
                  <motion.div
                    key={application.id}
                    className="bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-2 border-2 border-[#e3f0fa]"
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={cardVariants}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        className="w-12 h-12 rounded-full object-cover border"
                        src={application.user?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTI0IDI4QzMwLjYyNzQgMjggMzYgMjIuNjI3NCAzNiAxNkMzNiA5LjM3MjU4IDMwLjYyNzQgNCAyNCA0QzE3LjM3MjYgNCAxMiA5LjM3MjU4IDEyIDE2QzEyIDIyLjYyNzQgMTcuMzcyNiAyOCAyNCAyOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI0IDMyQzE2LjI2ODkgMzIgMTAgMzguMjY4OSAxMCA0NkgyNEMzMS43MzExIDQ2IDM4IDM5LjczMTEgMzggMzJIMjRaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='}
                        alt={application.user?.full_name || 'Applicant'}
                      />
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-base">{application.user?.full_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{application.internship?.title || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{new Date(application.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>{application.status}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <select
                        value={application.status}
                        onChange={e => handleInternshipStatusChange(application.id, e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                        <option value="accepted">Accepted</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                      <Link
                        to={`/employer/job-seeker-profile/${application.user?.id}`}
                        className="flex-1 py-2 rounded-lg bg-gray-100 text-[#185a9d] text-xs font-semibold text-center shadow"
                      >
                        View Profile
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb]">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Applications</h1>
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
                <p className="text-2xl font-bold text-gray-800">{stats.reviewed}</p>
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
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="accepted">Accepted</option>
                <option value="withdrawn">Withdrawn</option>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No job applications found</h3>
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
                          <h3 className="text-lg font-semibold text-gray-900">{application.user?.full_name || 'N/A'}</h3>
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
                          <option value="submitted">Submitted</option>
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="accepted">Accepted</option>
                          <option value="withdrawn">Withdrawn</option>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No internship applications found</h3>
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
                          <h3 className="text-lg font-semibold text-gray-900">{application.user?.full_name || 'N/A'}</h3>
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
                          <option value="submitted">Submitted</option>
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="accepted">Accepted</option>
                          <option value="withdrawn">Withdrawn</option>
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
                      </div>
                    </div>
            </div>
                ))
          )}
        </>
      )}
        </div>
      </div>
    </div>
  );
};

export default Applications; 
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { FaBriefcase, FaGraduationCap, FaPlus, FaRocket } from 'react-icons/fa';
import useIsMobile from '../../hooks/useIsMobile';

type Application = {
  id: string;
  created_at: string;
  status: string;
  type: 'Job' | 'Internship';
  candidateName?: string;
  position?: string;
  date?: string;
  // Add any other fields you use in the table
};

const EmployerDashboard: React.FC = () => {
  const { user, profile } = useContext(AuthContext);
  const isMobile = useIsMobile();

  const [stats, setStats] = useState({
    activeJobs: 0,
    activeInternships: 0,
    totalApplications: 0,
    newApplications: 0,
    interviewsScheduled: 0,
  });
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchStatsAndApplications = async () => {
      // 1. Get all company_ids for this user from employer_companies
      const { data: links, error: linkError } = await supabase
        .from('employer_companies')
        .select('company_id')
        .eq('user_id', user.id);
      if (linkError) return;
      const companyIds = (links || []).map((l: any) => l.company_id);
      if (companyIds.length === 0) return;
      // 2. Get jobs and internships for these companies
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .in('company_id', companyIds);
      const { data: internships } = await supabase
        .from('internships')
        .select('id')
        .in('company_id', companyIds);

      const jobIds = jobs?.map(job => job.id) || [];
      const internshipIds = internships?.map(internship => internship.id) || [];

      // 3. Get job applications
      let jobApplications = [];
      if (jobIds.length > 0) {
        const { data: apps } = await supabase
          .from('applications')
          .select('*')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false });
        jobApplications = apps || [];
      }

      // 4. Get internship applications
      let internshipApplications = [];
      if (internshipIds.length > 0) {
        const { data: iapps } = await supabase
          .from('internship_applications')
          .select('*')
          .in('internship_id', internshipIds)
          .order('created_at', { ascending: false });
        internshipApplications = iapps || [];
      }

      // 5. Merge and sort all applications
      const allApplications = [
        ...jobApplications.map(app => ({ ...app, type: 'Job' })),
        ...internshipApplications.map(app => ({ ...app, type: 'Internship' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 6. Calculate stats
      setStats({
        activeJobs: jobs?.length || 0,
        activeInternships: internships?.length || 0,
        totalApplications: allApplications.length,
        newApplications: allApplications.filter(app => app.status === 'submitted' || app.status === 'New').length,
        interviewsScheduled: allApplications.filter(app => app.status === 'Interview Scheduled').length,
      });

      // 7. Set recent applications (latest 5)
      setRecentApplications(allApplications.slice(0, 5));
    };

    fetchStatsAndApplications();
  }, [user]);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-4 pb-2">
          <h1 className="text-2xl font-bold text-black mb-2">Welcome, {profile?.full_name || 'Employer'}</h1>
          <div className="flex gap-2 mb-4">
            <Link to="/employer/post-job" className="flex-1 flex flex-col items-center justify-center bg-[#185a9d] text-white rounded-xl py-3 shadow font-semibold text-sm active:scale-95 transition">
              <FaBriefcase className="w-5 h-5 mb-1" />
              Post Job
            </Link>
            <Link to="/employer/post-internship" className="flex-1 flex flex-col items-center justify-center bg-[#43cea2] text-white rounded-xl py-3 shadow font-semibold text-sm active:scale-95 transition">
              <FaGraduationCap className="w-5 h-5 mb-1" />
              Post Internship
            </Link>
          </div>
          {/* Stats Row */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
            <div className="min-w-[120px] bg-[#f1f5f9] rounded-xl p-3 flex flex-col items-center shadow">
              <span className="text-xs font-medium text-gray-500">Jobs</span>
              <span className="text-xl font-bold text-black">{stats.activeJobs}</span>
            </div>
            <div className="min-w-[120px] bg-[#f1f5f9] rounded-xl p-3 flex flex-col items-center shadow">
              <span className="text-xs font-medium text-gray-500">Internships</span>
              <span className="text-xl font-bold text-black">{stats.activeInternships}</span>
            </div>
            <div className="min-w-[120px] bg-[#f1f5f9] rounded-xl p-3 flex flex-col items-center shadow">
              <span className="text-xs font-medium text-gray-500">Applications</span>
              <span className="text-xl font-bold text-black">{stats.totalApplications}</span>
            </div>
            <div className="min-w-[120px] bg-[#f1f5f9] rounded-xl p-3 flex flex-col items-center shadow">
              <span className="text-xs font-medium text-gray-500">New</span>
              <span className="text-xl font-bold text-black">{stats.newApplications}</span>
            </div>
            <div className="min-w-[120px] bg-[#f1f5f9] rounded-xl p-3 flex flex-col items-center shadow">
              <span className="text-xs font-medium text-gray-500">Interviews</span>
              <span className="text-xl font-bold text-black">{stats.interviewsScheduled}</span>
            </div>
          </div>
        </div>
        {/* Recent Applications - swipeable list */}
        <div className="px-2 pb-4">
          <div className="bg-[#f1f5f9] rounded-2xl shadow p-3">
            <h2 className="text-lg font-semibold text-black mb-2">Recent Applications</h2>
            <div className="flex flex-col gap-2">
              {recentApplications.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No recent applications.</div>
              ) : recentApplications.map((application) => (
                <Link key={application.id} to={`/employer/applications/${application.id}`} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition">
                  <div className="flex-1">
                    <div className="font-semibold text-black text-sm">{application.candidateName || application.id}</div>
                    <div className="text-xs text-gray-500">{application.position} • {application.type}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium mb-1 ${
                      application.status === 'New' ? 'bg-[#ff2d55]/10 text-[#ff2d55]' :
                      application.status === 'Under Review' ? 'bg-[#ff9500]/10 text-[#ff9500]' :
                      'bg-[#34c759]/10 text-[#34c759]'
                    }`}>
                      {application.status}
                    </span>
                    <span className="text-xs text-gray-400">{application.date}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        {/* Reverse Hiring Features */}
        <div className="px-2 pb-8">
          <div className="bg-[#f1f5f9] rounded-2xl shadow p-3">
            <h2 className="text-lg font-semibold text-black mb-2">Reverse Hiring</h2>
            <div className="flex flex-col gap-2">
              <Link to="/employer/reels" className="flex items-center gap-3 bg-gradient-to-br from-[#00c6fb] to-[#005bea] p-4 rounded-xl border border-[#00c6fb] hover:border-[#005bea] shadow text-white">
                <span className="text-2xl">🎥</span>
                <div className="flex-1">
                  <div className="font-semibold text-white">Job Seeker Reels</div>
                  <div className="text-xs text-white/80">Browse video profiles</div>
                </div>
                <span className="text-xs font-bold">Go</span>
              </Link>
              <Link to="/employer/saved-videos" className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-200 hover:border-blue-300 shadow">
                <span className="text-2xl">💾</span>
                <div className="flex-1">
                  <div className="font-semibold text-black">Saved Videos</div>
                  <div className="text-xs text-gray-600">View your saved profiles</div>
                </div>
                <span className="text-xs font-bold text-black">Go</span>
              </Link>
              <Link to="/employer/credits" className="flex items-center gap-3 bg-purple-50 p-4 rounded-xl border border-purple-200 hover:border-purple-300 shadow">
                <span className="text-2xl">💳</span>
                <div className="flex-1">
                  <div className="font-semibold text-black">Credits</div>
                  <div className="text-xs text-gray-600">Manage your balance</div>
                </div>
                <span className="text-xs font-bold text-black">Go</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb]">
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-[#185a9d]">Welcome back, {profile?.full_name || 'Employer'}</h1>
          <div className="flex gap-4">
            <Link
              to="/employer/post-job"
              className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-white bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-2xl shadow-lg hover:from-[#43cea2] hover:to-[#185a9d] transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-2xl transition-all duration-300 ease-out group-hover:from-[#43cea2] group-hover:to-[#185a9d]"></div>
              <div className="relative flex items-center space-x-3">
                <FaBriefcase className="w-5 h-5" />
                <span className="font-semibold">Post Job</span>
                <FaPlus className="w-4 h-4 opacity-80" />
              </div>
            </Link>
            <Link
              to="/employer/post-internship"
              className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-white bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-2xl shadow-lg hover:from-[#43cea2] hover:to-[#185a9d] transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-2xl transition-all duration-300 ease-out group-hover:from-[#43cea2] group-hover:to-[#185a9d]"></div>
              <div className="relative flex items-center space-x-3">
                <FaGraduationCap className="w-5 h-5" />
                <span className="font-semibold">Post Internship</span>
                <FaPlus className="w-4 h-4 opacity-80" />
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
            <p className="mt-2 text-3xl font-semibold text-[#185a9d]">{stats.activeJobs}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-sm font-medium text-gray-500">Active Internships</h3>
            <p className="mt-2 text-3xl font-semibold text-[#185a9d]">{stats.activeInternships}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-sm font-medium text-gray-500">Total Applications</h3>
            <p className="mt-2 text-3xl font-semibold text-[#185a9d]">{stats.totalApplications}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-sm font-medium text-gray-500">New Applications</h3>
            <p className="mt-2 text-3xl font-semibold text-[#ff2d55]">{stats.newApplications}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-sm font-medium text-gray-500">Interviews Scheduled</h3>
            <p className="mt-2 text-3xl font-semibold text-[#34c759]">{stats.interviewsScheduled}</p>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#185a9d]">Recent Applications</h2>
            <div className="mt-6">
              <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#185a9d]">Candidate</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#185a9d]">Position</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#185a9d]">Date</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#185a9d]">Status</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-[#185a9d]">Type</th>
                          <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                            <span className="sr-only">View</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentApplications.map((application) => (
                          <tr key={application.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-[#185a9d]">
                              {application.id}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{application.position}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{application.date}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                application.status === 'New' ? 'bg-[#ff2d55]/10 text-[#ff2d55]' :
                                application.status === 'Under Review' ? 'bg-[#ff9500]/10 text-[#ff9500]' :
                                'bg-[#34c759]/10 text-[#34c759]'
                              }`}>
                                {application.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{application.type}</td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                              <Link to={`/employer/applications/${application.id}`} className="text-[#185a9d] hover:text-[#43cea2]">
                                View<span className="sr-only">, {application.candidateName}</span>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 3 Features - Reverse Hiring */}
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#185a9d] mb-2">Reverse Hiring</h2>
            <p className="text-gray-600 mb-6">Discover talented job seekers through video reels and unlock their full profiles with credits.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/employer/reels"
                className="group bg-gradient-to-br from-[#00c6fb] to-[#005bea] p-6 rounded-xl border border-[#00c6fb] hover:border-[#005bea] hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🎥</div>
                  <div>
                    <h3 className="font-semibold text-[#005bea] group-hover:text-[#003366]">Job Seeker Reels</h3>
                    <p className="text-sm text-[#00c6fb]">Browse video profiles</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/employer/saved-videos"
                className="group bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">💾</div>
                  <div>
                    <h3 className="font-semibold text-blue-800 group-hover:text-blue-900">Saved Videos</h3>
                    <p className="text-sm text-blue-600">View your saved profiles</p>
                  </div>
                </div>
              </Link>
              <Link
                to="/employer/credits"
                className="group bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">💳</div>
                  <div>
                    <h3 className="font-semibold text-purple-800 group-hover:text-purple-900">Credits</h3>
                    <p className="text-sm text-purple-600">Manage your balance</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard; 
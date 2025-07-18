import React, { useState, useEffect, useContext } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../../config/supabase';
import ResponsiveChart from '../../components/ResponsiveChart';
import ResponsiveTable from '../../components/ResponsiveTable';
import { AuthContext } from '../../contexts/AuthContext';

// API Response Interfaces
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface JobMetrics {
  id: string;
  title: string;
  views: number;
  applications: number;
  shortlisted: number;
  hired: number;
  conversionRate: number;
  postedDate: string;
  status: 'active' | 'closed' | 'draft';
}

interface CandidateMetrics {
  total: number;
  bySource: { source: string; count: number }[];
  byExperience: { range: string; count: number }[];
  byLocation: { location: string; count: number }[];
  byStatus: { status: string; count: number }[];
  bySkill: { skill: string; count: number }[];
}

interface TimeMetrics {
  date: string;
  views: number;
  applications: number;
  shortlisted: number;
  hired: number;
}

interface AnalyticsData {
  jobMetrics: JobMetrics[];
  candidateMetrics: CandidateMetrics;
  timeMetrics: TimeMetrics[];
  summary: {
    totalViews: number;
    totalApplications: number;
    conversionRate: number;
    averageTimeToHire: number;
    activeJobs: number;
    totalHired: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Analytics: React.FC = () => {
  const { profile } = useContext(AuthContext);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // State for each analytics section
  const [summary, setSummary] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'performance' | 'funnel' | 'top' | 'activity'>('overview');

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!profile?.id) return;
      // Fetch all company_ids for this user from employer_companies
      const { data: links, error: linkError } = await supabase
        .from('employer_companies')
        .select('company_id')
        .eq('user_id', profile.id);
      if (linkError) return;
      const companyIds = (links || []).map((l: any) => l.company_id);
      if (companyIds.length > 0) setCompanyId(companyIds[0]);
    };
    fetchCompanyId();
  }, [profile]);

  // Fetch all analytics data
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      supabase.rpc('get_employer_summary', { company_id: companyId }),
      supabase.rpc('get_employer_performance', { company_id: companyId }),
      supabase.rpc('get_employer_applications_timeseries', { company_id: companyId, days: timeRange }),
      supabase.rpc('get_employer_candidate_funnel', { company_id: companyId }),
      supabase.rpc('get_employer_top_posts', { company_id: companyId, limit_count: 5 }),
      supabase.rpc('get_employer_recent_activity', { company_id: companyId, limit_count: 10 })
    ])
      .then(([summaryRes, perfRes, tsRes, funnelRes, topRes, activityRes]) => {
        // Check for errors and provide fallback data
        if (summaryRes.error) {
          console.error('Summary error:', summaryRes.error);
          setSummary({ total_posted: 0, total_applications: 0, total_hired: 0, active_jobs: 0, conversion_rate: 0 });
        } else {
          setSummary(summaryRes.data?.[0] || { total_posted: 0, total_applications: 0, total_hired: 0, active_jobs: 0, conversion_rate: 0 });
        }
        
        if (perfRes.error) {
          console.error('Performance error:', perfRes.error);
          setPerformance([]);
        } else {
          setPerformance(perfRes.data || []);
        }
        
        if (tsRes.error) {
          console.error('Time series error:', tsRes.error);
          setTimeSeries([]);
        } else {
          setTimeSeries(tsRes.data || []);
        }
        
        if (funnelRes.error) {
          console.error('Funnel error:', funnelRes.error);
          setFunnel([]);
        } else {
          setFunnel(funnelRes.data || []);
        }
        
        if (topRes.error) {
          console.error('Top posts error:', topRes.error);
          setTopPosts([]);
        } else {
          setTopPosts(topRes.data || []);
        }
        
        if (activityRes.error) {
          console.error('Recent activity error:', activityRes.error);
          setRecentActivity([]);
        } else {
          setRecentActivity(activityRes.data || []);
        }
      })
      .catch((err) => {
        console.error('Analytics error:', err);
        setError(err.message || 'Failed to fetch analytics data');
        // Set fallback data
        setSummary({ total_posted: 0, total_applications: 0, total_hired: 0, active_jobs: 0, conversion_rate: 0 });
        setPerformance([]);
        setTimeSeries([]);
        setFunnel([]);
        setTopPosts([]);
        setRecentActivity([]);
      })
      .finally(() => setLoading(false));
  }, [companyId, timeRange]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Overview Section
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Posts</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{summary?.total_posted ?? '-'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Applications</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{summary?.total_applications ?? '-'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Hired</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{summary?.total_hired ?? '-'}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h3 className="text-lg font-medium text-gray-900">Applications Over Time</h3>
          <div className="flex space-x-2">
            {[7, 30, 90].map((d) => (
            <button
                key={d}
                onClick={() => setTimeRange(d as 7 | 30 | 90)}
              className={`px-3 py-1 rounded-md text-sm ${
                  timeRange === d
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
                {d}D
            </button>
            ))}
          </div>
        </div>
        <ResponsiveChart
          type="line"
          data={timeSeries}
          dataKey="applications_count"
          nameKey="date"
          height={300}
        />
      </div>
    </div>
  );

  // Performance Table
  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Post Performance</h3>
        <ResponsiveTable
          columns={[
            { header: 'Title', accessor: 'job_title' },
            { header: 'Applications', accessor: 'applications_count' },
            { header: 'Shortlisted', accessor: 'shortlisted_count' },
            { header: 'Hired', accessor: 'hired_count' },
            {
              header: 'Conversion Rate',
              accessor: 'conversion_rate',
              render: (value) => `${value}%`,
            },
            { header: 'Posted Date', accessor: 'posted_date', render: (v) => v && new Date(v).toLocaleDateString() },
          ]}
          data={performance}
        />
      </div>
    </div>
  );

  // Funnel
  const renderFunnel = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Application Funnel</h3>
        <ResponsiveChart
          type="bar"
          data={funnel}
          dataKey="count"
          nameKey="stage"
          height={300}
        />
      </div>
    </div>
  );

  // Top Posts
  const renderTopPosts = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Top Performing Posts</h3>
        <ResponsiveTable
          columns={[
            { header: 'Title', accessor: 'job_title' },
            { header: 'Applications', accessor: 'applications_count' },
            { header: 'Conversion Rate', accessor: 'conversion_rate', render: (value) => `${value}%` },
            { header: 'Posted Date', accessor: 'posted_date', render: (v) => v && new Date(v).toLocaleDateString() },
          ]}
          data={topPosts}
        />
      </div>
    </div>
  );

  // Recent Activity
  const renderRecentActivity = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Activity</h3>
        <ResponsiveTable
          columns={[
            { header: 'Activity Type', accessor: 'activity_type' },
            { header: 'Job Title', accessor: 'job_title' },
            { header: 'Candidate Name', accessor: 'candidate_name' },
            { header: 'Status', accessor: 'status' },
            { header: 'Date', accessor: 'activity_date', render: (v) => v && new Date(v).toLocaleString() },
          ]}
          data={recentActivity}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap sm:flex-nowrap space-x-4 sm:space-x-8">
            <button
              onClick={() => setSelectedMetric('overview')}
              className={`$${
                selectedMetric === 'overview'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedMetric('performance')}
              className={`$${
                selectedMetric === 'performance'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Performance
            </button>
            <button
              onClick={() => setSelectedMetric('funnel')}
              className={`$${
                selectedMetric === 'funnel'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Funnel
            </button>
            <button
              onClick={() => setSelectedMetric('top')}
              className={`$${
                selectedMetric === 'top'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Top Posts
            </button>
            <button
              onClick={() => setSelectedMetric('activity')}
              className={`$${
                selectedMetric === 'activity'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Recent Activity
            </button>
          </nav>
        </div>
      </div>
      {/* Content */}
          {selectedMetric === 'overview' && renderOverview()}
      {selectedMetric === 'performance' && renderPerformance()}
      {selectedMetric === 'funnel' && renderFunnel()}
      {selectedMetric === 'top' && renderTopPosts()}
      {selectedMetric === 'activity' && renderRecentActivity()}
    </div>
  );
};

export default Analytics; 
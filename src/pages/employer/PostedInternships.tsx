import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { FaGraduationCap, FaPlus, FaSearch, FaFilter, FaEdit } from 'react-icons/fa';

interface Internship {
  id: string;
  title: string;
  location: string | { city: string; area: string; pincode?: string; streetAddress?: string };
  type: string;
  status: string;
  created_at: string;
}

const PostedInternships: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useContext(AuthContext);

  const fetchPostedInternships = useCallback(async () => {
    console.log('profile', profile);
    console.log('profile.auth_id', profile?.auth_id);
    console.log('profile.user_id', profile?.user_id);
    console.log('profile.roles', profile?.roles);
    
    if (!profile) {
      setError('Profile not found. Please log in again.');
      setLoading(false);
      return;
    }
    
    // Check if user has employer access by looking for company associations
    // We don't rely on roles since they might not be properly set
    
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
        setInternships([]);
        setLoading(false);
        setError('No company found for your account. Please create a company profile.');
        return;
      }
      // Fetch internships for all companies
      const { data, error } = await supabase
        .from('internships')
        .select('id, title, location, type, status, created_at')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInternships(data as Internship[]);
    } catch (err: any) {
      console.error('Error fetching internships:', err);
      setError('Failed to load your internship postings.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchPostedInternships();
  }, [fetchPostedInternships]);

  const handleStatusChange = async (internshipId: string, newStatus: string) => {
    try {
      await supabase.from('internships').update({ status: newStatus }).eq('id', internshipId);
      setInternships(prev => prev.map(item => 
        item.id === internshipId ? { ...item, status: newStatus } : item
      ));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (internshipId: string) => {
    if (!window.confirm('Are you sure you want to delete this internship?')) return;
    try {
      await supabase.from('internships').delete().eq('id', internshipId);
      setInternships(prev => prev.filter(item => item.id !== internshipId));
    } catch (err) {
      console.error('Error deleting internship:', err);
    }
  };

  // Helper function to get location string
  const getLocationString = (location: string | { city: string; area: string; pincode?: string; streetAddress?: string }): string => {
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

  const filteredInternships = internships.filter(internship => {
    const matchesFilter = filter === 'all' || internship.status === filter;
    const locationString = getLocationString(internship.location);
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         locationString.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: internships.length,
    active: internships.filter(internship => internship.status === 'active').length,
    paused: internships.filter(internship => internship.status === 'paused').length,
    closed: internships.filter(internship => internship.status === 'closed').length,
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb]">
      <div className="p-8">
      <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#185a9d] mb-2">Posted Internships</h1>
            <p className="text-gray-600">Manage and track your internship postings</p>
          </div>
        <Link
          to="/employer/post-internship"
            className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-white bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-2xl shadow-lg hover:from-[#43cea2] hover:to-[#185a9d] transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#185a9d] to-[#43cea2] rounded-2xl transition-all duration-300 ease-out group-hover:from-[#43cea2] group-hover:to-[#185a9d]"></div>
            <div className="relative flex items-center space-x-3">
              <FaGraduationCap className="w-5 h-5" />
              <span className="font-semibold">Post New Internship</span>
              <FaPlus className="w-4 h-4 opacity-80" />
            </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
          <h3 className="text-sm font-medium text-gray-500">Total Internships</h3>
                <p className="text-3xl font-bold text-[#185a9d] mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaGraduationCap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
        </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
          <h3 className="text-sm font-medium text-gray-500">Active Internships</h3>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaGraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
        </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
          <h3 className="text-sm font-medium text-gray-500">Paused Internships</h3>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.paused}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FaGraduationCap className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
        </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
          <h3 className="text-sm font-medium text-gray-500">Closed Internships</h3>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.closed}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaGraduationCap className="w-6 h-6 text-red-600" />
              </div>
            </div>
        </div>
      </div>

      {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-white/20 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search internships..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#185a9d] focus:border-transparent bg-white/50 backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
            </div>
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#185a9d] focus:border-transparent bg-white/50 backdrop-blur-sm appearance-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
            </div>
        </div>
      </div>

      {/* Internships List */}
      <div className="space-y-4">
        {filteredInternships.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-12 border border-white/20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaGraduationCap className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-[#185a9d] mb-2">No internships found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
              <Link
                to="/employer/post-internship"
                className="inline-flex items-center px-6 py-3 bg-[#185a9d] text-white rounded-xl hover:bg-[#43cea2] transition-colors"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Post Your First Internship
              </Link>
          </div>
        ) : (
          filteredInternships.map((internship) => (
              <div key={internship.id} className="bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg hover:shadow-xl hover:border-[#43cea2]/30 transition-all duration-300 p-6">
              <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold text-[#185a9d]">{internship.title}</h3>
                    <p className="text-gray-600 mt-1">{getLocationString(internship.location)}</p>
                    <div className="flex items-center gap-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    internship.status === 'active' ? 'bg-green-100 text-green-800' :
                    internship.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {internship.status.charAt(0).toUpperCase() + internship.status.slice(1)}
                  </span>
                      <span className="text-sm text-gray-500">
                        Posted {new Date(internship.created_at).toLocaleDateString()}
                      </span>
                </div>
              </div>
                <div className="flex items-center space-x-4">
                    <Link 
                      to={`/employer/edit-internship/${internship.id}`}
                      className="text-[#185a9d] hover:text-[#43cea2] transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 flex items-center"
                    >
                      <FaEdit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                    <select
                      className="rounded-lg border border-gray-200 px-3 py-1 focus:ring-2 focus:ring-[#185a9d] focus:border-transparent"
                      value={internship.status}
                      onChange={(e) => handleStatusChange(internship.id, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="closed">Closed</option>
                    </select>
                  <button
                    onClick={() => handleDelete(internship.id)}
                      className="text-red-500 hover:text-red-700 transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
};

export default PostedInternships; 
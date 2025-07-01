import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import JobCardNew from './JobCardNew';

interface JobLocation {
  area?: string;
  city?: string;
  pincode?: string;
  streetAddress?: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | JobLocation;
  type: string;
  salary: string;
  description: string;
  postedDate: string;
  requirements: string[] | any;
  status: 'active' | 'paused' | 'closed' | 'expired';
  applications?: number;
  experience: string;
}

const JobRecommendations: React.FC = () => {
  const { user, profile } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    } else {
      fetchPopularJobs();
    }
  }, [user, profile]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      // Get user preferences from profile
      const userSkills = profile?.skills?.map((s: { name: string }) => s.name) || [];
      const userLocation = profile?.location || '';
      const userDesiredRoles = (profile as any)?.desired_roles || [];

      // Build query based on user preferences
      let query = supabase
        .from('jobs')
        .select('*, companies(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      // Filter by location if available
      if (userLocation) {
        query = query.ilike('location', `%${userLocation}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Simple recommendation logic - can be enhanced with ML
      const recommendedJobs = data?.filter(job => {
        // Check if job title matches desired roles
        const titleMatch = userDesiredRoles.some((role: string) => 
          job.title.toLowerCase().includes(role.toLowerCase())
        );

        // Check if job requirements match user skills
        const skillMatch = userSkills.some(skill => {
          const requirements = Array.isArray(job.requirements) ? job.requirements : [];
          return requirements.some((req: string) => 
            req.toLowerCase().includes(skill.toLowerCase())
          );
        });

        return titleMatch || skillMatch;
      }) || [];

      setRecommendations(recommendedJobs);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Fallback to popular jobs
      fetchPopularJobs();
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*, companies(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching popular jobs:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended for You</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No recommendations available yet.</p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
          >
            Browse All Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {user ? 'Recommended for You' : 'Popular Jobs'}
        </h2>
        <Link
          to="/jobs"
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View All →
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((job) => (
          <JobCardNew key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
};

export default JobRecommendations; 
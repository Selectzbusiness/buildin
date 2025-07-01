import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { AuthContext } from './AuthContext';

interface Location {
  city: string;
  area: string;
}

interface Company {
  id: string;
  name: string;
  logo_url?: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  job_type: string;
  location: Location;
  pay_type: string;
  min_amount: number;
  max_amount: number;
  amount: number;
  pay_rate: string;
  status: string;
  created_at: string;
  company?: Company;
  experience_level?: string;
}

interface Internship {
  id: string;
  title: string;
  description: string;
  internship_type: string;
  location: Location;
  stipend_type: string;
  min_amount: number;
  max_amount: number;
  amount: number;
  pay_rate: string;
  duration: string;
  status: string;
  created_at: string;
  company?: Company;
  experience_level?: string;
}

interface JobsContextType {
  jobs: Job[];
  internships: Internship[];
  companies: Company[];
  loading: boolean;
  error: string | null;
  fetchJobs: () => Promise<void>;
  fetchInternships: () => Promise<void>;
  fetchCompanies: () => Promise<void>;
  createJob: (jobData: Omit<Job, 'id' | 'created_at'>) => Promise<void>;
  createInternship: (internshipData: Omit<Internship, 'id' | 'created_at'>) => Promise<void>;
  updateJob: (id: string, jobData: Partial<Job>) => Promise<Job>;
  updateInternship: (id: string, internshipData: Partial<Internship>) => Promise<Internship>;
  deleteJob: (id: string) => Promise<void>;
  deleteInternship: (id: string) => Promise<void>;
}

export const JobsContext = createContext<JobsContextType | undefined>(undefined);

export const JobsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name,
            logo_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const transformedJobs = (data || []).map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        job_type: job.job_type,
        location: {
          city: job.location?.city || '',
          area: job.location?.area || '',
        },
        pay_type: job.pay_type,
        min_amount: job.min_amount,
        max_amount: job.max_amount,
        amount: job.amount,
        pay_rate: job.pay_rate,
        status: job.status,
        created_at: job.created_at,
        company: job.companies ? { id: job.companies.id, name: job.companies.name, logo_url: job.companies.logo_url } : undefined,
        experience_level: job.experience_level
      }));

      setJobs(transformedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInternships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('internships')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const transformedInternships = (data || []).map(internship => ({
        id: internship.id,
        title: internship.title,
        description: internship.description,
        internship_type: internship.internship_type,
        location: {
          city: internship.location?.city || '',
          area: internship.location?.area || '',
        },
        stipend_type: internship.stipend_type,
        min_amount: internship.min_amount,
        max_amount: internship.max_amount,
        amount: internship.amount,
        pay_rate: internship.pay_rate,
        duration: internship.duration,
        status: internship.status,
        created_at: internship.created_at,
        company: internship.companies ? { id: internship.companies.id, name: internship.companies.name, logo_url: internship.companies.logo_url } : undefined,
        experience_level: internship.experience_level
      }));

      setInternships(transformedInternships);
    } catch (err) {
      console.error('Error fetching internships:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching internships');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching companies');
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (jobData: Omit<Job, 'id' | 'created_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('jobs')
        .insert([{ ...jobData, status: 'active' }]);

      if (insertError) throw insertError;

      await fetchJobs();
    } catch (err) {
      console.error('Error creating job:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the job');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  const createInternship = useCallback(async (internshipData: Omit<Internship, 'id' | 'created_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('internships')
        .insert([{ ...internshipData, status: 'active' }]);

      if (insertError) throw insertError;

      await fetchInternships();
    } catch (err) {
      console.error('Error creating internship:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the internship');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInternships]);

  const updateJob = async (id: string, jobData: Partial<Job>): Promise<Job> => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from job update');

      setJobs(prev => prev.map(job => job.id === id ? data : job));
      return data;
    } catch (err) {
      console.error('Error updating job:', err);
      throw err;
    }
  };

  const updateInternship = async (id: string, internshipData: Partial<Internship>): Promise<Internship> => {
    try {
      const { data, error } = await supabase
        .from('internships')
        .update(internshipData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from internship update');

      setInternships(prev => prev.map(internship => internship.id === id ? data : internship));
      return data;
    } catch (err) {
      console.error('Error updating internship:', err);
      throw err;
    }
  };

  const deleteJob = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'deleted' })
        .eq('id', id);

      if (error) throw error;
      setJobs(prev => prev.filter(job => job.id !== id));
    } catch (err) {
      console.error('Error deleting job:', err);
      throw err;
    }
  };

  const deleteInternship = async (id: string) => {
    try {
      const { error } = await supabase
        .from('internships')
        .update({ status: 'deleted' })
        .eq('id', id);

      if (error) throw error;
      setInternships(prev => prev.filter(internship => internship.id !== id));
    } catch (err) {
      console.error('Error deleting internship:', err);
      throw err;
    }
  };

  const value = {
    jobs,
    internships,
    companies,
    loading,
    error,
    fetchJobs,
    fetchInternships,
    fetchCompanies,
    createJob,
    createInternship,
    updateJob,
    updateInternship,
    deleteJob,
    deleteInternship,
  };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};

export const useJobs = () => {
  const context = useContext(JobsContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
}; 
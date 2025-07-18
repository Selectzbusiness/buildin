import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { FiBriefcase } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.07, stiffness: 120, damping: 14 }
  })
};

const PostedMobile: React.FC = () => {
  const { profile } = useContext(AuthContext);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [postedInternships, setPostedInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'jobs' | 'internships'>('jobs');

  useEffect(() => {
    fetchPostedJobsAndInternships();
    // eslint-disable-next-line
  }, [profile]);

  const fetchPostedJobsAndInternships = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Fetch company id
      const userId = profile.auth_id || profile.user_id;
      const { data: links, error: linkError } = await supabase
        .from('employer_companies')
        .select('company_id')
        .eq('user_id', userId);
      if (linkError) {
        setPostedJobs([]);
        setPostedInternships([]);
        setLoading(false);
        return;
      }
      const companyIds = (links || []).map((l: any) => l.company_id);
      if (companyIds.length === 0) {
        setPostedJobs([]);
        setPostedInternships([]);
        setLoading(false);
        return;
      }
      // Fetch jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, location, job_type, status, created_at')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false });
      setPostedJobs(jobs || []);
      // Fetch internships
      const { data: internships } = await supabase
        .from('internships')
        .select('id, title, location, type, status, created_at')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false });
      setPostedInternships(internships || []);
    } catch (err) {
      setPostedJobs([]);
      setPostedInternships([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-[#e3f0fa] to-[#f4f8fb] flex flex-col p-2">
      <motion.h1
        className="text-2xl font-extrabold text-[#185a9d] mb-4 mt-2 text-center tracking-tight drop-shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      >
        Your Posted Jobs & Internships
      </motion.h1>
      {/* Toggle Buttons */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          className={`flex-1 py-2 rounded-full font-semibold text-base shadow transition-all duration-200 border-2 ${tab === 'jobs' ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white border-[#185a9d] scale-105' : 'bg-white text-[#185a9d] border-[#e3f0fa] hover:bg-[#e3f0fa]'}`}
          onClick={() => setTab('jobs')}
        >
          <span className="inline-flex items-center gap-2 justify-center">
            <FiBriefcase className="w-5 h-5" /> Jobs
          </span>
        </button>
        <button
          className={`flex-1 py-2 rounded-full font-semibold text-base shadow transition-all duration-200 border-2 ${tab === 'internships' ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white border-[#185a9d] scale-105' : 'bg-white text-[#185a9d] border-[#e3f0fa] hover:bg-[#e3f0fa]'}`}
          onClick={() => setTab('internships')}
        >
          <span className="inline-flex items-center gap-2 justify-center">
            <FaGraduationCap className="w-5 h-5" /> Internships
          </span>
        </button>
      </div>
      {/* Animated Content */}
      {loading ? (
        <motion.div
          className="flex justify-center items-center h-40 text-[#185a9d] font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading...
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {tab === 'jobs' ? (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-4"
            >
              {postedJobs.length === 0 ? (
                <motion.div className="text-gray-400 text-center py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>No jobs posted yet.</motion.div>
              ) : (
                postedJobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    className="bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-2 border-2 border-[#e3f0fa] relative overflow-hidden"
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={cardVariants}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#185a9d]/10 to-[#43cea2]/10 flex items-center justify-center">
                        <FiBriefcase className="w-7 h-7 text-[#185a9d]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-base truncate">{job.title}</div>
                        <div className="text-xs text-gray-500 truncate">{typeof job.location === 'string' ? job.location : (job.location?.city || '')}</div>
                        <div className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${job.status === 'active' ? 'bg-green-100 text-green-800' : job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{job.status}</span>
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
              className="grid grid-cols-1 gap-4"
            >
              {postedInternships.length === 0 ? (
                <motion.div className="text-gray-400 text-center py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>No internships posted yet.</motion.div>
              ) : (
                postedInternships.map((internship, i) => (
                  <motion.div
                    key={internship.id}
                    className="bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-2 border-2 border-[#e3f0fa] relative overflow-hidden"
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={cardVariants}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#185a9d]/10 to-[#43cea2]/10 flex items-center justify-center">
                        <FaGraduationCap className="w-7 h-7 text-[#185a9d]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-base truncate">{internship.title}</div>
                        <div className="text-xs text-gray-500 truncate">{typeof internship.location === 'string' ? internship.location : (internship.location?.city || '')}</div>
                        <div className="text-xs text-gray-400">{new Date(internship.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${internship.status === 'active' ? 'bg-green-100 text-green-800' : internship.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{internship.status}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default PostedMobile; 
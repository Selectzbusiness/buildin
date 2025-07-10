import React, { useState, useEffect, useContext } from 'react';
import { FiBriefcase, FiGift, FiCalendar, FiBookmark } from 'react-icons/fi';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import useIsMobile from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'applied', label: 'Applied Jobs', icon: FiBriefcase },
  { id: 'offers', label: 'Job Offers', icon: FiGift },
  { id: 'interviews', label: 'Interviews', icon: FiCalendar },
  { id: 'saved', label: 'Saved Jobs', icon: FiBookmark },
  // Future: { id: 'favorites', label: 'Favorites', icon: FiStar },
];

// Helper function to safely render location data
const renderLocation = (location: any): string => {
  if (!location) return 'Location not specified';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    if (location.city && location.area) {
      return `${location.city}, ${location.area}`;
    }
    if (location.city) return location.city;
    if (location.area) return location.area;
    return 'Location not specified';
  }
  return 'Location not specified';
};

const MyJobs: React.FC = () => {
  const { profile, loading: profileLoading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('applied');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [appliedInternships, setAppliedInternships] = useState<any[]>([]);
  const [jobOffers, setJobOffers] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [savedInternships, setSavedInternships] = useState<any[]>([]);
  const navigate = useNavigate();
  const [modal, setModal] = useState<{ type: string; data?: any } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [appliedTab, setAppliedTab] = useState<'jobs' | 'internships'>('jobs');
  const isMobile = useIsMobile();

  console.log('Full profile object:', profile);

  useEffect(() => {
    if (profileLoading || !profile?.id) return;
    setError(null);
    setLoading(true);
    const fetchData = async () => {
      try {
        if (activeTab === 'applied') {
          console.log('Fetching applications for profile.id:', profile.id);
          // Fetch job applications
          const { data: jobsData, error: jobsError } = await supabase
            .from('applications')
            .select('*, jobs(*, companies(*))')
            .eq('job_seeker_id', profile.id)
            .order('applied_at', { ascending: false });
          if (jobsError) {
            console.error('Error fetching job applications:', jobsError);
            throw jobsError;
          }
          console.log('Fetched jobsData:', jobsData);
          setAppliedJobs(jobsData || []);
          
          // Fetch internship applications
          const { data: internshipsData, error: internshipsError } = await supabase
            .from('internship_applications')
            .select('*, internships(*)')
            .eq('job_seeker_id', profile.id)
            .order('applied_at', { ascending: false });
          if (internshipsError) {
            console.error('Error fetching internship applications:', internshipsError);
            throw internshipsError;
          }
          console.log('Fetched internshipsData:', internshipsData);
          setAppliedInternships(internshipsData || []);
        } else if (activeTab === 'offers') {
          // Fetch job offers for this user
          const { data, error } = await supabase
            .from('job_offers')
            .select('*')
            .eq('offered_to', profile.auth_id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          setJobOffers(data || []);
        } else if (activeTab === 'interviews') {
          // Fetch interviews for this user
          const { data, error } = await supabase
            .from('interviews')
            .select('*, job_offers(*), applications(*, jobs(*, companies(*)))')
            .eq('job_seeker_id', profile.id)
            .order('scheduled_date', { ascending: false });
          if (error) throw error;
          setInterviews(data || []);
        } else if (activeTab === 'saved') {
          // Fetch saved jobs
          const { data: jobFavs, error: jobFavsError } = await supabase
            .from('job_favorites')
            .select('id, job_id, jobs:job_id(*)')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          if (jobFavsError) throw jobFavsError;
          setSavedJobs(jobFavs || []);
          // Fetch saved internships
          const { data: internshipFavs, error: internshipFavsError } = await supabase
            .from('internship_favorites')
            .select('id, internship_id, internships:internship_id(*)')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          if (internshipFavsError) throw internshipFavsError;
          setSavedInternships(internshipFavs || []);
        }
      } catch (err: any) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [activeTab, profile?.id, profileLoading]);

  // UI for each tab
  const renderAppliedJobs = (mobile: boolean) => (
    <div>
      {/* Sub-tabs for Jobs and Internships */}
      <div className="mb-6 flex space-x-4 justify-center">
        <button
          className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 shadow-sm border ${appliedTab === 'jobs' ? 'bg-[#234567] text-white border-[#234567]' : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'}`}
          onClick={() => setAppliedTab('jobs')}
        >
          Jobs
        </button>
        <button
          className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 shadow-sm border ${appliedTab === 'internships' ? 'bg-[#234567] text-white border-[#234567]' : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'}`}
          onClick={() => setAppliedTab('internships')}
        >
          Internships
        </button>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-emerald-400 animate-pulse">
          <FiBriefcase className="w-12 h-12 mb-4" />
          <span className="text-lg font-semibold">Loading your applications...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <div className="space-y-10">
          {/* Job Applications */}
          {appliedTab === 'jobs' && (
            appliedJobs.length > 0 ? (
              <div>
                <h3 className={`text-lg font-bold mb-4 flex items-center ${mobile ? 'text-black' : 'text-gray-800'}`}><FiBriefcase className={`w-5 h-5 mr-2 ${mobile ? 'text-gray-500' : 'text-[#185a9d]'}`} />Job Applications</h3>
                <div className="space-y-6">
                  {appliedJobs.map((app, idx) => (
                    <AnimatePresence key={app.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                        className={`rounded-2xl shadow-md p-5 flex flex-col gap-3 relative overflow-hidden ${mobile ? 'bg-white border border-[#e3e8f0] mb-2' : 'bg-gray-50'}`}
                      >
                        <div className="w-full h-1 rounded-t-2xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] mb-2" />
                        <div className="flex items-center mb-2">
                          <span className={`font-bold text-lg mr-2 ${mobile ? 'text-[#185a9d]' : 'text-[#185a9d]'}`}>{app.jobs?.title}</span>
                          <span className="text-gray-500 text-sm">{app.jobs?.companies?.name}</span>
                        </div>
                        <div className="text-gray-500 text-sm mb-1">{renderLocation(app.jobs?.location)}</div>
                        <div className="text-xs text-gray-400">Applied: {new Date(app.applied_at || app.created_at).toLocaleDateString()}</div>
                        <div className="mt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${mobile ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white shadow' : getStatusColor(app.status)}`}>{app.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex flex-col gap-2 mt-3">
                          <button
                            className="px-4 py-2 bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white rounded-xl font-semibold shadow hover:scale-105 transition"
                            onClick={() => navigate(`/jobs/${app.job_id}`)}
                          >View Details</button>
                          {app.status !== 'withdrawn' && (
                            <button
                              className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition"
                              onClick={() => setModal({ type: 'withdraw', data: app })}
                            >Withdraw</button>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FiBriefcase className="w-12 h-12 mb-4" />
                <span className="text-lg font-semibold">No job applications found.</span>
              </div>
            )
          )}
          {/* Internship Applications */}
          {appliedTab === 'internships' && (
            appliedInternships.length > 0 ? (
              <div>
                <h3 className={`text-lg font-bold mb-4 flex items-center ${mobile ? 'text-black' : 'text-gray-800'}`}><FiBriefcase className={`w-5 h-5 mr-2 ${mobile ? 'text-gray-500' : 'text-[#185a9d]'}`} />Internship Applications</h3>
                <div className="space-y-6">
                  {appliedInternships.map((app, idx) => (
                    <AnimatePresence key={app.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                        className={`rounded-2xl shadow-md p-5 flex flex-col gap-3 relative overflow-hidden ${mobile ? 'bg-white border border-[#e3e8f0] mb-2' : 'bg-gray-50'}`}
                      >
                        <div className="w-full h-1 rounded-t-2xl bg-gradient-to-r from-[#185a9d] to-[#43cea2] mb-2" />
                        <div className="flex items-center mb-2">
                          <span className={`font-bold text-lg mr-2 ${mobile ? 'text-[#185a9d]' : 'text-[#185a9d]'}`}>{app.internships?.title}</span>
                        </div>
                        <div className="text-gray-500 text-sm mb-1">{renderLocation(app.internships?.location)}</div>
                        <div className="text-xs text-gray-400">Applied: {new Date(app.applied_at || app.created_at).toLocaleDateString()}</div>
                        <div className="mt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${mobile ? 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white shadow' : getStatusColor(app.status)}`}>{app.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex flex-col gap-2 mt-3">
                          <button
                            className="px-4 py-2 bg-[#185a9d] text-white rounded-lg font-semibold hover:bg-[#216aad] transition"
                            onClick={() => navigate(`/internships/${app.internship_id}`)}
                          >View Details</button>
                          {app.status !== 'withdrawn' && (
                            <button
                              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition"
                              onClick={() => setModal({ type: 'withdraw', data: app })}
                            >Withdraw</button>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FiBriefcase className="w-12 h-12 mb-4" />
                <span className="text-lg font-semibold">No internship applications found.</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );

  const renderJobOffers = (mobile: boolean) => (
    <div>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-emerald-400 animate-pulse">
          <FiGift className="w-12 h-12 mb-4" />
          <span className="text-lg font-semibold">Loading your job offers...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : jobOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <FiGift className="w-12 h-12 mb-4" />
          <span className="text-lg font-semibold">No job offers found.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {jobOffers.map((offer, idx) => (
            <AnimatePresence key={offer.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-gray-50 rounded-xl shadow p-5 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-lg transition"
              >
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-[#185a9d] font-bold text-lg mr-2">{offer.title}</span>
                    <span className="text-gray-500 text-sm">{offer.company_name}</span>
                  </div>
                  <div className="text-gray-500 text-sm mb-1">{renderLocation(offer.location)}</div>
                  <div className="text-xs text-gray-400">Received: {new Date(offer.created_at).toLocaleDateString()}</div>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(offer.status)}`}>{offer.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col md:items-end space-y-2">
                  {offer.status === 'pending' && (
                    <button
                      className="px-4 py-2 bg-[#185a9d] text-white rounded-lg font-semibold hover:bg-[#216aad] transition"
                      onClick={() => setModal({ type: 'accept', data: offer })}
                    >Accept</button>
                  )}
                  {offer.status === 'pending' && (
                    <button
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition"
                      onClick={() => setModal({ type: 'decline', data: offer })}
                    >Decline</button>
                  )}
                  <button
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-semibold hover:bg-blue-200 transition"
                    onClick={() => setModal({ type: 'schedule', data: offer })}
                  >Schedule Interview</button>
                </div>
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      )}
    </div>
  );

  const renderInterviews = (mobile: boolean) => (
    <div>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-emerald-400 animate-pulse">
          <FiCalendar className="w-12 h-12 mb-4" />
          <span className="text-lg font-semibold">Loading your interviews...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <FiCalendar className="w-12 h-12 mb-4" />
          <span className="text-lg font-semibold">No interviews found.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {interviews.map((interview, idx) => (
            <AnimatePresence key={interview.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-gray-50 rounded-xl shadow p-5 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-lg transition"
              >
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-[#185a9d] font-bold text-lg mr-2">{interview.job_offers?.title || interview.applications?.jobs?.title}</span>
                    <span className="text-gray-500 text-sm">{interview.job_offers?.company_name || interview.applications?.jobs?.companies?.name}</span>
                  </div>
                  <div className="text-gray-500 text-sm mb-1">{renderLocation(interview.location || interview.applications?.jobs?.location)}</div>
                  <div className="text-xs text-gray-400">Scheduled: {new Date(interview.scheduled_date).toLocaleString()}</div>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(interview.status)}`}>{interview.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col md:items-end space-y-2">
                  <button
                    className="px-4 py-2 bg-[#185a9d] text-white rounded-lg font-semibold hover:bg-[#216aad] transition"
                    onClick={() => navigate(`/jobs/${interview.applications?.job_id || interview.job_offers?.job_id}`)}
                  >View Details</button>
                  <button
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-semibold hover:bg-blue-200 transition"
                    onClick={() => setModal({ type: 'schedule', data: interview })}
                  >Reschedule</button>
                </div>
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      )}
    </div>
  );

  const renderSaved = (mobile: boolean) => (
    <div className="pb-2">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-emerald-400 animate-pulse">
          <FiBookmark className="w-12 h-12 mb-4" />
          <span className="text-lg font-semibold">Loading your saved items...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : savedJobs.length === 0 && savedInternships.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <FiBookmark className="w-12 h-12 mb-4" />
          <span className="text-lg font-semibold">No saved jobs or internships found.</span>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Saved Jobs */}
          {savedJobs.length > 0 && (
            <div>
              <h3 className={`text-lg font-bold mb-4 flex items-center ${mobile ? 'text-black' : 'text-gray-800'}`}><FiBriefcase className={`w-5 h-5 mr-2 ${mobile ? 'text-gray-500' : 'text-[#185a9d]'}`} />Saved Jobs</h3>
              <div className="space-y-6">
                {savedJobs.map((fav, idx) => (
                  <AnimatePresence key={fav.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      className={`rounded-2xl shadow-md p-5 flex flex-col gap-3 relative overflow-hidden ${mobile ? 'bg-white border border-[#e3e8f0] mb-2' : 'bg-gray-50'}`}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#185a9d] to-[#43cea2] rounded-l-2xl" />
                      <div className="flex items-center mb-2">
                        <span className={`font-bold text-lg mr-2 ${mobile ? 'text-black' : 'text-[#185a9d]'}`}>{fav.jobs?.title || 'Job Title'}</span>
                        <span className="text-gray-500 text-sm">{fav.jobs?.company || 'Company Name'}</span>
                      </div>
                      <div className="text-gray-500 text-sm mb-1">{renderLocation(fav.jobs?.location)}</div>
                      <div className="text-xs text-gray-400">Saved: {new Date(fav.created_at).toLocaleDateString()}</div>
                      <div className="flex flex-col gap-2 mt-3">
                        <button
                          className="px-4 py-2 bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white rounded-xl font-semibold shadow hover:scale-105 transition"
                          onClick={() => navigate(`/jobs/${fav.job_id}`)}
                        >View Details</button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ))}
              </div>
            </div>
          )}
          {/* Saved Internships */}
          {savedInternships.length > 0 && (
            <div>
              <h3 className={`text-lg font-bold mb-4 flex items-center ${mobile ? 'text-black' : 'text-gray-800'}`}><FiBriefcase className={`w-5 h-5 mr-2 ${mobile ? 'text-gray-500' : 'text-[#185a9d]'}`} />Saved Internships</h3>
              <div className="space-y-6">
                {savedInternships.map((fav, idx) => (
                  <AnimatePresence key={fav.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      className={`rounded-2xl shadow-md p-5 flex flex-col gap-3 relative overflow-hidden ${mobile ? 'bg-white border border-[#e3e8f0] mb-2' : 'bg-blue-50'}`}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#185a9d] to-[#43cea2] rounded-l-2xl" />
                      <div className="flex items-center mb-2">
                        <span className={`font-bold text-lg mr-2 ${mobile ? 'text-black' : 'text-[#185a9d]'}`}>{fav.internships?.title || 'Internship Title'}</span>
                        <span className="text-gray-500 text-sm">{fav.internships?.company || 'Company Name'}</span>
                      </div>
                      <div className="text-gray-500 text-sm mb-1">{renderLocation(fav.internships?.location)}</div>
                      <div className="text-xs text-gray-400">Saved: {new Date(fav.created_at).toLocaleDateString()}</div>
                      <div className="flex flex-col gap-2 mt-3">
                        <button
                          className="px-4 py-2 bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white rounded-xl font-semibold shadow hover:scale-105 transition"
                          onClick={() => navigate(`/internships/${fav.internship_id}`)}
                        >View Details</button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
      case 'submitted':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
      case 'offer_sent':
        return 'bg-green-100 text-green-700';
      case 'declined':
      case 'rejected':
      case 'withdrawn':
        return 'bg-red-100 text-red-700';
      case 'interview_scheduled':
      case 'interviewed':
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'shortlisted':
      case 'reviewed':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  // Withdraw application
  const handleWithdraw = async (app: any) => {
    setModalLoading(true);
    try {
      let error;
      if (app.jobs) {
        // Job application: delete the row
        ({ error } = await supabase
          .from('applications')
          .delete()
          .eq('id', app.id));
        if (!error) setAppliedJobs((prev) => prev.filter((a) => a.id !== app.id));
      } else if (app.internships) {
        // Internship application: delete the row
        ({ error } = await supabase
          .from('internship_applications')
          .delete()
          .eq('id', app.id));
        if (!error) setAppliedInternships((prev) => prev.filter((a) => a.id !== app.id));
      }
      if (error) throw error;
      toast.success('Application withdrawn.');
      setModal(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to withdraw application.');
    } finally {
      setModalLoading(false);
    }
  };

  // Accept offer
  const handleAcceptOffer = async (offer: any) => {
    setModalLoading(true);
    try {
      const { error } = await supabase
        .from('job_offers')
        .update({ status: 'accepted' })
        .eq('id', offer.id);
      if (error) throw error;
      toast.success('Offer accepted!');
      setJobOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, status: 'accepted' } : o)));
      setModal(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept offer.');
    } finally {
      setModalLoading(false);
    }
  };

  // Decline offer
  const handleDeclineOffer = async (offer: any) => {
    setModalLoading(true);
    try {
      const { error } = await supabase
        .from('job_offers')
        .update({ status: 'declined' })
        .eq('id', offer.id);
      if (error) throw error;
      toast.success('Offer declined.');
      setJobOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, status: 'declined' } : o)));
      setModal(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline offer.');
    } finally {
      setModalLoading(false);
    }
  };

  // Schedule/Reschedule interview
  const handleScheduleInterview = async (interview: any, date: string, time: string) => {
    setModalLoading(true);
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ scheduled_date: date, interview_time: time, status: 'scheduled' })
        .eq('id', interview.id);
      if (error) throw error;
      toast.success('Interview scheduled!');
      setInterviews((prev) => prev.map((i) => (i.id === interview.id ? { ...i, scheduled_date: date, interview_time: time, status: 'scheduled' } : i)));
      setModal(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule interview.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className={isMobile ? "min-h-screen bg-[#f4f6fa] px-2 pt-4 pb-20" : "min-h-screen bg-[#f1f5f9]"}>
      {isMobile ? (
        <>
          {/* Main Card/Section (mobile, soft background, safe padding) */}
          <div className="w-full max-w-md mx-auto bg-[#f8fafc] rounded-3xl shadow-xl p-5 mt-4 mb-10 border border-[#e3e8f0]" style={{marginLeft: 'auto', marginRight: 'auto'}}>
            {/* Header */}
            <div className="mb-8 flex flex-col items-center">
              <div className="w-12 h-1 rounded-full bg-[#b6c6e3] mb-3" />
              <h1 className="text-3xl font-extrabold text-[#234567] mb-1 tracking-tight">My Jobs</h1>
              <p className="text-gray-600 text-center text-base font-medium">Track your job applications, offers, and interviews in one place.</p>
            </div>

            {/* Tabs */}
            <div className="mb-8 overflow-x-auto">
              <nav className="flex space-x-2 bg-[#e3e8f0] rounded-xl shadow p-2 min-w-full">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-4 py-2 rounded-full font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#b6c6e3] whitespace-nowrap text-sm shadow-sm
                        ${activeTab === tab.id
                          ? 'bg-[#234567] text-white scale-105 shadow-lg'
                          : 'text-[#234567] bg-white hover:bg-[#e3e8f0] hover:text-[#234567]'}
                      `}
                      style={{ minWidth: 110 }}
                    >
                      <Icon className={`w-5 h-5 mr-2 ${activeTab === tab.id ? 'text-white' : 'text-[#b6c6e3]'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-[#f4f6fa] rounded-2xl shadow-lg p-4 min-h-[400px] transition-all duration-300">
              {activeTab === 'applied' && renderAppliedJobs(true)}
              {activeTab === 'offers' && renderJobOffers(true)}
              {activeTab === 'interviews' && renderInterviews(true)}
              {activeTab === 'saved' && renderSaved(true)}
            </div>
          </div>
        </>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#185a9d] mb-2">My Jobs</h1>
                <p className="text-gray-500">Track your job applications, offers, and interviews in one place.</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-2 bg-white rounded-xl shadow p-2 h-12">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-5 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#185a9d] h-12 min-h-full flex-1
                        ${activeTab === tab.id ? 'bg-[#e3f0fa] text-[#185a9d] shadow' : 'text-gray-600 hover:bg-[#f1f5f9] hover:text-[#185a9d]'}`}
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[400px]">
              {activeTab === 'applied' && renderAppliedJobs(false)}
              {activeTab === 'offers' && renderJobOffers(false)}
              {activeTab === 'interviews' && renderInterviews(false)}
              {activeTab === 'saved' && renderSaved(false)}
            </div>

            {/* Modal */}
            {modal && (
              <Modal
                isOpen={!!modal}
                onClose={() => setModal(null)}
                title={
                  modal.type === 'withdraw' ? 'Withdraw Application' :
                  modal.type === 'accept' ? 'Accept Job Offer' :
                  modal.type === 'decline' ? 'Decline Job Offer' :
                  modal.type === 'schedule' ? 'Schedule Interview' :
                  'Confirm Action'
                }
                actions={
                  modal.type === 'withdraw' ? [
                    <button
                      key="cancel"
                      className="px-4 py-2 bg-gray-200 rounded-lg font-semibold mr-2"
                      onClick={() => setModal(null)}
                      disabled={modalLoading}
                    >Cancel</button>,
                    <button
                      key="withdraw"
                      className="px-4 py-2 bg-[#185a9d] text-white rounded-lg font-semibold"
                      onClick={() => handleWithdraw(modal.data)}
                      disabled={modalLoading}
                    >{modalLoading ? 'Withdrawing...' : 'Withdraw'}</button>
                  ] : modal.type === 'accept' ? [
                    <button
                      key="cancel"
                      className="px-4 py-2 bg-gray-200 rounded-lg font-semibold mr-2"
                      onClick={() => setModal(null)}
                      disabled={modalLoading}
                    >Cancel</button>,
                    <button
                      key="accept"
                      className="px-4 py-2 bg-[#185a9d] text-white rounded-lg font-semibold"
                      onClick={() => handleAcceptOffer(modal.data)}
                      disabled={modalLoading}
                    >{modalLoading ? 'Accepting...' : 'Accept Offer'}</button>
                  ] : modal.type === 'decline' ? [
                    <button
                      key="cancel"
                      className="px-4 py-2 bg-gray-200 rounded-lg font-semibold mr-2"
                      onClick={() => setModal(null)}
                      disabled={modalLoading}
                    >Cancel</button>,
                    <button
                      key="decline"
                      className="px-4 py-2 bg-[#185a9d] text-white rounded-lg font-semibold"
                      onClick={() => handleDeclineOffer(modal.data)}
                      disabled={modalLoading}
                    >{modalLoading ? 'Declining...' : 'Decline'}</button>
                  ] : modal.type === 'schedule' ? (
                    <ScheduleInterviewForm
                      interview={modal.data}
                      onSubmit={handleScheduleInterview}
                      onCancel={() => setModal(null)}
                      loading={modalLoading}
                    />
                  ) : null
                }
              >
                {modal.type === 'withdraw' && (
                  <span>Are you sure you want to withdraw your application for <b>{modal.data?.jobs?.title || modal.data?.internships?.title}</b> at <b>{modal.data?.jobs?.companies?.name || modal.data?.internships?.company}</b>?</span>
                )}
                {modal.type === 'accept' && (
                  <span>Are you sure you want to <b>accept</b> the offer for <b>{modal.data?.title}</b> at <b>{modal.data?.company_name}</b>?</span>
                )}
                {modal.type === 'decline' && (
                  <span>Are you sure you want to <b>decline</b> the offer for <b>{modal.data?.title}</b> at <b>{modal.data?.company_name}</b>?</span>
                )}
                {modal.type === 'schedule' && (
                  <span>Schedule your interview for <b>{modal.data?.job_offers?.title || modal.data?.applications?.jobs?.title}</b>.</span>
                )}
              </Modal>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ScheduleInterviewForm = ({ interview, onSubmit, onCancel, loading }: any) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!date || !time) return;
        onSubmit(interview, date, time);
      }}
      className="space-y-4 w-full"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full p-2 border rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="w-full p-2 border rounded-lg"
          required
        />
      </div>
      <div className="flex justify-end space-x-3 mt-4">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 rounded-lg font-semibold"
          onClick={onCancel}
          disabled={loading}
        >Cancel</button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#185a9d] text-white rounded-lg font-semibold"
          disabled={loading}
        >{loading ? 'Scheduling...' : 'Schedule'}</button>
      </div>
    </form>
  );
};

export default MyJobs; 
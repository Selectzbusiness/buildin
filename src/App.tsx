import React, { useContext, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import { JobsProvider } from './contexts/JobsContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import MainLayout from './layouts/MainLayout';
import EmployerLayout from './layouts/EmployerLayout';

// Pages
import Home from './pages/Home';
import Jobs from './pages/jobseeker/Jobs';
import Internships from './pages/jobseeker/Internships';
import Companies from './pages/Companies';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AuthCallback from './pages/auth/AuthCallback';
import JobDetails from './pages/jobseeker/JobDetails';
import InternshipDetails from './pages/jobseeker/InternshipDetails';
import JobApplication from './pages/jobseeker/JobApplication';
import InternshipApplication from './pages/jobseeker/InternshipApplication';
import JobseekerProfile from './pages/jobseeker/JobseekerProfile';

import JobseekerSettings from './pages/JobseekerSettings';
import EmployerProfile from './pages/employer/EmployerProfile';
import EmployerDashboard from './pages/employer/Dashboard';
import Applications from './pages/employer/Applications';
import Billing from './pages/employer/Billing';
import Analytics from './pages/employer/Analytics';
import EmployerSettings from './pages/employer/EmployerSettings';
import ModernMultiStepJobForm from './components/ModernMultiStepJobForm';
import ModernMultiStepInternshipForm from './components/ModernMultiStepInternshipForm';
import EditJobForm from './components/EditJobForm';
import EditInternshipForm from './components/EditInternshipForm';
import PostedJobs from './pages/employer/PostedJobs';
import PostedInternships from './pages/employer/PostedInternships';
import NotFound from './pages/NotFound';
import CompanyDetailsForm from './pages/employer/CompanyDetailsForm';
import EmployerJobSeekerProfileView from './pages/employer/EmployerJobSeekerProfileView';
import JobSeekerReels from './pages/employer/JobSeekerReels';
import SavedJobSeekerVideos from './pages/employer/SavedJobSeekerVideos';
import Credits from './pages/employer/Credits';
import MyJobs from './pages/jobseeker/MyJobs';
import Favourites from './pages/jobseeker/Favourites';
import NotificationsPage from './pages/notifications';
import PostedMobile from './pages/employer/PostedMobile';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Courses from './pages/employer/Courses';

// Footer Components
import Careers from './components/Careers';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import ContactUs from './components/ContactUs';
import HelpCenter from './components/HelpCenter';
import AboutUs from './components/AboutUs';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

// Role-specific protected route (now only checks authentication)
const RoleProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole: 'employer' | 'jobseeker';
}> = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

// Special route for company details that allows any authenticated user
const CompanyDetailsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

// Utility to detect mobile device
const isMobile = () => typeof window !== 'undefined' && (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));

function SafeArea({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top, 24px)' }}>
      {children}
    </div>
  );
}

// Course features (lazy load for performance)
const CourseCreateWizard = lazy(() => import('./components/courses/CourseCreateWizard'));
const CourseEmployerDashboard = lazy(() => import('./components/courses/CourseEmployerDashboard'));
const CourseMarketplace = lazy(() => import('./components/courses/CourseMarketplace'));
const CourseDetails = lazy(() => import('./components/courses/CourseDetails'));
const MyCoursesDashboard = lazy(() => import('./components/courses/MyCoursesDashboard'));
const CourseWishlist = lazy(() => import('./components/courses/CourseWishlist'));
const CourseNotifications = lazy(() => import('./components/courses/CourseNotifications'));
const AdminCourseModeration = lazy(() => import('./components/courses/AdminCourseModeration'));
const LearningHub = lazy(() => import('./components/courses/LearningHub'));
const CourseAnalytics = lazy(() => import('./components/courses/CourseAnalytics'));
const CourseSettings = lazy(() => import('./components/courses/CourseSettings'));
const CourseBulkUpload = lazy(() => import('./components/courses/CourseBulkUpload'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <JobsProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <SafeArea>
            <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#185a9d]"></div></div>}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                
                {/* Main layout routes (for jobseekers) */}
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="jobs" element={<Jobs />} />
                  <Route path="internships" element={<Internships />} />
                  <Route path="jobs/:id" element={<JobDetails />} />
                  <Route path="jobs/:id/apply" element={<JobApplication />} />
                  <Route path="internships/:id" element={<InternshipDetails />} />
                  <Route path="internships/:id/apply" element={<InternshipApplication />} />
                  <Route path="profile" element={<JobseekerProfile />} />
                  <Route path="settings" element={
                    <RoleProtectedRoute allowedRole="jobseeker">
                      <JobseekerSettings />
                    </RoleProtectedRoute>
                  } />
                  <Route path="my-jobs" element={<MyJobs />} />
                  <Route path="favourites" element={<Favourites />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="/my-wishlist" element={<CourseWishlist />} />
                  <Route path="/course-notifications" element={<CourseNotifications />} />
                  <Route path="/learning" element={<LearningHub />} />
                    
                    {/* Footer Pages */}
                    <Route path="careers" element={<Careers />} />
                    <Route path="terms" element={<TermsOfService />} />
                    <Route path="privacy" element={<PrivacyPolicy />} />
                    <Route path="contact" element={<ContactUs />} />
                    <Route path="help" element={<HelpCenter />} />
                    <Route path="about" element={<AboutUs />} />
                </Route>
                
                {/* Company Details Form - accessible to authenticated users with employer role */}
                <Route 
                  path="/employer/company-details" 
                  element={
                    <CompanyDetailsRoute>
                      <CompanyDetailsForm />
                    </CompanyDetailsRoute>
                  } 
                />
                
                {/* Employer routes */}
                <Route
                  path="/employer"
                  element={
                    <RoleProtectedRoute allowedRole="employer">
                      <EmployerLayout />
                    </RoleProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<EmployerDashboard />} />
                  <Route path="jobs" element={<PostedJobs />} />
                  <Route path="internships" element={<PostedInternships />} />
                  <Route path="applications" element={<Applications />} />
                  <Route path="courses" element={<Courses />} />
                  <Route path="courses/create" element={<CourseCreateWizard />} />
                  <Route path="course-analytics" element={<CourseAnalytics />} />
                  <Route path="course-settings" element={<CourseSettings />} />
                  <Route path="course-upload" element={<CourseBulkUpload />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="profile" element={<EmployerProfile />} />
                  <Route path="settings" element={<EmployerSettings />} />
                    <Route path="post-job" element={<ModernMultiStepJobForm />} />
                  <Route path="posted-jobs" element={<PostedJobs />} />
                  <Route path="edit-job/:jobId" element={<EditJobForm />} />
                    <Route path="post-internship" element={<ModernMultiStepInternshipForm />} />
                  <Route path="posted-internships" element={<PostedInternships />} />
                  <Route path="edit-internship/:internshipId" element={<EditInternshipForm />} />
                  <Route path="job-seeker-profile/:id" element={<EmployerJobSeekerProfileView />} />
                  <Route path="reels" element={<JobSeekerReels />} />
                  <Route path="saved-videos" element={<SavedJobSeekerVideos />} />
                  <Route path="posted-mobile" element={<PostedMobile />} />
                  <Route path="credits" element={<Credits />} />
                    
                    {/* Footer Pages */}
                    <Route path="careers" element={<Careers />} />
                    <Route path="terms" element={<TermsOfService />} />
                    <Route path="privacy" element={<PrivacyPolicy />} />
                    <Route path="contact" element={<ContactUs />} />
                    <Route path="help" element={<HelpCenter />} />
                    <Route path="about" element={<AboutUs />} />
                </Route>
                
                {/* Course features for jobseekers */}
                <Route path="/courses" element={<CourseMarketplace />} />
                <Route path="/courses/:courseId" element={<CourseDetails />} />
                <Route path="/my-courses" element={<MyCoursesDashboard />} />
                <Route path="/admin/courses" element={<AdminCourseModeration />} />
                {/* Employer course features */}
                <Route path="/employer/courses" element={<CourseEmployerDashboard />} />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SafeArea>
        </JobsProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
};

export default App; 
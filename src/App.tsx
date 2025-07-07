import React, { useContext } from 'react';
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
import JobDetails from './pages/jobseeker/JobDetails';
import InternshipDetails from './pages/jobseeker/InternshipDetails';
import JobApplication from './pages/jobseeker/JobApplication';
import InternshipApplication from './pages/jobseeker/InternshipApplication';
import JobseekerProfile from './pages/jobseeker/JobseekerProfile';
import JobseekerDashboard from './pages/JobseekerDashboard';
import JobseekerSettings from './pages/JobseekerSettings';
import EmployerProfile from './pages/employer/EmployerProfile';
import EmployerDashboard from './pages/employer/Dashboard';
import Applications from './pages/employer/Applications';
import Billing from './pages/employer/Billing';
import Analytics from './pages/employer/Analytics';
import EmployerSettings from './pages/employer/EmployerSettings';
import ModernMultiStepJobForm from './components/ModernMultiStepJobForm';
import ModernMultiStepInternshipForm from './components/ModernMultiStepInternshipForm';
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
import MessagingSystem from './components/MessagingSystem';
import Inbox from './pages/jobseeker/Inbox';

// Footer Components
import Careers from './components/Careers';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import ContactUs from './components/ContactUs';
import HelpCenter from './components/HelpCenter';
import AboutUs from './components/AboutUs';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" />;
  }
  // If user has employer role, redirect to employer dashboard
  if (profile?.roles?.includes('employer')) {
    return <Navigate to="/employer/dashboard" />;
  }
  // If user has jobseeker role, redirect to home
  if (profile?.roles?.includes('jobseeker')) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};

// Role-specific protected route
const RoleProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRole: 'employer' | 'jobseeker';
}> = ({ children, allowedRole }) => {
  const { user, profile } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" />;
  }
  // Check if user has the required role
  if (!profile?.roles?.includes(allowedRole)) {
    // Redirect based on what roles they do have
    if (profile?.roles?.includes('employer')) {
      return <Navigate to="/employer/dashboard" />;
    } else if (profile?.roles?.includes('jobseeker')) {
      return <Navigate to="/" />;
    } else {
      return <Navigate to="/login" />;
    }
  }
  return <>{children}</>;
};

// Special route for company details that allows employers without company profile
const CompanyDetailsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" />;
  }
  // Only allow employers to access this route
  if (!profile?.roles?.includes('employer')) {
    if (profile?.roles?.includes('jobseeker')) {
      return <Navigate to="/" />;
    } else {
      return <Navigate to="/login" />;
    }
  }
  return <>{children}</>;
};

// Utility to detect mobile device
const isMobile = () => typeof window !== 'undefined' && (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));

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
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
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
              <Route path="inbox" element={<RoleProtectedRoute allowedRole="jobseeker"><Inbox /></RoleProtectedRoute>} />
                
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
              <Route path="billing" element={<Billing />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<EmployerProfile />} />
              <Route path="settings" element={<EmployerSettings />} />
                <Route path="post-job" element={<ModernMultiStepJobForm />} />
              <Route path="posted-jobs" element={<PostedJobs />} />
                <Route path="post-internship" element={<ModernMultiStepInternshipForm />} />
              <Route path="posted-internships" element={<PostedInternships />} />
              <Route path="job-seeker-profile/:id" element={<EmployerJobSeekerProfileView />} />
              <Route path="reels" element={<JobSeekerReels />} />
              <Route path="saved-videos" element={<SavedJobSeekerVideos />} />
              <Route path="credits" element={<Credits />} />
              <Route path="inbox" element={<RoleProtectedRoute allowedRole="employer"><MessagingSystem currentRole="employer" /></RoleProtectedRoute>} />
                
                {/* Footer Pages */}
                <Route path="careers" element={<Careers />} />
                <Route path="terms" element={<TermsOfService />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="contact" element={<ContactUs />} />
                <Route path="help" element={<HelpCenter />} />
                <Route path="about" element={<AboutUs />} />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </JobsProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
};

export default App; 
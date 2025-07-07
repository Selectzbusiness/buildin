import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import useIsMobile from '../../hooks/useIsMobile';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'jobseeker' as 'jobseeker' | 'employer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    // Test localStorage availability with better error handling
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      console.log('localStorage is available and working.');
    } catch (e) {
      console.error('localStorage is NOT available! Supabase auth will not persist sessions.', e);
      // Don't block the app, just log the error
    }
  }, []);

  useEffect(() => {
    // Check session with better error handling for mobile
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session check error:', error);
          return;
        }
        if (data?.session) {
          console.log('Supabase session found on load:', data.session);
        } else {
          console.warn('No Supabase session found on load.');
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };
    
    checkSession();
  }, []);

  console.log('App is running as a client-side SPA. SSR is NOT present.');

  // Log Supabase config for debugging (mask anon key)
  console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
  if (process.env.REACT_APP_SUPABASE_ANON_KEY) {
    console.log('Supabase Anon Key (masked):', process.env.REACT_APP_SUPABASE_ANON_KEY.slice(0, 6) + '...');
  } else {
    console.warn('Supabase Anon Key is missing!');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Check network connectivity for mobile
    if (isMobile && !navigator.onLine) {
      setError('No internet connection. Please check your network and try again.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    console.log('Login started');
    try {
      if (!formData.email || !formData.password) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      // Login with Supabase Auth - with better mobile error handling
      console.log('Before supabase.auth.signInWithPassword');
      let loginData: any, loginError: any;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        loginData = data;
        loginError = error;
        console.log('Supabase signInWithPassword response:', { data, error });
        if (error) {
          // Better error messages for mobile users
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please check your email and confirm your account before logging in.');
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            setError('Network error. Please check your internet connection and try again.');
          } else {
            setError(error.message || 'Login failed. Please try again.');
          }
          setLoading(false);
          return;
        }
        if (!data.session) {
          setError('Login failed: No session returned. Please check your credentials or confirm your email.');
          setLoading(false);
          return;
        }
        if (!data.user) {
          setError('Login failed: No user returned. Please check your credentials or confirm your email.');
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.error('Network or Supabase error (catch block):', err);
        if (err.message.includes('network') || err.message.includes('fetch')) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
        setLoading(false);
        return;
      }
      console.log('After supabase.auth.signInWithPassword', { data: loginData, error: loginError });

      // Immediately check the session after login with better error handling
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session check error:', sessionError);
          // Don't fail the login if session check fails, continue with the login data
        }
        if (!sessionData.session) {
          console.warn('Session not immediately available after login, but continuing...');
          // Don't fail the login, the session might be available shortly
        } else {
          console.log('Session check after login:', sessionData);
        }
      } catch (err) {
        console.error('Error checking session after login:', err);
        // Don't fail the login if session check fails
      }

      // Fetch user profile from profiles table (not users) with better error handling
      let userProfile = null;
      let profileError = null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_id', loginData.user.id)
          .single();
        
        userProfile = data;
        profileError = error;
        
        // If profile does not exist, insert it
        if (!userProfile) {
          console.log('Creating new user profile...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              auth_id: loginData.user.id,
              email: loginData.user.email,
              full_name: loginData.user.user_metadata?.full_name || '',
              role: formData.role,
              roles: [formData.role],
            }]);
          if (insertError) {
            console.error('Failed to create user profile:', insertError);
            // Don't fail the login, continue with basic user data
            userProfile = {
              auth_id: loginData.user.id,
              email: loginData.user.email,
              full_name: loginData.user.user_metadata?.full_name || '',
              role: formData.role,
              roles: [formData.role],
            };
          } else {
            // Try to fetch the newly created profile
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('auth_id', loginData.user.id)
              .single();
            userProfile = newProfile;
          }
        }
      } catch (err) {
        console.error('Error handling user profile:', err);
        // Don't fail the login, continue with basic user data
        userProfile = {
          auth_id: loginData.user.id,
          email: loginData.user.email,
          full_name: loginData.user.user_metadata?.full_name || '',
          role: formData.role,
          roles: [formData.role],
        };
      }

      // Ensure roles is an array with better error handling
      let roles = userProfile?.roles || [];
      if (!Array.isArray(roles)) {
        roles = userProfile?.role ? [userProfile.role] : [formData.role];
      }
      if (!roles.includes(formData.role)) {
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              role: formData.role,
              roles: [...roles, formData.role]
            })
            .eq('auth_id', loginData.user.id);
          if (updateError) {
            console.error('Error updating user roles:', updateError);
          } else {
            roles = [...roles, formData.role];
          }
        } catch (err) {
          console.error('Error updating roles:', err);
          // Don't fail the login, use the current role
          roles = [formData.role];
        }
      }
      if (roles.length === 0) {
        console.warn('No roles found, using default role');
        roles = [formData.role];
      }

      console.log('After login, before profile fetch');
      setUser(loginData.user);
      setProfile(userProfile);
      setSuccess('Login successful! Redirecting...');
      setLoading(false);

      // Show success message for 2 seconds, then redirect
      console.log('Setting up redirect for role:', formData.role, 'isMobile:', isMobile);
      
      // Store redirect info in case we need a fallback
      const redirectInfo = {
        role: formData.role,
        isMobile: isMobile,
        timestamp: Date.now()
      };
      
      // Immediate redirect for mobile to avoid setTimeout issues
      if (isMobile) {
        console.log('Mobile detected, redirecting immediately');
        if (formData.role === 'employer') {
          console.log('Mobile: Redirecting employer to company-details');
          window.location.href = '/employer/company-details';
        } else {
          console.log('Mobile: Redirecting candidate to home');
          window.location.href = '/';
        }
        return;
      }
      
      // Desktop: Use setTimeout for smooth UX
      setTimeout(() => {
        console.log('Executing redirect for role:', formData.role);
        if (formData.role === 'employer') {
          console.log('Redirecting employer to company-details');
          navigate('/employer/company-details');
        } else {
          console.log('Redirecting candidate');
          navigate('/');
        }
      }, 2000);
      
      // Fallback redirect after 5 seconds in case setTimeout fails (desktop only)
      setTimeout(() => {
        console.log('Fallback redirect triggered for role:', formData.role);
        if (formData.role === 'employer') {
          console.log('Fallback: Redirecting employer to company-details');
          window.location.href = '/employer/company-details';
        } else {
          console.log('Fallback: Redirecting candidate');
          window.location.href = '/';
        }
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login. Please try again.');
      setLoading(false);
      console.error('Login error', err);
    } finally {
      setLoading(false);
      console.log('Login finished');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8 overflow-hidden">
      <div className="stripe-animated-bg" aria-hidden="true"></div>
      <div className="relative z-10 w-full max-w-sm sm:max-w-md">
        {/* Logo and header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <img
              src="/selectz.logo.png"
              alt="Selectz Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-sm mr-3 object-contain shadow"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            />
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Selectz</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-white/80 text-sm">
            Login to continue your journey
          </p>
        </div>

        {/* Form container */}
        <div className="glass-stripe p-6 sm:p-8">
          {/* Error/Success messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm animate-fadeIn">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-600 text-sm animate-fadeIn">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            </div>
          )}

          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#185a9d] focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
                  placeholder="Enter your email"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#185a9d] focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm sm:text-base pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-semibold text-gray-700">
                I want to access as
              </label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'jobseeker' | 'employer' })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#185a9d] focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm appearance-none text-sm sm:text-base"
                >
                                  <option value="jobseeker">Candidate</option>
                <option value="employer">Employer</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 pointer-events-none">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className={`w-full py-3 sm:py-4 rounded-2xl font-semibold text-white transition-all duration-300 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#185a9d] to-[#43cea2] hover:from-[#43cea2] hover:to-[#185a9d]'}`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="font-semibold text-[#185a9d] hover:text-[#43cea2] transition-colors duration-300"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 
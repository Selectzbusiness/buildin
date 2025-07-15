import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { App as CapApp } from '@capacitor/app';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'jobseeker' as 'jobseeker' | 'employer',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);



  useEffect(() => {
    let removeListener: (() => void) | undefined;
    CapApp.addListener('backButton', () => {
      navigate(-1);
    }).then((listener) => {
      removeListener = listener.remove;
    });
    return () => {
      if (removeListener) removeListener();
    };
  }, [navigate]);

  useEffect(() => {
    // Check session with better error handling for mobile
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session check error:', error);
          return;
        }
        // Only redirect if a valid session and user exist
        if (data?.session && data.session.user) {
          // Check their role and redirect accordingly
          const { data: profileData } = await supabase
            .from('profiles')
            .select('roles')
            .eq('auth_id', data.session.user.id)
            .single();
          if (profileData?.roles?.includes('employer')) {
            // Check if they have company details
            const { data: companyData } = await supabase
              .from('companies')
              .select('*')
              .eq('auth_id', data.session.user.id)
              .maybeSingle();
            if (companyData) {
              navigate('/employer/dashboard');
            } else {
              navigate('/employer/company-details');
            }
          } else {
            navigate('/');
          }
        } else {
          // No valid session, do not redirect
          // Stay on login page
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };
    checkSession();
  }, [navigate]);

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
    
    // Check network connectivity
    if (!navigator.onLine) {
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

      // Immediate navigation without setTimeout to prevent race conditions
      if (formData.role === 'employer') {
        // Check if employer already has company details
        try {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('auth_id', loginData.user.id)
            .maybeSingle();

          if (companyError) {
            console.error('Error checking company profile:', companyError);
            // If error checking, redirect to company details form
            navigate('/employer/company-details');
            return;
          }

          if (companyData) {
            // Company profile exists, redirect to employer dashboard
            navigate('/employer/dashboard');
          } else {
            // No company profile, redirect to company details form
            navigate('/employer/company-details');
          }
        } catch (err) {
          console.error('Error checking company profile:', err);
          // If error, redirect to company details form
          navigate('/employer/company-details');
        }
      } else {
        // If jobseeker, always redirect to home page
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login. Please try again.');
      setLoading(false);
      console.error('Login error', err);
    } finally {
      setLoading(false);
      console.log('Login finished');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setError(error.message || 'Google sign-in failed');
        setGoogleLoading(false);
        return;
      }

      // The user will be redirected to Google OAuth
      // After successful authentication, they'll be redirected back
      console.log('Google OAuth initiated:', data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign-in');
      setGoogleLoading(false);
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
            Login to your account to continue
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

          {/* Google Sign-in Button */}
          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-2xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#185a9d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </div>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Login as</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  className={`flex-1 px-4 py-2 rounded-2xl border text-sm font-semibold transition-all duration-200 ${formData.role === 'jobseeker' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}
                  onClick={() => setFormData({ ...formData, role: 'jobseeker' })}
                  disabled={loading}
                >
                  Job Seeker
                </button>
                <button
                  type="button"
                  className={`flex-1 px-4 py-2 rounded-2xl border text-sm font-semibold transition-all duration-200 ${formData.role === 'employer' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}
                  onClick={() => setFormData({ ...formData, role: 'employer' })}
                  disabled={loading}
                >
                  Employer
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 sm:py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm sm:text-base font-semibold text-white bg-[#185a9d] hover:bg-[#134a82] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#185a9d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Login'
              )}
            </button>

            {/* Links */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/signup" className="font-semibold text-[#185a9d] hover:text-[#134a82] transition-colors duration-200">
                  Sign up
                </a>
              </p>
              <p className="text-sm text-gray-600">
                <a href="/forgot-password" className="font-semibold text-[#185a9d] hover:text-[#134a82] transition-colors duration-200">
                  Forgot your password?
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 
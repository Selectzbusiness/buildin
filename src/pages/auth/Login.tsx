import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AuthContext } from '../../contexts/AuthContext';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!formData.email || !formData.password) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      // Login with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error || !data.session) {
        setError('Invalid email or password.');
        setLoading(false);
        return;
      }

      // Wait for session to be set in localStorage
      await new Promise(resolve => setTimeout(resolve, 500));
      const session = await supabase.auth.getSession();
      console.log('Session after login (delayed):', session.data.session);

      // Fetch user profile from users table
      let { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // If profile does not exist, insert it
      if (!userProfile) {
        // Use the session to ensure the insert is authenticated
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || '',
            role: formData.role, // Single role field (required)
            roles: [formData.role], // Roles array field
            auth_id: data.user.id, // Set auth_id to match id
          }]);
        if (insertError) {
          setError('Failed to create user profile: ' + insertError.message);
          setLoading(false);
          return;
        }
        // Fetch again
        ({ data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single());
      }

      // Debug: log the fetched userProfile
      console.log('Fetched userProfile:', userProfile);

      // Ensure roles is an array
      let roles = userProfile?.roles || [];
      if (!Array.isArray(roles)) {
        // Handle legacy single role field
        roles = userProfile?.role ? [userProfile.role] : [formData.role];
      }
      
      // If user doesn't have the selected role, add it
      if (!roles.includes(formData.role)) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role: formData.role, // Update single role field
            roles: [...roles, formData.role] // Update roles array
          })
          .eq('id', data.user.id);
        
        if (updateError) {
          console.error('Error updating user roles:', updateError);
        } else {
          roles = [...roles, formData.role];
        }
      }

      if (roles.length === 0) {
        setError('No roles found for user. Please contact support.');
        setLoading(false);
        return;
      }

      setUser(data.user);
      setProfile(userProfile);
      setSuccess('Login successful! Redirecting...');
      setLoading(false);

      // Navigate based on the selected role - immediate redirect to fix mobile issue
      if (formData.role === 'employer') {
        // Check if user has company profile, if not redirect to company details
        navigate('/employer/company-details');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
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
              disabled={loading}
              className="w-full py-3 sm:py-4 px-6 bg-gradient-to-r from-[#185a9d] to-[#43cea2] text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                  Logging in...
                </div>
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
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
            roles: [formData.role], // Use the selected role as initial role
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
          .update({ roles: [...roles, formData.role] })
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

      setTimeout(() => {
        if (formData.role === 'employer') {
          // Check if user has company profile, if not redirect to company details
          navigate('/employer/company-details');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="font-medium text-black hover:text-gray-800"
            >
              Sign up
            </button>
          </p>
        </div>
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm">
            {success}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I want to access as *
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'jobseeker' | 'employer' })}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
              >
                <option value="jobseeker">Job Seeker</option>
                <option value="employer">Employer</option>
              </select>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 
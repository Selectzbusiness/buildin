import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash/fragment
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError('Authentication failed. Please try again.');
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('OAuth authentication successful:', session.user);
          
          // Check if user profile exists
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking profile:', profileError);
          }

          // If no profile exists, create one
          if (!profileData) {
            console.log('Creating new user profile for OAuth user...');
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([{
                auth_id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
                roles: ['jobseeker'], // Default role
              }]);

            if (insertError) {
              console.error('Error creating profile:', insertError);
              setError('Failed to create user profile. Please try again.');
              setLoading(false);
              return;
            }
          }

          // Refresh the auth context
          await refreshProfile(session);

          // Redirect based on user role
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('roles')
            .eq('auth_id', session.user.id)
            .single();

          if (userProfile?.roles?.includes('employer')) {
            // Check if they have company details
            const { data: companyData } = await supabase
              .from('companies')
              .select('*')
              .eq('auth_id', session.user.id)
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
          setError('No session found. Please try signing in again.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, refreshProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <svg className="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback; 
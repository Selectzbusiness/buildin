import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Handle Supabase session from URL for password reset
    const handleSessionFromUrl = async () => {
      if (supabase.auth.exchangeCodeForSession) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          setError('Invalid or expired reset link. Please request a new one.');
        }
      }
    };
    handleSessionFromUrl();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else setDone(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Set New Password</h2>
        {done ? (
          <div className="text-green-600 text-center">Password updated! You can now <a href="/auth/login" className="underline text-blue-600">login</a>.</div>
        ) : (
          <>
            <input
              type="password"
              className="w-full mb-3 px-4 py-2 border rounded-lg"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
            />
            {error && <div className="text-red-600 mb-2 text-center">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Set Password'}
            </button>
          </>
        )}
      </form>
    </div>
  );
} 
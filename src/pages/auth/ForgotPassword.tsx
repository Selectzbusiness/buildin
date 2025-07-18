import { useState } from 'react';
import { supabase } from '../../config/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.selectz.in/auth/reset-password'
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-auto p-10 flex flex-col items-center gap-8">
      {sent ? (
        <div className="text-green-600 text-center">Check your email for a password reset link.</div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          <input
            type="email"
            className="w-full px-4 py-3 border rounded-lg text-base"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          {error && <div className="text-red-600 text-center text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-blue-700 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </div>
  );
} 
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

const TABS = ['Account', 'Notifications', 'Team', 'Delete Account'];

const EmployerSettings: React.FC = () => {
  const { user, profile } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('Account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Account state
  const [fullName, setFullName] = useState('');
  const [twoFA, setTwoFA] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // Notification state
  const [notifications, setNotifications] = useState({
    notify_email: true,
    notify_sms: false,
    notify_inapp: true,
    job_alerts: true,
    application_updates: true,
    marketing: false,
  });

  // Team state
  const [admins, setAdmins] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (!user || !profile) return;
    setLoading(true);
    setFullName(profile.full_name || '');
    setTwoFA(!!profile.two_factor_enabled);
    fetchSettings();
    // eslint-disable-next-line
  }, [user, profile]);

  const fetchSettings = async () => {
    try {
      // Fetch notifications
      if (user?.id) {
        const { data: notif } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (notif) setNotifications(notif);
      }
      // Fetch team admins only if company_id exists
      if (profile?.company_id) {
        const { data: team } = await supabase
          .from('company_admins')
          .select('*, profiles(full_name, email)')
          .eq('company_id', profile.company_id);
        if (team) setAdmins(team);
      } else {
        setAdmins([]);
      }
    } catch (err) {
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  // Account
  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, two_factor_enabled: twoFA })
        .eq('id', profile.id);
      if (error) throw error;
      toast.success('Account updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (passwords.new !== passwords.confirm) {
        toast.error('Passwords do not match');
        setSaving(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      toast.success('Password updated!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  // Notifications
  const handleNotificationsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: user.id, ...notifications }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Notifications updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update notifications');
    } finally {
      setSaving(false);
    }
  };

  // Team
  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    setSaving(true);
    try {
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .single();
      if (!newProfile) {
        toast.error('User not found');
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from('company_admins')
        .insert({ company_id: profile.company_id, user_id: newProfile.id, role: 'admin' });
      if (error) throw error;
      toast.success('Admin invited!');
      setInviteEmail('');
      fetchSettings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite admin');
    } finally {
      setSaving(false);
    }
  };
  const handleRemoveAdmin = async (adminId: string) => {
    if (!profile?.company_id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_admins')
        .delete()
        .eq('id', adminId);
      if (error) throw error;
      toast.success('Admin removed!');
      fetchSettings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove admin');
    } finally {
      setSaving(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!profile) return;
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ deleted: true })
        .eq('id', profile.id);
      if (error) throw error;
      toast.success('Account deletion requested.');
      // Optionally redirect or log out
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-ocean-dark text-xl font-semibold">Loading settings...</div>;
  }
  if (!user || !profile) {
    return <div className="flex items-center justify-center min-h-[40vh] text-red-500 text-lg">User not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-ocean-light to-ocean-dark bg-clip-text text-transparent mb-2">Settings</h1>
        <p className="text-lg text-gray-600">Manage your account, notifications, and team preferences</p>
      </div>
      <div className="flex justify-center mb-8 gap-2">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`px-5 py-2 rounded-full font-semibold transition-all duration-200 shadow-sm border-2 ${activeTab === tab ? 'bg-gradient-to-r from-ocean-light to-ocean-dark text-white border-ocean-dark scale-105' : 'bg-white/70 text-ocean-dark border-ocean-light hover:bg-ocean-light/10'}`}
            onClick={() => setActiveTab(tab)}
            disabled={saving}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Account Tab */}
      {activeTab === 'Account' && (
        <div className="glass-card p-8 mb-8">
          <form onSubmit={handleAccountSave} className="space-y-6">
            <div>
              <label className="form-label">Full Name</label>
              <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} disabled={saving} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input className="input-field" value={user.email} disabled />
            </div>
            <div className="flex items-center space-x-2">
              <label className="form-label">Two-Factor Authentication</label>
              <input type="checkbox" checked={twoFA} onChange={e => setTwoFA(e.target.checked)} disabled={saving} />
            </div>
            <button className="btn-primary w-full" type="submit" disabled={saving}>Save</button>
          </form>
          <hr className="my-8" />
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <label className="form-label">Change Password</label>
            <input className="input-field" type="password" placeholder="Current password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} disabled={saving} />
            <input className="input-field" type="password" placeholder="New password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} disabled={saving} />
            <input className="input-field" type="password" placeholder="Confirm new password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} disabled={saving} />
            <button className="btn-primary w-full" type="submit" disabled={saving}>Change Password</button>
          </form>
        </div>
      )}
      {/* Notifications Tab */}
      {activeTab === 'Notifications' && (
        <form onSubmit={handleNotificationsSave} className="glass-card p-8 mb-8 space-y-6">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={notifications.notify_email} onChange={e => setNotifications(n => ({ ...n, notify_email: e.target.checked }))} disabled={saving} /> Email
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={notifications.notify_sms} onChange={e => setNotifications(n => ({ ...n, notify_sms: e.target.checked }))} disabled={saving} /> SMS
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={notifications.notify_inapp} onChange={e => setNotifications(n => ({ ...n, notify_inapp: e.target.checked }))} disabled={saving} /> In-App
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={notifications.job_alerts} onChange={e => setNotifications(n => ({ ...n, job_alerts: e.target.checked }))} disabled={saving} /> Job Alerts
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={notifications.application_updates} onChange={e => setNotifications(n => ({ ...n, application_updates: e.target.checked }))} disabled={saving} /> Application Updates
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={notifications.marketing} onChange={e => setNotifications(n => ({ ...n, marketing: e.target.checked }))} disabled={saving} /> Marketing
            </label>
          </div>
          <button className="btn-primary w-full" type="submit" disabled={saving}>Save</button>
        </form>
      )}
      {/* Team Tab */}
      {activeTab === 'Team' && (
        <div className="glass-card p-8 mb-8">
          <h2 className="text-xl font-bold mb-4 text-ocean-dark">Admins</h2>
          {profile.company_id ? (
            <>
              <ul className="divide-y divide-gray-200 mb-4">
                {admins.length === 0 && <li className="text-gray-500">No admins found.</li>}
                {admins.map(admin => (
                  <li key={admin.id} className="flex items-center justify-between py-2">
                    <span>{admin.profiles?.full_name || admin.profiles?.email}</span>
                    <button className="btn-secondary" onClick={() => handleRemoveAdmin(admin.id)} disabled={saving}>Remove</button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleInviteAdmin} className="flex space-x-2 mt-4">
                <input className="input-field" placeholder="Invite admin by email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} disabled={saving} />
                <button className="btn-primary" type="submit" disabled={saving}>Invite</button>
              </form>
            </>
          ) : (
            <div className="text-gray-500">No company assigned to your profile. Please contact support.</div>
          )}
        </div>
      )}
      {/* Delete Account Tab */}
      {activeTab === 'Delete Account' && (
        <div className="glass-card p-8 mb-8">
          <h2 className="text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="mb-4">Deleting your account is irreversible. All your data will be lost.</p>
          <button className="btn-primary bg-red-600 hover:bg-red-700 w-full" onClick={handleDeleteAccount} disabled={saving}>Delete Account</button>
        </div>
      )}
    </div>
  );
};

// Glassmorphism card utility
// Add this to your global CSS or Tailwind config if not present
// .glass-card { @apply bg-white/60 backdrop-blur-lg border border-white/30 shadow-xl rounded-2xl; }

export default EmployerSettings; 
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import useIsMobile from '../../hooks/useIsMobile';
import { FiUser, FiBell, FiUsers, FiTrash2, FiLock } from 'react-icons/fi';

const TABS = [
  { id: 'Account', label: 'Account', icon: FiUser },
  { id: 'Notifications', label: 'Notifications', icon: FiBell },
  { id: 'Team', label: 'Team', icon: FiUsers },
  { id: 'Delete Account', label: 'Delete Account', icon: FiTrash2 },
];

const EmployerSettings: React.FC = () => {
  const { user, profile } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('Account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Account state
  const [fullName, setFullName] = useState('');
  const [twoFA, setTwoFA] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Notification state
  const [notifications, setNotifications] = useState({
    notify_email: true,
    notify_sms: false,
    notify_inapp: true,
    job_alerts: true,
    application_updates: true,
    marketing: false,
    preferred_email: '', // Add preferredEmail to notifications state, defaulting to user.email
  });

  // Team state
  const [admins, setAdmins] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');

  const isMobile = useIsMobile();

  type TabId = 'Account' | 'Notifications' | 'Team' | 'Delete Account';
  const cardRefs: Record<TabId, React.RefObject<HTMLDivElement>> = {
    Account: useRef<HTMLDivElement>(null),
    Notifications: useRef<HTMLDivElement>(null),
    Team: useRef<HTMLDivElement>(null),
    'Delete Account': useRef<HTMLDivElement>(null),
  };

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    setTimeout(() => {
      cardRefs[tabId]?.current?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }, 50);
  };

  useEffect(() => {
    if (!user || !profile) return;
    setLoading(true);
    setFullName(profile.full_name || '');
    setTwoFA(!!profile.two_factor_enabled);
    setNewEmail(user?.email || '');
    setNewPhone(profile.phone || '');
    setNotifications(prev => ({ ...prev, preferred_email: user?.email || '' })); // Set preferredEmail to user.email if not set
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
      // Update full name and twoFA
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, two_factor_enabled: twoFA, phone: newPhone })
        .eq('id', profile.id);
      if (profileError) throw profileError;
      // Update email if changed
      if (user && newEmail && newEmail !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
        if (emailError) throw emailError;
        toast.success('Email updated! Please verify your new email.');
      }
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
      if (!passwords.current) {
        toast.error('Current password is required');
        setSaving(false);
        return;
      }
      if (passwords.new !== passwords.confirm) {
        toast.error('Passwords do not match');
        setSaving(false);
        return;
      }
      // Optionally, re-authenticate the user here if your backend requires it
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
        .upsert({ user_id: user.id, ...notifications, preferred_email: notifications.preferred_email }, { onConflict: 'user_id' });
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
    if (!window.confirm('Are you sure you want to remove this admin?')) return;
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
      toast.success('Account deletion requested. Logging out...');
      await supabase.auth.signOut();
      window.location.href = '/login';
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
      {/* Horizontally scrollable tab bar on mobile */}
      <div className="flex mb-8 gap-3 overflow-x-auto flex-nowrap w-full pl-4 pr-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`transition-all duration-200 px-6 py-2 rounded-full font-bold text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-50'
            }`}
            style={{ minWidth: 120 }}
            onClick={() => handleTabClick(tab.id as TabId)}
            disabled={saving}
          >
            <span className="flex items-center gap-2">
              <tab.icon className={activeTab === tab.id ? 'text-white' : 'text-blue-700'} />
              {tab.label}
            </span>
          </button>
        ))}
      </div>
      {/* Settings content area: only render the active tab's content, no horizontal scroll */}
      {activeTab === 'Account' && (
        <div className="w-full max-h-[60vh] overflow-y-auto sm:max-h-none sm:overflow-visible">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-100 text-blue-700 rounded-full p-3 text-2xl flex items-center justify-center">
                <FiUser />
              </span>
              <span className="text-black font-extrabold text-2xl">Account Details</span>
            </div>
            <form onSubmit={handleAccountSave} className="space-y-7">
              <div>
                <label htmlFor="fullName" className="block text-black font-semibold mb-1">Full Name</label>
                <input id="fullName" className="input-field text-black" value={fullName} onChange={e => setFullName(e.target.value)} disabled={saving} />
              </div>
              <div>
                <label htmlFor="currentEmail" className="block text-black font-semibold mb-1">Current Email</label>
                <input id="currentEmail" className="input-field text-gray-600" value={user.email} disabled />
              </div>
              <div>
                <label htmlFor="newEmail" className="block text-black font-semibold mb-1">New Email</label>
                <input id="newEmail" className="input-field text-black" value={newEmail} onChange={e => setNewEmail(e.target.value)} disabled={saving} />
              </div>
              <div>
                <label htmlFor="phone" className="block text-black font-semibold mb-1">Phone</label>
                <input id="phone" className="input-field text-black" value={profile.phone || ''} onChange={e => setNewPhone(e.target.value)} disabled={saving} />
              </div>
              <div className="flex items-center space-x-3 mt-2">
                <label htmlFor="twoFA" className="text-black font-semibold">Two-Factor Authentication</label>
                <input id="twoFA" type="checkbox" checked={twoFA} onChange={e => setTwoFA(e.target.checked)} disabled={saving} />
              </div>
              <button className="w-full rounded-full bg-blue-700 text-white font-bold text-lg py-3 mt-4 shadow-lg hover:bg-blue-800 transition" type="submit" disabled={saving}>Save Account</button>
            </form>
            <hr className="my-10" />
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-100 text-blue-700 rounded-full p-3 text-2xl flex items-center justify-center">
                <FiLock />
              </span>
              <span className="text-black font-extrabold text-2xl">Change Password</span>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-7">
              <div>
                <label htmlFor="currentPassword" className="block text-black font-semibold mb-1">Current Password</label>
                <input id="currentPassword" className="input-field text-black" type="password" placeholder="Current password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} disabled={saving} />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-black font-semibold mb-1">New Password</label>
                <input id="newPassword" className="input-field text-black" type="password" placeholder="New password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} disabled={saving} />
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="block text-black font-semibold mb-1">Confirm New Password</label>
                <input id="confirmNewPassword" className="input-field text-black" type="password" placeholder="Confirm new password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} disabled={saving} />
              </div>
              <button className="w-full rounded-full bg-blue-700 text-white font-bold text-lg py-3 mt-4 shadow-lg hover:bg-blue-800 transition" type="submit" disabled={saving}>Change Password</button>
            </form>
          </div>
      )}
      {activeTab === 'Notifications' && (
        <div className="w-full max-h-[60vh] overflow-y-auto sm:max-h-none sm:overflow-visible">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-blue-100 text-blue-700 rounded-full p-3 text-2xl flex items-center justify-center">
              <FiBell />
            </span>
            <span className="text-black font-extrabold text-2xl">Notification Preferences</span>
          </div>
          <form onSubmit={handleNotificationsSave} className="space-y-7">
            <div className="flex flex-wrap gap-6 mb-4">
              <label htmlFor="notifyEmail" className="flex items-center gap-2 text-black font-semibold">
                <input id="notifyEmail" type="checkbox" checked={notifications.notify_email} onChange={e => setNotifications(n => ({ ...n, notify_email: e.target.checked }))} disabled={saving} /> Email
              </label>
              <label htmlFor="notifySMS" className="flex items-center gap-2 text-black font-semibold">
                <input id="notifySMS" type="checkbox" checked={notifications.notify_sms} onChange={e => setNotifications(n => ({ ...n, notify_sms: e.target.checked }))} disabled={saving} /> SMS
              </label>
              <label htmlFor="notifyInApp" className="flex items-center gap-2 text-black font-semibold">
                <input id="notifyInApp" type="checkbox" checked={notifications.notify_inapp} onChange={e => setNotifications(n => ({ ...n, notify_inapp: e.target.checked }))} disabled={saving} /> In-App
              </label>
              <label htmlFor="jobAlerts" className="flex items-center gap-2 text-black font-semibold">
                <input id="jobAlerts" type="checkbox" checked={notifications.job_alerts} onChange={e => setNotifications(n => ({ ...n, job_alerts: e.target.checked }))} disabled={saving} /> Job Alerts
              </label>
              <label htmlFor="applicationUpdates" className="flex items-center gap-2 text-black font-semibold">
                <input id="applicationUpdates" type="checkbox" checked={notifications.application_updates} onChange={e => setNotifications(n => ({ ...n, application_updates: e.target.checked }))} disabled={saving} /> Application Updates
              </label>
              <label htmlFor="marketing" className="flex items-center gap-2 text-black font-semibold">
                <input id="marketing" type="checkbox" checked={notifications.marketing} onChange={e => setNotifications(n => ({ ...n, marketing: e.target.checked }))} disabled={saving} /> Marketing
              </label>
            </div>
            <div>
              <label htmlFor="preferredEmail" className="block text-black font-semibold mb-1">Preferred Notification Email</label>
              <input id="preferredEmail" className="input-field text-black" value={notifications.preferred_email} onChange={e => setNotifications(n => ({ ...n, preferred_email: e.target.value }))} disabled={saving} />
            </div>
            <button className="w-full rounded-full bg-blue-700 text-white font-bold text-lg py-3 mt-4 shadow-lg hover:bg-blue-800 transition" type="submit" disabled={saving}>Save Notifications</button>
          </form>
        </div>
      )}
      {activeTab === 'Team' && (
        <div className="w-full max-h-[60vh] overflow-y-auto sm:max-h-none sm:overflow-visible">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-blue-100 text-blue-700 rounded-full p-3 text-2xl flex items-center justify-center">
              <FiUsers />
            </span>
            <span className="text-black font-extrabold text-2xl">Team Admins</span>
          </div>
          {profile.company_id ? (
            <>
              <ul className="divide-y divide-gray-200 mb-6">
                {admins.length === 0 && <li className="text-gray-500 py-3">No admins found.</li>}
                {admins.map(admin => (
                  <li key={admin.id} className="flex items-center justify-between py-4">
                    <span className="text-black font-semibold text-lg">{admin.profiles?.full_name || admin.profiles?.email}</span>
                    <button className="rounded-full bg-gray-200 text-black font-bold px-5 py-2 shadow hover:bg-gray-300 transition" onClick={() => handleRemoveAdmin(admin.id)} disabled={saving}>Remove</button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleInviteAdmin} className="flex flex-col sm:flex-row gap-3 mt-4">
                <input className="input-field text-black rounded-full px-5 py-3" placeholder="Invite admin by email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} disabled={saving} />
                <button className="rounded-full bg-blue-700 text-white font-bold text-lg px-6 py-3 shadow-lg hover:bg-blue-800 transition w-full sm:w-auto" type="submit" disabled={saving}>Invite Admin</button>
              </form>
            </>
          ) : (
            <div className="text-gray-500">No company assigned to your profile. Please contact support.</div>
          )}
        </div>
      )}
      {activeTab === 'Delete Account' && (
        <div className="w-full max-h-[60vh] overflow-y-auto sm:max-h-none sm:overflow-visible">
          <h2 className="text-xl font-bold text-red-600 mb-2 flex items-center">
            <FiTrash2 className="mr-2 text-red-500" /> Danger Zone
          </h2>
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
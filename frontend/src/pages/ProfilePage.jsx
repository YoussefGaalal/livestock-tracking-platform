import React from 'react';
import { useState, useEffect } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import { setAuthUser } from '../utils/cookies';

export default function ProfilePage() {
  const { user } = useAuth();
  const { t, dir, setLanguage, language } = useI18n();
  const isRtl = dir === 'rtl';

  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
  });
  const [subscription, setSubscription] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const promises = [
        apiFetch(`/api/users/${user?.id}`),
        apiFetch('/api/subscription/current'),
        apiFetch('/api/devices'),
        apiFetch('/api/subscription/tiers'),
      ];

      const [profileRes, subscriptionRes, devicesRes, tiersRes] = await Promise.all(promises);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
        });
      }

      if (subscriptionRes.ok) {
        const subData = await subscriptionRes.json();
        setSubscription(subData.subscription || subData.data);
      }

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        const myDevices = (devicesData.data || []).filter(d => d.owner_id === user?.id);
        setDevices(myDevices);
      }

      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await apiFetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        }),
      });

if (res.ok) {
        setMsg({ ok: true, text: 'Profile updated successfully!' });
        const updatedUser = { ...user, name: profile.name, email: profile.email };
        setAuthUser(updatedUser);
      } else {
        const data = await res.json();
        setMsg({ ok: false, text: data.message || 'Failed to update profile' });
      }
    } catch (err) {
      setMsg({ ok: false, text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubscription = async (tierId) => {
    setSaving(true);
    setMsg(null);

    try {
      const res = await apiFetch(`/api/subscription/subscribe/${tierId}`, {
        method: 'POST',
      });

      if (res.ok) {
        setMsg({ ok: true, text: 'Subscription updated successfully!' });
        fetchProfile();
      } else {
        const data = await res.json();
        setMsg({ ok: false, text: data.message || 'Failed to update subscription' });
      }
    } catch (err) {
      setMsg({ ok: false, text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'subscription', label: t('subscription.title'), icon: 'workspace_premium' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <nav className="flex text-xs text-green-600 mb-2 uppercase tracking-widest font-bold">
          <span>{t('common.settings')}</span>
          <span className="mx-2">/</span>
          <span className="text-brand-primary">{t('nav.profile')}</span>
        </nav>
        <h2 className="text-3xl font-bold text-brand-primary">{t('profile.accountSettings')}</h2>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl ${msg.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-neutral-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-neutral-600 hover:text-brand-primary'
            }`}
          >
            <MaterialSymbol icon={tab.icon} size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-xl font-bold text-brand-primary mb-6 flex items-center gap-2">
              <MaterialSymbol icon="person" size={24} className="text-brand-secondary" />
              {t('profile.profileInfo')}
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">{t('users.name')}</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-neutral-100 border-none rounded-xl p-4 text-brand-primary focus:ring-2 focus:ring-brand-secondary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">{t('auth.email')}</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-neutral-100 border-none rounded-xl p-4 text-brand-primary focus:ring-2 focus:ring-brand-secondary/20"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">{t('users.phone')}</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-neutral-100 border-none rounded-xl p-4 text-brand-primary focus:ring-2 focus:ring-brand-secondary/20"
                    placeholder="+971 50 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">{t('users.role')}</label>
                  <input
                    type="text"
                    value={user?.role || 'Owner'}
                    className="w-full bg-neutral-100 border-none rounded-xl p-4 text-brand-primary/50"
                    disabled
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-secondary transition disabled:opacity-50">
                  {saving ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm">
              <h4 className="font-bold text-brand-primary mb-4">{t('profile.quickStats')}</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">{t('common.devices')}</span>
                  <span className="font-bold text-brand-primary">{devices.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">{t('common.subscription')}</span>
                  <span className="font-bold text-brand-accent">{subscription?.tier?.name || 'Free'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm">
              <h4 className="font-bold text-brand-primary mb-4">{t('profile.language')}</h4>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-neutral-100 border-none rounded-xl p-4 text-brand-primary"
              >
                <option value="en">English (US)</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-xl font-bold text-brand-primary mb-6 flex items-center gap-2">
            <MaterialSymbol icon="workspace_premium" size={24} className="text-brand-accent" />
            {t('subscription.title')}
          </h3>

          {/* Current Plan */}
          {subscription && subscription.status === 'active' && (
            <div className="mb-8 p-6 rounded-2xl border-2 border-brand-accent bg-brand-accent/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-brand-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                  Current Plan
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {subscription.status === 'active' ? 'Active' : subscription.status}
                </span>
              </div>
              <h4 className="text-2xl font-bold text-brand-primary">{subscription.tier?.name || 'Plan'}</h4>
              <p className="text-3xl font-black text-brand-primary mt-1">
                {subscription.tier?.price_monthly === '0.00' || subscription.tier?.price_monthly == 0 ? 'Free' : `$${subscription.tier?.price_monthly}`}
              </p>
              <p className="text-sm text-neutral-500 mt-1">{subscription.tier?.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                <li>• {subscription.tier?.max_animals === 0 ? 'Unlimited' : subscription.tier?.max_animals} animals included</li>
                <li>• {subscription.tier?.max_devices === 0 ? 'Unlimited' : subscription.tier?.max_devices} devices included</li>
                <li>• {subscription.tier?.max_users === 0 ? 'Unlimited' : subscription.tier?.max_users} users included</li>
              </ul>
            </div>
          )}

          <h4 className="text-lg font-bold text-brand-primary mb-4">Available Plans</h4>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => {
              const isCurrent = subscription?.tier_id === tier.id && subscription?.status === 'active';
              return (
                <div
                  key={tier.id}
                  className={`p-6 rounded-2xl border-2 ${isCurrent ? 'border-brand-accent bg-brand-accent/5' : 'border-transparent bg-neutral-100'}`}
                >
                  {isCurrent && (
                    <span className="inline-block bg-brand-accent text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                      Current
                    </span>
                  )}
                  <h4 className="text-xl font-bold text-brand-primary">{tier.name}</h4>
                  <p className="text-3xl font-black text-brand-primary mt-2">
                    {tier.price_monthly === '0.00' || tier.price_monthly == 0 ? 'Free' : `$${tier.price_monthly}`}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">{tier.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                    <li>{tier.max_animals === 0 ? 'Unlimited' : tier.max_animals} animals</li>
                    <li>{tier.max_devices === 0 ? 'Unlimited' : tier.max_devices} devices</li>
                    <li>{tier.max_users === 0 ? 'Unlimited' : tier.max_users} users</li>
                  </ul>
                  {!isCurrent && (
                    <button
                      onClick={() => handleSaveSubscription(tier.id)}
                      disabled={saving}
                      className="w-full mt-4 py-2 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary transition disabled:opacity-50"
                    >
                      Select Plan
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-xl font-bold text-brand-primary mb-6 flex items-center gap-2">
            <MaterialSymbol icon="notifications_active" size={24} className="text-brand-secondary" />
            Notification Preferences
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-neutral-100 rounded-xl cursor-pointer">
              <div className="flex gap-3 items-center">
                <MaterialSymbol icon="mail" size={20} className="text-brand-primary/60" />
                <div>
                  <p className="font-bold text-brand-primary">{t('profile.emailNotifications')}</p>
                  <p className="text-xs text-neutral-500">{t('profile.healthAlerts')}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={() => toggleNotification('email')}
                className="w-5 h-5 rounded-lg border-2 border-brand-accent text-brand-accent focus:ring-brand-accent cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-neutral-100 rounded-xl cursor-pointer">
              <div className="flex gap-3 items-center">
                <MaterialSymbol icon="sms" size={20} className="text-brand-primary/60" />
                <div>
                  <p className="font-bold text-brand-primary">{t('profile.smsUpdates')}</p>
                  <p className="text-xs text-neutral-500">{t('profile.urgentLocation')}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.sms}
                onChange={() => toggleNotification('sms')}
                className="w-5 h-5 rounded-lg border-2 border-brand-accent text-brand-accent focus:ring-brand-accent cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-neutral-100 rounded-xl cursor-pointer">
              <div className="flex gap-3 items-center">
                <MaterialSymbol icon="notifications" size={20} className="text-brand-primary/60" />
                <div>
                  <p className="font-bold text-brand-primary">{t('profile.pushNotifications')}</p>
                  <p className="text-xs text-neutral-500">{t('profile.platformActivities')}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={() => toggleNotification('push')}
                className="w-5 h-5 rounded-lg border-2 border-brand-accent text-brand-accent focus:ring-brand-accent cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}


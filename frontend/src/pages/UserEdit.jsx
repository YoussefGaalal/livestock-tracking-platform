import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Shepherd',
    is_active: true,
    subscription_tier_id: '',
    password: '',
    managed_by: '',
  });
  const [owners, setOwners] = useState([]);
const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);

  const loadOwners = async () => {
    try {
      const res = await apiFetch('/api/users?per_page=100');
      if (res.ok) {
        const data = await res.json();
        const users = data.data || data.value || data || [];
        const ownerUsers = users.filter(u => u.role === 'Owner');
        setOwners(ownerUsers);
      }
    } catch (err) {
      console.error('Failed to load owners:', err);
    }
  };

  useEffect(() => {
    fetchData();
    loadOwners();
  }, [id]);

const fetchData = async () => {
    try {
      const [userRes, tiersRes, rolesRes, availableRolesRes] = await Promise.all([
        apiFetch(`/api/users/${id}`),
        apiFetch('/api/subscription/tiers'),
        apiFetch(`/api/admin/users/${id}/roles`),
        apiFetch('/api/admin/roles'),
      ]);
      
      if (userRes.ok) {
        const user = await userRes.json();
        let userRole = 'Shepherd';
        
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          if (rolesData.roles && rolesData.roles.length > 0) {
            userRole = rolesData.roles[0];
          }
        }
        
        setForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: userRole,
          is_active: user.is_active !== false,
          subscription_tier_id: user.subscription_tier_id || '',
          password: '',
          managed_by: user.managed_by || '',
        });
      }
      
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData.data || []);
      }
      
      if (availableRolesRes.ok) {
        const availableRolesData = await availableRolesRes.json();
        setAvailableRoles(availableRolesData.roles || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const set = (field, value) => {
    const newForm = { ...form, [field]: value };
    if (field === 'role') {
      if (value === 'Manager' || value === 'Shepherd') {
        newForm.subscription_tier_id = '';
      }
    }
    setForm(newForm);
  };

  const canHaveSubscription = (role) => {
    return role === 'Owner' || role === 'Admin';
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const data = {
      name: form.name,
      email: form.email,
      role: form.role,
      is_active: form.is_active ? 1 : 0,
    };

    if (form.phone) data.phone = form.phone;
    if (form.password) data.password = form.password;
    if (form.managed_by) data.managed_by = parseInt(form.managed_by);
    if (canHaveSubscription(form.role) && form.subscription_tier_id) {
      data.subscription_tier_id = parseInt(form.subscription_tier_id);
    }

    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const response = await res.json();

      if (res.ok) {
        setMsg({ ok: true, text: 'User updated successfully!' });
        setTimeout(() => navigate('/users'), 1200);
      } else {
        setMsg({ ok: false, text: response.message || 'Failed to update user' });
      }
    } catch (err) {
      setMsg({ ok: false, text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="min-h-screen pb-24">
      <header className="bg-brand-light backdrop-blur-md sticky top-0 z-40 w-full px-8 py-5 flex justify-between items-center shadow-[0px_12px_32px_rgba(6,64,43,0.06)]">
        <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button type="button" onClick={() => navigate('/users')} className="p-3 hover:bg-neutral-100 rounded-xl transition">
            <MaterialSymbol icon={isRtl ? 'arrow_forward' : 'arrow_back'} className="text-brand-secondary" />
          </button>
          <h1 className="text-2xl font-bold text-brand-primary">{t('users.editUser')}</h1>
        </div>
        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full ${form.is_active ? 'bg-green-100' : 'bg-red-50'}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${form.is_active ? 'bg-brand-primary' : 'bg-danger'}`} />
          <span className={`text-sm font-semibold ${form.is_active ? 'text-brand-primary' : 'text-danger'}`}>
            {form.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="card p-8">
            <div className={`flex items-center gap-3 mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <MaterialSymbol icon="person" size={22} className="text-brand-accent" />
              </div>
              <h2 className="text-xl font-bold text-brand-primary">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('users.name')}</label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('users.email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('users.phone')}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  className="input-field"
                />
              </div>

<div>
                <label className={`block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('users.role')}</label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                    className="input-field appearance-none pr-12"
                  >
                    {availableRoles.length > 0 ? (
                      availableRoles.map(roleItem => (
                        <option key={roleItem.name || roleItem} value={roleItem.name || roleItem}>
                          {t(`users.${(roleItem.name || roleItem).toLowerCase()}`) || roleItem.name || roleItem}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Shepherd">{t('users.shepherd')}</option>
                        <option value="Manager">{t('users.manager')}</option>
                        <option value="Owner">{t('users.owner')}</option>
                        <option value="Admin">{t('users.admin')}</option>
                      </>
                    )}
                  </select>
                  <MaterialSymbol icon="expand_more" className={`absolute top-1/2 -translate-y-1/2 text-brand-primary/40 pointer-events-none ${isRtl ? 'left-4 right-auto' : 'right-4'}`} />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('users.managedBy') || 'Managed By'}</label>
                <div className="relative">
                  <select
                    value={form.managed_by}
                    onChange={e => set('managed_by', e.target.value)}
                    className="input-field appearance-none pr-12"
                  >
                    <option value="">{t('common.none') || 'None'}</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
                    ))}
                  </select>
                  <MaterialSymbol icon="expand_more" className={`absolute top-1/2 -translate-y-1/2 text-brand-primary/40 pointer-events-none ${isRtl ? 'left-4 right-auto' : 'right-4'}`} />
                </div>
              </div>
            </div>
          </section>
          
          {canHaveSubscription(form.role) && (
            <section className="card p-8">
              <div className={`flex items-center gap-3 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-accent to-yellow-800 flex items-center justify-center">
                  <MaterialSymbol icon="workspace_premium" size={22} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-brand-primary">{t('subscription.title')}</h2>
              </div>

              <div>
                <label className={`block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('subscription.currentPlan')}</label>
                <div className="relative">
                  <select
                    value={form.subscription_tier_id}
                    onChange={e => set('subscription_tier_id', e.target.value)}
                    className="input-field appearance-none pr-12"
                  >
                    <option value="">-- Select Tier --</option>
                    {tiers.map(tier => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name} - {tier.price_monthly === '0.00' ? 'Free' : `$${tier.price_monthly}/mo`}
                      </option>
                    ))}
                  </select>
                  <MaterialSymbol icon="expand_more" className={`absolute top-1/2 -translate-y-1/2 text-brand-primary/40 pointer-events-none ${isRtl ? 'left-4 right-auto' : 'right-4'}`} />
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="card p-8">
            <div className={`flex items-center gap-3 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <MaterialSymbol icon="settings_account_box" size={22} className="text-brand-accent" />
              </div>
              <h2 className="text-xl font-bold text-brand-primary">Account Status</h2>
            </div>

            <div className={`flex items-center justify-between p-4 bg-neutral-100 rounded-2xl mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="font-bold text-brand-primary">User Active</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => set('is_active', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-accent"></div>
              </label>
            </div>

            <div>
              <label className={`block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>New Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className="input-field"
                placeholder="Leave blank to keep current"
              />
            </div>
          </section>

          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-6 rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-brand-accent font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Changes to user roles affect global access immediately.
              </p>
            </div>
            <MaterialSymbol icon="support_agent" className="absolute -bottom-4 text-white/5 text-9xl" />
          </div>
        </div>
      </div>

      {msg && (
        <div className={`mx-8 p-4 rounded-xl mb-4 ${msg.ok ? 'bg-green-100 text-brand-primary' : 'bg-red-50 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      <div className={`fixed bottom-0 bg-white/80 backdrop-blur-xl border-t border-neutral-200 px-8 py-5 flex justify-between items-center z-40 ${isRtl ? 'left-0 right-0 lg:left-72' : 'left-0 right-0 lg:right-72'}`}>
        <div className={`hidden sm:flex items-center gap-2 text-neutral-600 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
          <MaterialSymbol icon="info" size={18} />
          Last modified 2 hours ago
        </div>

        <div className={`flex items-center gap-4 w-full sm:w-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold text-brand-primary hover:bg-neutral-100 transition"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:flex-none btn-primary"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </form>
  );
}


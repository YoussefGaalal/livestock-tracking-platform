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
  });
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [userRes, tiersRes] = await Promise.all([
        apiFetch(`/api/users/${id}`),
        apiFetch('/api/subscription/tiers'),
      ]);
      
      if (userRes.ok) {
        const user = await userRes.json();
        setForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'Shepherd',
          is_active: user.is_active !== false,
          subscription_tier_id: user.subscription_tier_id || '',
          password: '',
        });
      }
      
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData.data || []);
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
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="min-h-screen pb-24">
      <header className="bg-[#FAF1F5] backdrop-blur-md sticky top-0 z-40 w-full px-8 py-5 flex justify-between items-center shadow-[0px_12px_32px_rgba(6,64,43,0.06)]">
        <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button type="button" onClick={() => navigate('/users')} className="p-3 hover:bg-[#F4F4EF] rounded-xl transition">
            <MaterialSymbol icon={isRtl ? 'arrow_forward' : 'arrow_back'} className="text-[#06402B]" />
          </button>
          <h1 className="text-2xl font-bold text-[#002819]">{t('users.editUser')}</h1>
        </div>
        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full ${form.is_active ? 'bg-[#cfe5d6]' : 'bg-[#ffdad6]'}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${form.is_active ? 'bg-[#002819]' : 'bg-[#BA1A1A]'}`} />
          <span className={`text-sm font-semibold ${form.is_active ? 'text-[#002819]' : 'text-[#BA1A1A]'}`}>
            {form.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="card p-8">
            <div className={`flex items-center gap-3 mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#002819] to-[#06402B] flex items-center justify-center">
                <MaterialSymbol icon="person" size={22} className="text-[#D4AF37]" />
              </div>
              <h2 className="text-xl font-bold text-[#002819]">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('users.name')}</label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('users.email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('users.phone')}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('users.role')}</label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                    className="input-field appearance-none pr-12"
                  >
                    <option value="Shepherd">{t('users.shepherd')}</option>
                    <option value="Manager">{t('users.manager')}</option>
                    <option value="Owner">{t('users.owner')}</option>
                    <option value="Admin">{t('users.admin')}</option>
                  </select>
                  <MaterialSymbol icon="expand_more" className={`absolute top-1/2 -translate-y-1/2 text-[#002819]/40 pointer-events-none ${isRtl ? 'left-4 right-auto' : 'right-4'}`} />
                </div>
              </div>
            </div>
          </section>

          {canHaveSubscription(form.role) && (
            <section className="card p-8">
              <div className={`flex items-center gap-3 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#735C00] flex items-center justify-center">
                  <MaterialSymbol icon="workspace_premium" size={22} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#002819]">{t('subscription.title')}</h2>
              </div>

              <div>
                <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>{t('subscription.currentPlan')}</label>
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
                  <MaterialSymbol icon="expand_more" className={`absolute top-1/2 -translate-y-1/2 text-[#002819]/40 pointer-events-none ${isRtl ? 'left-4 right-auto' : 'right-4'}`} />
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="card p-8">
            <div className={`flex items-center gap-3 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#002819] to-[#06402B] flex items-center justify-center">
                <MaterialSymbol icon="settings_account_box" size={22} className="text-[#D4AF37]" />
              </div>
              <h2 className="text-xl font-bold text-[#002819]">Account Status</h2>
            </div>

            <div className={`flex items-center justify-between p-4 bg-[#F4F4EF] rounded-2xl mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="font-bold text-[#002819]">User Active</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => set('is_active', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-[#E3E3DE] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#D4AF37]"></div>
              </label>
            </div>

            <div>
              <label className={`block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ${isRtl ? 'text-right' : ''}`}>New Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className="input-field"
                placeholder="Leave blank to keep current"
              />
            </div>
          </section>

          <div className="bg-gradient-to-br from-[#002819] to-[#06402B] p-6 rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-[#D4AF37] font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Changes to user roles affect global access immediately.
              </p>
            </div>
            <MaterialSymbol icon="support_agent" className="absolute -bottom-4 text-white/5 text-9xl" />
          </div>
        </div>
      </div>

      {msg && (
        <div className={`mx-8 p-4 rounded-xl mb-4 ${msg.ok ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
          {msg.text}
        </div>
      )}

      <div className={`fixed bottom-0 bg-white/80 backdrop-blur-xl border-t border-[#E3E3DE] px-8 py-5 flex justify-between items-center z-40 ${isRtl ? 'left-0 right-0 lg:left-72' : 'left-0 right-0 lg:right-72'}`}>
        <div className={`hidden sm:flex items-center gap-2 text-[#404943] text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
          <MaterialSymbol icon="info" size={18} />
          Last modified 2 hours ago
        </div>

        <div className={`flex items-center gap-4 w-full sm:w-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold text-[#002819] hover:bg-[#F4F4EF] transition"
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

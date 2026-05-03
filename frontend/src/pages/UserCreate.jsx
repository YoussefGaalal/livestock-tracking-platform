import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function UserCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === 'Admin';
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Shepherd',
    password: '',
    managed_by: '',
  });
  const [owners, setOwners] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await apiFetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        const roles = data.roles || [];
        setAvailableRoles(roles.map(r => r.name));
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const loadOwners = async () => {
    if (!isAdmin) return;
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
    loadOwners();
  }, [isAdmin]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setMsg({ ok: true, text: t('users.userCreated') });
        setTimeout(() => navigate('/users'), 1200);
      } else {
        let errorText = data.message || t('users.userCreateFailed');
        if (data.errors) {
          const errors = Object.values(data.errors).flat();
          errorText = errors.join(' ');
        }
        setMsg({ ok: false, text: errorText });
      }
    } catch (err) {
      setMsg({ ok: false, text: t('errors.networkError') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/users')} className="p-2 hover:bg-gray-100 rounded-full transition">
          <MaterialSymbol icon="arrow_back" className="text-brand-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">{t('users.addUser')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('users.createTeamMember')}</p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-brand-accent/20 rounded-xl">
            <MaterialSymbol icon="person_add" size={24} className="text-yellow-800" />
          </div>
          <div>
            <h2 className="font-bold text-brand-primary">{t('users.userDetails')}</h2>
            <p className="text-sm text-neutral-500">{t('users.enterUserInfo')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ml-1">{t('users.name')}</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full bg-neutral-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-secondary/20 focus:bg-white transition outline-none"
              placeholder="Ahmed Al-Khalidi"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ml-1">{t('auth.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="w-full bg-neutral-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-secondary/20 focus:bg-white transition outline-none"
              placeholder="ahmed@oasis.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ml-1">{t('users.phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full bg-neutral-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-secondary/20 focus:bg-white transition outline-none"
              placeholder="+971 50 123 4567"
            />
          </div>

<div>
            <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ml-1">{t('users.role')}</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={e => set('role', e.target.value)}
                className="w-full appearance-none bg-neutral-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-secondary/20 transition outline-none pr-10"
              >
                {availableRoles.length > 0 ? (
                  availableRoles.map(roleName => (
                    <option key={roleName} value={roleName}>{t(`users.${roleName.toLowerCase()}`) || roleName}</option>
                  ))
                ) : (
                  <>
                    {isAdmin && <option value="Admin">{t('users.admin')}</option>}
                    <option value="Owner">{t('users.owner')}</option>
                    <option value="Manager">{t('users.manager')}</option>
                    <option value="Shepherd">{t('users.shepherd')}</option>
                  </>
                )}
              </select>
              <MaterialSymbol icon="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary/40 pointer-events-none" />
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ml-1">{t('users.managedBy') || 'Managed By'}</label>
              <div className="relative">
                <select
                  value={form.managed_by}
                  onChange={e => set('managed_by', e.target.value)}
                  className="w-full appearance-none bg-neutral-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-secondary/20 transition outline-none pr-10"
                >
                  <option value="">{t('common.none') || 'None'}</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
                  ))}
                </select>
                <MaterialSymbol icon="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary/40 pointer-events-none" />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2 ml-1">{t('auth.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              className="w-full bg-neutral-100 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-secondary/20 focus:bg-white transition outline-none"
              placeholder="Min 8 characters"
            />
          </div>
        </div>

        {msg && (
          <div className={`p-4 rounded-xl ${msg.ok ? 'bg-green-100 text-brand-primary' : 'bg-red-50 text-red-800'}`}>
            {msg.text}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="flex-1 py-4 bg-neutral-100 text-brand-primary rounded-xl font-bold hover:bg-gray-200 transition"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-4 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 transition disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('users.createUser')}
          </button>
        </div>
      </form>
    </div>
  );
}


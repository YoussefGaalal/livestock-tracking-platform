import { useState } from 'react';
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
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

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
        setMsg({ ok: false, text: data.message || t('users.userCreateFailed') });
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
          <MaterialSymbol icon="arrow_back" className="text-[#06402B]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#002819]">{t('users.addUser')}</h1>
          <p className="text-sm text-[#717973] mt-1">{t('users.createTeamMember')}</p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[#D4AF37]/20 rounded-xl">
            <MaterialSymbol icon="person_add" size={24} className="text-[#735c00]" />
          </div>
          <div>
            <h2 className="font-bold text-[#002819]">{t('users.userDetails')}</h2>
            <p className="text-sm text-[#717973]">{t('users.enterUserInfo')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ml-1">{t('users.name')}</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full bg-[#e8e8e3] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#06402B]/20 focus:bg-white transition outline-none"
              placeholder="Ahmed Al-Khalidi"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ml-1">{t('auth.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="w-full bg-[#e8e8e3] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#06402B]/20 focus:bg-white transition outline-none"
              placeholder="ahmed@oasis.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ml-1">{t('users.phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full bg-[#e8e8e3] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#06402B]/20 focus:bg-white transition outline-none"
              placeholder="+971 50 123 4567"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ml-1">{t('users.role')}</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={e => set('role', e.target.value)}
                className="w-full appearance-none bg-[#e8e8e3] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#06402B]/20 transition outline-none pr-10"
              >
                {isAdmin && <option value="Admin">{t('users.admin')}</option>}
                <option value="Owner">{t('users.owner')}</option>
                <option value="Manager">{t('users.manager')}</option>
                <option value="Shepherd">{t('users.shepherd')}</option>
              </select>
              <MaterialSymbol icon="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#002819]/40 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 ml-1">{t('auth.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              className="w-full bg-[#e8e8e3] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#06402B]/20 focus:bg-white transition outline-none"
              placeholder="Min 8 characters"
            />
          </div>
        </div>

        {msg && (
          <div className={`p-4 rounded-xl ${msg.ok ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
            {msg.text}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="flex-1 py-4 bg-[#e8e8e3] text-[#002819] rounded-xl font-bold hover:bg-gray-200 transition"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-4 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] shadow-lg shadow-[#002819]/20 transition disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('users.createUser')}
          </button>
        </div>
      </form>
    </div>
  );
}

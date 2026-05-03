import { useState, useEffect } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { exportDatabase } from '../utils/export';
import { useI18n } from '../i18n';
import { usePlatform } from '../context/PlatformContext';

export default function SettingsPage() {
  const { t, dir } = useI18n();
  const { refreshPlatformName } = usePlatform();
  const isRtl = dir === 'rtl';
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [exportingDb, setExportingDb] = useState(false);
  const [message, setMessage] = useState(null);

  const [generalSettings, setGeneralSettings] = useState({
    platform_name: 'The Oasis',
    platform_url: 'http://localhost:5173',
    admin_email: '',
    timezone: 'Asia/Dubai',
    date_format: 'Y-m-d',
    default_language: 'en',
  });

  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: '',
    username: '',
    password: '',
    encryption: 'tls',
    from_email: '',
    from_name: '',
  });

  const [stripeSettings, setStripeSettings] = useState({
    public_key: '',
    secret_key: '',
    webhook_secret: '',
    enabled: false,
  });

  const [geminiSettings, setGeminiSettings] = useState({
    api_key: '',
    model: 'gemini-2.0-flash',
    enabled: false,
  });

  const [whatsappSettings, setWhatsappSettings] = useState({
    api_url: '',
    api_token: '',
    phone_number_id: '',
    business_account_id: '',
    enabled: false,
  });

  const [twilioSettings, setTwilioSettings] = useState({
    account_sid: '',
    auth_token: '',
    phone_number: '',
    enabled: false,
  });

  const [speciesList, setSpeciesList] = useState([]);
  const [editingSpecies, setEditingSpecies] = useState(null);
  const [editingBreed, setEditingBreed] = useState(null);
  const [newSpeciesName, setNewSpeciesName] = useState('');
  const [newBreedName, setNewBreedName] = useState('');
  const [selectedSpeciesForBreed, setSelectedSpeciesForBreed] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('oasis_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userRole = user?.role;

      const [generalRes, smtpRes, stripeRes, geminiRes, whatsappRes, twilioRes, speciesRes] = await Promise.all([
        apiFetch('/api/admin/settings/general'),
        apiFetch('/api/admin/settings/smtp'),
        apiFetch('/api/admin/settings/stripe'),
        apiFetch('/api/admin/settings/gemini'),
        apiFetch('/api/admin/settings/whatsapp'),
        apiFetch('/api/admin/settings/twilio'),
        userRole === 'Admin' ? apiFetch('/api/species') : Promise.resolve({ ok: false }),
      ]);

      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        setSpeciesList(speciesData.data || []);
      }

      if (generalRes.ok) {
        const data = await generalRes.json();
        setGeneralSettings(data.data);
      }
      if (smtpRes.ok) {
        const data = await smtpRes.json();
        setSmtpSettings(data.data);
      }
      if (stripeRes.ok) {
        const data = await stripeRes.json();
        setStripeSettings(data.data);
      }
      if (geminiRes.ok) {
        const data = await geminiRes.json();
        setGeminiSettings(data.data);
      }
      if (whatsappRes.ok) {
        const data = await whatsappRes.json();
        setWhatsappSettings(data.data);
      }
      if (twilioRes.ok) {
        const data = await twilioRes.json();
        setTwilioSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/admin/settings/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generalSettings),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: t('settings.saved') });
        refreshPlatformName();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/admin/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpSettings),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: t('settings.saved') });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/admin/settings/smtp/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveStripe = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/admin/settings/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripeSettings),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: t('settings.saved') });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGemini = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/admin/settings/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiSettings),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: t('settings.saved') });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/admin/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsappSettings),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: t('settings.saved') });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTwilio = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/admin/settings/twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(twilioSettings),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: t('settings.saved') });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: t('settings.general'), icon: 'settings' },
    { id: 'species', label: 'Species', icon: 'pets' },
    { id: 'smtp', label: t('settings.smtp'), icon: 'mail' },
    { id: 'stripe', label: t('settings.stripe'), icon: 'credit_card' },
    { id: 'gemini', label: t('settings.gemini'), icon: 'psychology' },
    { id: 'whatsapp', label: t('settings.whatsapp'), icon: 'chat' },
    { id: 'twilio', label: t('settings.twilio'), icon: 'sms' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <nav className={`flex text-xs text-[#4f6357] mb-2 uppercase tracking-widest font-bold ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span>{t('common.settings')}</span>
          <span className="mx-2">/</span>
          <span className="text-[#002819]">{t('settings.title')}</span>
        </nav>
        <h2 className="text-3xl font-bold text-[#002819]">{t('settings.title')}</h2>
        <p className="text-[#404943] mt-1">{t('settings.subtitle')}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2 bg-[#F4F4EF] p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-[#002819] shadow-sm'
                : 'text-[#404943] hover:text-[#002819]'
            }`}
          >
            <MaterialSymbol icon={tab.icon} size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#002819] rounded-xl flex items-center justify-center">
              <MaterialSymbol icon="settings" size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#002819]">{t('settings.generalSettings')}</h3>
              <p className="text-sm text-[#717973]">{t('settings.generalDescription')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.platformName')}</label>
              <input
                type="text"
                value={generalSettings.platform_name}
                onChange={(e) => setGeneralSettings({ ...generalSettings, platform_name: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="The Oasis"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.platformUrl')}</label>
              <input
                type="url"
                value={generalSettings.platform_url}
                onChange={(e) => setGeneralSettings({ ...generalSettings, platform_url: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="https://oasis.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.adminEmail')}</label>
              <input
                type="email"
                value={generalSettings.admin_email}
                onChange={(e) => setGeneralSettings({ ...generalSettings, admin_email: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="admin@oasis.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.timezone')}</label>
              <select
                value={generalSettings.timezone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
              >
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (AST)</option>
                <option value="Asia/Kuwait">Asia/Kuwait (AST)</option>
                <option value="Asia/Qatar">Asia/Qatar (AST)</option>
                <option value="Asia/Bahrain">Asia/Bahrain (AST)</option>
                <option value="Asia/Amman">Asia/Amman (AST)</option>
                <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.dateFormat')}</label>
              <select
                value={generalSettings.date_format}
                onChange={(e) => setGeneralSettings({ ...generalSettings, date_format: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
              >
                <option value="Y-m-d">2024-01-15</option>
                <option value="d/m/Y">15/01/2024</option>
                <option value="m/d/Y">01/15/2024</option>
                <option value="d-m-Y">15-01-2024</option>
                <option value="d.M.Y">15.Jan.2024</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.defaultLanguage')}</label>
              <select
                value={generalSettings.default_language}
                onChange={(e) => setGeneralSettings({ ...generalSettings, default_language: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
              >
                <option value="en">English</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="w-full py-3 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] transition disabled:opacity-50"
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#F4F4EF]">
            <button
              onClick={async () => {
                setExportingDb(true);
                const success = await exportDatabase();
                if (success) {
                  setMessage({ type: 'success', text: t('common.exported') });
                } else {
                  setMessage({ type: 'error', text: t('common.exportFailed') });
                }
                setTimeout(() => setMessage(null), 3000);
                setExportingDb(false);
              }}
              disabled={exportingDb}
              className="w-full py-3 bg-[#D4AF37] text-white rounded-xl font-bold hover:bg-[#c9a030] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <MaterialSymbol icon="backup" size={20} />
              {exportingDb ? t('common.exporting') : t('settings.exportDatabase')}
            </button>
          </div>
        </div>
      )}

      {/* Species Tab */}
      {activeTab === 'species' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#002819] rounded-xl flex items-center justify-center">
              <MaterialSymbol icon="pets" size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#002819]">Species & Breeds</h3>
              <p className="text-sm text-[#717973]">Manage animal species and their breeds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-[#002819] mb-4">Add New Species</h4>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSpeciesName}
                  onChange={(e) => setNewSpeciesName(e.target.value)}
                  placeholder="Species name"
                  className="flex-1 bg-[#f4f4ef] border-none rounded-xl px-4 py-3 text-[#002819] font-semibold"
                />
                <button
                  onClick={async () => {
                    if (!newSpeciesName.trim()) return;
                    const res = await apiFetch('/api/species', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: newSpeciesName }),
                    });
                    if (res.ok) {
                      setNewSpeciesName('');
                      const res = await apiFetch('/api/species');
                      if (res.ok) {
                        const data = await res.json();
                        setSpeciesList(data.data);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-[#002819] text-white rounded-xl font-bold"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {speciesList.map((species) => (
                  <div key={species.id} className="p-4 bg-[#f4f4ef] rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#002819]">{species.name}</span>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this species?')) {
                            await apiFetch(`/api/species/${species.id}`, { method: 'DELETE' });
                            const res = await apiFetch('/api/species');
                            if (res.ok) {
                              const data = await res.json();
                              setSpeciesList(data.data);
                            }
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <MaterialSymbol icon="delete" size={20} />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {species.breeds?.map((breed) => (
                        <span key={breed.id} className="px-2 py-1 bg-white rounded-lg text-xs font-medium flex items-center gap-1">
                          {breed.name}
                          <button
                            onClick={async () => {
                              await apiFetch(`/api/breeds/${breed.id}`, { method: 'DELETE' });
                              const res = await apiFetch('/api/species');
                              if (res.ok) {
                                const data = await res.json();
                                setSpeciesList(data.data);
                              }
                            }}
                            className="text-red-400 hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Add breed..."
                        className="flex-1 bg-white border-none rounded-lg px-3 py-2 text-sm"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            await apiFetch(`/api/species/${species.id}/breeds`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: e.target.value }),
                            });
                            e.target.value = '';
                            const res = await apiFetch('/api/species');
                            if (res.ok) {
                              const data = await res.json();
                              setSpeciesList(data.data);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Tab */}
      {activeTab === 'smtp' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#002819] rounded-xl flex items-center justify-center">
              <MaterialSymbol icon="mail" size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#002819]">{t('settings.smtpSettings')}</h3>
              <p className="text-sm text-[#717973]">{t('settings.smtpDescription')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.smtpHost')}</label>
              <input
                type="text"
                value={smtpSettings.host}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.port')}</label>
              <input
                type="text"
                value={smtpSettings.port}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="587"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.username')}</label>
              <input
                type="text"
                value={smtpSettings.username}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, username: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('auth.password')}</label>
              <input
                type="password"
                value={smtpSettings.password}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="App password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.encryption')}</label>
              <select
                value={smtpSettings.encryption}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, encryption: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.fromEmail')}</label>
              <input
                type="email"
                value={smtpSettings.from_email}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, from_email: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="noreply@oasis.com"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.fromName')}</label>
              <input
                type="text"
                value={smtpSettings.from_name}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, from_name: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="The Oasis"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSaveSmtp}
              disabled={saving}
              className="flex-1 py-3 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] transition disabled:opacity-50"
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
            <button
              onClick={handleTestSmtp}
              disabled={testing}
              className="px-6 py-3 bg-[#D4AF37] text-white rounded-xl font-bold hover:bg-[#c9a030] transition disabled:opacity-50"
            >
              {testing ? t('common.loading') : t('settings.sendTest')}
            </button>
          </div>
        </div>
      )}

      {/* Stripe Tab */}
      {activeTab === 'stripe' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center">
              <MaterialSymbol icon="credit_card" size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#002819]">{t('settings.stripeSettings')}</h3>
              <p className="text-sm text-[#717973]">{t('settings.stripeDescription')}</p>
            </div>
          </div>

          <label className="flex items-center gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={stripeSettings.enabled}
              onChange={(e) => setStripeSettings({ ...stripeSettings, enabled: e.target.checked })}
              className="w-5 h-5 rounded-lg border-2 border-[#D4AF37] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
            />
            <span className="font-bold text-[#002819]">{t('settings.enableStripe')}</span>
          </label>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.publicKey')}</label>
              <input
                type="text"
                value={stripeSettings.public_key}
                onChange={(e) => setStripeSettings({ ...stripeSettings, public_key: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="pk_live_..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.secretKey')}</label>
              <input
                type="password"
                value={stripeSettings.secret_key}
                onChange={(e) => setStripeSettings({ ...stripeSettings, secret_key: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="sk_live_..."
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.webhookSecret')}</label>
              <input
                type="text"
                value={stripeSettings.webhook_secret}
                onChange={(e) => setStripeSettings({ ...stripeSettings, webhook_secret: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="whsec_..."
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveStripe}
              disabled={saving}
              className="w-full py-3 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] transition disabled:opacity-50"
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Gemini Tab */}
      {activeTab === 'gemini' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#002819] to-[#06402B] rounded-xl flex items-center justify-center">
              <MaterialSymbol icon="psychology" size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#002819]">{t('settings.geminiSettings')}</h3>
              <p className="text-sm text-[#717973]">{t('settings.geminiDescription')}</p>
            </div>
          </div>

          <label className="flex items-center gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={geminiSettings.enabled}
              onChange={(e) => setGeminiSettings({ ...geminiSettings, enabled: e.target.checked })}
              className="w-5 h-5 rounded-lg border-2 border-[#D4AF37] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
            />
            <span className="font-bold text-[#002819]">{t('settings.enableGemini')}</span>
          </label>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.geminiApiKey')}</label>
              <input
                type="password"
                value={geminiSettings.api_key}
                onChange={(e) => setGeminiSettings({ ...geminiSettings, api_key: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="AI..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.geminiModel')}</label>
              <select
                value={geminiSettings.model}
                onChange={(e) => setGeminiSettings({ ...geminiSettings, model: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
              >
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveGemini}
              disabled={saving}
              className="w-full py-3 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] transition disabled:opacity-50"
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Tab */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#25D366] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.296-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#002819]">{t('settings.whatsappSettings')}</h3>
              <p className="text-sm text-[#717973]">{t('settings.whatsappDescription')}</p>
            </div>
          </div>

          <label className="flex items-center gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappSettings.enabled}
              onChange={(e) => setWhatsappSettings({ ...whatsappSettings, enabled: e.target.checked })}
              className="w-5 h-5 rounded-lg border-2 border-[#D4AF37] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
            />
            <span className="font-bold text-[#002819]">{t('settings.enableWhatsapp')}</span>
          </label>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.whatsappApiUrl')}</label>
              <input
                type="text"
                value={whatsappSettings.api_url}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, api_url: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="https://graph.facebook.com/v18.0"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.whatsappApiToken')}</label>
              <input
                type="password"
                value={whatsappSettings.api_token}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, api_token: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="EAAxxxx..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.whatsappPhoneId')}</label>
              <input
                type="text"
                value={whatsappSettings.phone_number_id}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, phone_number_id: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="Phone Number ID"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.whatsappBusinessId')}</label>
              <input
                type="text"
                value={whatsappSettings.business_account_id}
                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, business_account_id: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="Business Account ID"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveWhatsApp}
              disabled={saving}
              className="w-full py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#1da851] transition disabled:opacity-50"
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Twilio Tab */}
      {activeTab === 'twilio' && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#F22F46] rounded-xl flex items-center justify-center">
              <MaterialSymbol icon="sms" size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#002819]">{t('settings.twilioSettings')}</h3>
              <p className="text-sm text-[#717973]">{t('settings.twilioDescription')}</p>
            </div>
          </div>

          <label className="flex items-center gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={twilioSettings.enabled}
              onChange={(e) => setTwilioSettings({ ...twilioSettings, enabled: e.target.checked })}
              className="w-5 h-5 rounded-lg border-2 border-[#D4AF37] text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
            />
            <span className="font-bold text-[#002819]">{t('settings.enableTwilio')}</span>
          </label>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.twilioAccountSid')}</label>
              <input
                type="text"
                value={twilioSettings.account_sid}
                onChange={(e) => setTwilioSettings({ ...twilioSettings, account_sid: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="ACxxxxxxxx..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.twilioAuthToken')}</label>
              <input
                type="password"
                value={twilioSettings.auth_token}
                onChange={(e) => setTwilioSettings({ ...twilioSettings, auth_token: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="Auth Token"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.twilioPhoneNumber')}</label>
              <input
                type="text"
                value={twilioSettings.phone_number}
                onChange={(e) => setTwilioSettings({ ...twilioSettings, phone_number: e.target.value })}
                className="w-full bg-[#F4F4EF] border-none rounded-xl p-4 text-[#002819] focus:ring-2 focus:ring-[#06402B]/20"
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveTwilio}
              disabled={saving}
              className="w-full py-3 bg-[#F22F46] text-white rounded-xl font-bold hover:bg-[#d91d39] transition disabled:opacity-50"
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

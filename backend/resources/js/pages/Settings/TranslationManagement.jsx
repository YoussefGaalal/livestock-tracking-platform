import { useState, useEffect } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../../utils/api';
import { useI18n } from '../../i18n';

const GROUPS = ['auth', 'users', 'errors', 'common', 'nav', 'dashboard', 'animals', 'devices', 'alerts', 'mapPage', 'settings', 'subscription', 'profile', 'tasks', 'vaccination', 'team', 'reports', 'ai', 'platform'];

export default function TranslationManagement() {
  const { t, changeLanguage } = useI18n();
  const [groups, setGroups] = useState(GROUPS);
  const [selectedGroup, setSelectedGroup] = useState('common');
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    if (selectedGroup) fetchTranslations();
  }, [selectedGroup]);

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/translations?group=${selectedGroup}`);
      if (res.ok) {
        const data = await res.json();
        setTranslations(data);
        const values = {};
        data.forEach(tr => {
          values[`${tr.language_code}_${tr.key}`] = tr.value;
        });
        setEditValues(values);
      }
    } catch (err) {
      console.error('Failed to fetch translations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (languageCode, key, value) => {
    setEditValues(prev => ({ ...prev, [`${languageCode}_${key}`]: value }));
  };

  const handleSave = async (tr) => {
    setSaving(true);
    setMessage(null);
    try {
      if (tr.id) {
        const res = await apiFetch(`/api/admin/translations/${tr.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: editValues[`${tr.language_code}_${tr.key}`] }),
        });
        if (res.ok) {
          setMessage({ type: 'success', text: t('common.save') + ' ' + t('common.success').toLowerCase() });
        }
      } else {
        const res = await apiFetch('/api/admin/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language_code: tr.language_code,
            group: selectedGroup,
            key: tr.key,
            value: editValues[`${tr.language_code}_${tr.key}`],
          }),
        });
        if (res.ok) {
          fetchTranslations();
          setMessage({ type: 'success', text: t('common.save') + ' ' + t('common.success').toLowerCase() });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('errors.serverError') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tr) => {
    if (!confirm(t('common.confirmDelete', { key: tr.key }))) return;
    try {
      if (tr.id) {
        await apiFetch(`/api/admin/translations/${tr.id}`, { method: 'DELETE' });
      }
      fetchTranslations();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleAddNew = async () => {
    if (!newKey.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_code: 'en',
          group: selectedGroup,
          key: newKey,
          value: '',
        }),
      });
      if (res.ok) {
        setNewKey('');
        fetchTranslations();
      }
    } catch (err) {
      console.error('Failed to add:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-[#D4AF37]/20 rounded-xl">
          <MaterialSymbol icon="translate" size={24} className="text-[#735c00]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#002819]">{t('settings.language')} - {t('settings.translations')}</h2>
          <p className="text-sm text-[#717973] mt-1">{t('settings.translationsDesc', { group: selectedGroup })}</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
          {message.text}
        </div>
      )}

      {/* Group Selector */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">{t('settings.group')}</label>
        <div className="flex flex-wrap gap-2">
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedGroup === g
                  ? 'bg-[#002819] text-white shadow-md'
                  : 'bg-[#F4F4EF] text-[#404943] hover:bg-[#E3E3DE]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Key */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex gap-3">
          <input
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder={t('settings.newKeyPlaceholder')}
            className="flex-1 bg-[#F4F4EF] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#06402B]/20 outline-none"
          />
          <button
            onClick={handleAddNew}
            disabled={saving || !newKey.trim()}
            className="px-6 py-4 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402B] disabled:opacity-50 transition"
          >
            {saving ? t('common.loading') : t('common.add')}
          </button>
        </div>
      </div>

      {/* Translations Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#717973]">
            <div className="w-8 h-8 border-2 border-[#002819] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            {t('common.loading')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F4F4EF] text-left">
                  <th className="px-6 py-4 text-xs font-bold text-[#404943] uppercase tracking-wider">Key</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#404943] uppercase tracking-wider">EN</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#404943] uppercase tracking-wider">AR</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#404943] uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {translations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-[#717973]">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  translations.map((tr, i) => (
                    <tr key={i} className="border-t border-[#E3E3DE] hover:bg-[#F4F4EF]/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-[#002819]">{tr.key}</td>
                      <td className="px-6 py-4">
                        <input
                          value={editValues[`en_${tr.key}`] || tr.value || ''}
                          onChange={e => handleValueChange('en', tr.key, e.target.value)}
                          className="w-full bg-[#F4F4EF] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#06402B]/20 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4" dir="rtl">
                        <input
                          value={editValues[`ar_${tr.key}`] || ''}
                          onChange={e => handleValueChange('ar', tr.key, e.target.value)}
                          className="w-full bg-[#F4F4EF] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#06402B]/20 outline-none text-right"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(tr)}
                            disabled={saving}
                            className="px-4 py-2 bg-[#002819] text-white rounded-lg text-sm font-semibold hover:bg-[#06402B] disabled:opacity-50 transition"
                          >
                            {saving ? '...' : t('common.save')}
                          </button>
                          <button
                            onClick={() => handleDelete(tr)}
                            className="px-4 py-2 bg-[#ffdad6] text-[#93000a] rounded-lg text-sm font-semibold hover:bg-[#ffc7c7] transition"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

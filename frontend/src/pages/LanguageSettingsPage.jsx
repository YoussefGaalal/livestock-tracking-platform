import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { useI18n } from '../i18n';
import api from '../utils/api';

export default function LanguageSettingsPage() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [languages, setLanguages] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [selectedLanguageForTranslation, setSelectedLanguageForTranslation] = useState(null);
  const [showTranslations, setShowTranslations] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('common');
  const [loading, setLoading] = useState(false);
  const [editingLang, setEditingLang] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', native_name: '', direction: 'ltr' });
  const [message, setMessage] = useState(null);

  const groups = ['common', 'dashboard', 'animals', 'devices', 'geofences', 'alerts', 'tasks', 'auctions', 'profile', 'settings'];

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    if (selectedLanguageForTranslation && showTranslations) {
      loadTranslations();
    }
  }, [selectedLanguageForTranslation, selectedGroup, showTranslations]);

  const loadLanguages = async () => {
    try {
      const res = await api.get('/api/admin/languages');
      if (res.ok) {
        const langData = res.data?.data || res.data || [];
        setLanguages(langData);
      } else {
        console.error('Failed to load languages:', res.status);
      }
    } catch (err) {
      console.error('Failed to load languages:', err);
    }
  };

  const loadTranslations = async () => {
    if (!selectedLanguageForTranslation) return;
    try {
      const res = await api.get('/api/translations', { params: { group: selectedGroup, lang: selectedLanguageForTranslation } });
      if (res.ok) {
        setTranslations(res.data || []);
      } else {
        console.error('Failed to load translations:', res.status);
      }
    } catch (err) {
      console.error('Failed to load translations:', err);
    }
  };

const handleSaveLanguage = async () => {
    if (!formData.code || !formData.name || !formData.native_name) {
      alert('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      let res;
      if (editingLang) {
        res = await api.put(`/api/admin/languages/${editingLang}`, formData);
      } else {
        res = await api.post(`/api/admin/languages`, formData);
      }
      if (res.ok) {
        setMessage({ type: 'success', text: t('settings.saved') || 'Language saved successfully!' });
        setEditingLang(null);
        setFormData({ code: '', name: '', native_name: '', direction: 'ltr' });
        loadLanguages();
        sessionStorage.setItem('oasis_translations_dirty', Date.now().toString());
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.data;
        setMessage({ type: 'error', text: data.error || 'Failed to save language' });
      }
    } catch (err) {
      console.error('Failed to save language:', err);
      setMessage({ type: 'error', text: 'Failed to save language' });
    }
    setLoading(false);
  };

  const handleEditLanguage = (lang) => {
    setEditingLang(lang.code);
    setFormData({
      code: lang.code,
      name: lang.name,
      native_name: lang.native_name,
      direction: lang.direction
    });
  };

  const handleDeleteLanguage = async (code) => {
    if (!confirm('Are you sure? This will also delete all translations for this language.')) return;
    try {
      const res = await api.delete(`/api/admin/languages/${code}`);
      if (res.ok) {
        loadLanguages();
        sessionStorage.setItem('oasis_translations_dirty', Date.now().toString());
      } else {
        const data = await res.data;
        alert(data.error || 'Failed to delete language');
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete language');
    }
  };

  const handleSetDefault = async (code) => {
    try {
      const res = await api.post(`/api/admin/languages/${code}/set-default`);
      if (res.ok) {
        loadLanguages();
        sessionStorage.setItem('oasis_translations_dirty', Date.now().toString());
      } else {
        const data = await res.data;
        alert(data.error || 'Failed to set default language');
      }
    } catch (err) {
      console.error('Failed to set default:', err);
      alert('Failed to set default language');
    }
  };

  const handleToggleActive = async (lang) => {
    try {
      const res = await api.put(`/api/admin/languages/${lang.code}`, { is_active: !lang.is_active });
      if (res.ok) {
        loadLanguages();
        sessionStorage.setItem('oasis_translations_dirty', Date.now().toString());
      } else {
        const data = await res.data;
        alert(data.error || 'Failed to update language');
      }
    } catch (err) {
      console.error('Failed to toggle:', err);
      alert('Failed to update language');
    }
  };

  const handleSaveTranslation = async (id, value) => {
    try {
      const res = await api.put(`/api/admin/translations/${id}`, { value });
      if (res.ok) {
        // 1. Update local state
        setTranslations(prev => prev.map(t => 
          t.id === id ? { ...t, value } : t
        ));
        
        // 2. Mark translations as dirty for cache busting
        sessionStorage.setItem('oasis_translations_dirty', Date.now().toString());
      } else {
        console.error('Failed to save translation:', res.status);
      }
    } catch (err) {
      console.error('Failed to save translation:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingLang(null);
    setFormData({ code: '', name: '', native_name: '', direction: 'ltr' });
  };

  const handleSelectLanguageForTranslation = (lang) => {
    setSelectedLanguageForTranslation(lang.code);
    setSelectedGroup('common');
    setShowTranslations(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
      >
        <MaterialSymbol icon="arrow_back" size={20} />
        <span>{t('back') || 'Back to Settings'}</span>
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {t('settings.languageSettings') || 'Language Settings'}
      </h1>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {showTranslations ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex gap-4 items-center">
            <button
              onClick={() => setShowTranslations(false)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <MaterialSymbol icon="arrow_back" size={20} />
              <span>Back to Languages</span>
            </button>
            <span className="text-gray-400">|</span>
            <select
              value={selectedLanguageForTranslation}
              onChange={(e) => setSelectedLanguageForTranslation(e.target.value)}
              className="border rounded px-3 py-2 min-w-[200px]"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name} ({lang.code})</option>
              ))}
            </select>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border rounded px-3 py-2"
            >
              {groups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">
              Translations: {languages.find(l => l.code === selectedLanguageForTranslation)?.name} - {selectedGroup}
            </h2>
            <span className="text-sm text-gray-500">{translations.length} keys</span>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-1/3">Key</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Value</th>
                </tr>
              </thead>
              <tbody>
                {translations.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-4 py-8 text-center text-gray-500">
                      No translations found for this language and group.
                    </td>
                  </tr>
                ) : (
                  translations.map((trans) => (
                    <tr key={trans.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm text-gray-700">{trans.key}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          defaultValue={trans.value}
                          onBlur={(e) => handleSaveTranslation(trans.id, e.target.value)}
                          className="w-full border rounded px-3 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Language Form Panel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold mb-4 text-lg">
              {editingLang ? `${t('common.edit')} Language` : `${t('common.add')} Language`}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  placeholder="e.g. en, ar, fr"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                  disabled={!!editingLang}
                  maxLength={3}
                  className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. English, Arabic"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Native Name</label>
                <input
                  type="text"
                  placeholder="e.g. English, العربية"
                  value={formData.native_name}
                  onChange={(e) => setFormData({ ...formData, native_name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="ltr">LTR (Left to Right)</option>
                  <option value="rtl">RTL (Right to Left)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveLanguage}
                  disabled={loading || !formData.code || !formData.name}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Saving...' : t('common.save')}
                </button>
                {editingLang && (
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Languages List Panel */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold">Available Languages</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('common.code')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('common.name')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t('common.status')}</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {languages.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No languages found. Add your first language above.
                      </td>
                    </tr>
                  ) : (
                    languages.map((lang) => (
                      <tr key={lang.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold">{lang.code}</span>
                          {lang.is_default && (
                            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium">Default</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>{lang.name}</div>
                          <div className="text-xs text-gray-500">{lang.native_name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${lang.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {lang.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEditLanguage(lang)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {t('common.edit')}
                            </button>
                            <button
                              onClick={() => handleSelectLanguageForTranslation(lang)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Translate
                            </button>
                            <button
                              onClick={() => handleToggleActive(lang)}
                              className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                            >
                              {lang.is_active ? t('common.disable') : t('common.enable')}
                            </button>
                            {!lang.is_default && (
                              <>
                                <button
                                  onClick={() => handleSetDefault(lang.code)}
                                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                >
                                  {t('common.setDefault')}
                                </button>
                                <button
                                  onClick={() => handleDeleteLanguage(lang.code)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  {t('common.delete')}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { createContext, useContext, useState, useEffect } from 'react';
import en from './en';
import ar from './ar';
import ur from './ur';
import eu from './eu';

const translations = { en, ar, ur, eu };

const I18nContext = createContext({
  locale: 'en',
  dir: 'ltr',
  t: (key) => key,
  setLocale: () => {},
  languages: [],
});

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const saved = localStorage.getItem('oasis_locale');
    return saved || 'en';
  });

  const [languages, setLanguages] = useState([]);

  const dir = ['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('oasis_locale', locale);
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
    
    // Fetch available languages from backend
    const token = localStorage.getItem('oasis_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.languages && Array.isArray(data.languages)) {
          setLanguages(data.languages);
        }
      })
      .catch(() => {});
    }
  }, [locale, dir]);

  const setLocale = (newLocale) => {
    setLocaleState(newLocale);
    // Sync with backend
    const token = localStorage.getItem('oasis_token');
    if (token) {
      fetch('/api/auth/locale', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ locale: newLocale })
      }).catch(() => {});
    }
  };

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), val);
      });
    }
    
    return value || key;
  };

  return (
    <I18nContext.Provider value={{ locale, dir, t, setLocale, languages }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
export default I18nContext;

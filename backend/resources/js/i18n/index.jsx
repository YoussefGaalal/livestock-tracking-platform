import { createContext, useContext, useState, useEffect } from 'react';
import en from './en';
import ar from './ar';

const translations = { en, ar };

const I18nContext = createContext({
  locale: 'en',
  dir: 'ltr',
  t: (key) => key,
  setLocale: () => {},
});

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem('oasis_locale');
    return saved || 'en';
  });

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('oasis_locale', locale);
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, dir]);

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
    <I18nContext.Provider value={{ locale, dir, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
export default I18nContext;

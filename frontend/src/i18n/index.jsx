import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getLocale, setLocale as setStoredLocale } from '../utils/cookies';
import api from '../utils/api';
import en from './en';
import ar from './ar';
import ur from './ur';
import eu from './eu';

const localTranslations = { en, ar, ur, eu };

const I18nContext = createContext({
  locale: 'en',
  dir: 'ltr',
  t: (key) => key,
});

function getNestedValue(obj, path) {
  const keys = path.split('.');
  let value = obj;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return null;
    }
  }
  return value;
}

function transformFlatTranslations(data) {
  const nested = {};
  if (Array.isArray(data)) {
    data.forEach(item => {
      const fullKey = item.group ? `${item.group}.${item.key}` : item.key;
      if (!nested[item.language_code]) nested[item.language_code] = {};
      // Store both the full key (common.edit) and the short key (edit)
      nested[item.language_code][fullKey] = item.value;
      if (item.group && !nested[item.language_code][item.key]) {
        nested[item.language_code][item.key] = item.value;
      }
    });
  }
  return nested;
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => getLocale() || 'en');
  const [dir, setDir] = useState('ltr');
  const [apiTranslations, setApiTranslations] = useState({});
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    const currentLang = languages.find(l => l.code === locale);
    setDir(currentLang?.direction || 'ltr');
  }, [locale, languages]);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const res = await api.get('/api/languages');
        if (res.ok) {
          setLanguages(res.data.filter(lang => lang.is_active));
        }
      } catch (e) {
        console.warn('Failed to load languages:', e.message);
      }
    };
    loadLanguages();
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const res = await api.get('/api/translations');
        if (res.ok) {
          const nested = transformFlatTranslations(res.data);
          setApiTranslations(nested);
        }
      } catch (e) {
        console.warn('Failed to load translations:', e.message);
      }
    };
    loadTranslations();
  }, []);

  useEffect(() => {
    const checkAndReloadTranslations = async () => {
      const dirty = sessionStorage.getItem('oasis_translations_dirty');
      if (dirty) {
        const dirtyTime = parseInt(dirty, 10);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - dirtyTime < fiveMinutes) {
          try {
            const res = await api.get('/api/translations');
            if (res.ok) {
              const nested = transformFlatTranslations(res.data);
              setApiTranslations(nested);
            }
          } catch (e) {
            console.warn('Failed to reload translations:', e.message);
          }
        }
        sessionStorage.removeItem('oasis_translations_dirty');
      }
    };
    checkAndReloadTranslations();
  }, [locale]);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, dir]);

  const setLocale = useCallback((newLocale) => {
    setStoredLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key, params = {}) => {
    // Helper to extract just the key part without group prefix
    const getShortKey = (k) => k.includes('.') ? k.split('.').pop() : k;
    const shortKey = getShortKey(key);
    
    // Try full key in API translations (e.g., common.edit)
    let value = getNestedValue(apiTranslations[locale], key);
    // Try short key in API translations (e.g., edit)
    if (!value) value = getNestedValue(apiTranslations[locale], shortKey);
    // Try full key in local translations
    if (!value) value = getNestedValue(localTranslations[locale], key);
    // Try short key in local translations
    if (!value) value = getNestedValue(localTranslations[locale], shortKey);
    // Fallback to English full key
    if (!value) value = getNestedValue(localTranslations['en'], key);
    // Fallback to English short key
    if (!value) value = getNestedValue(localTranslations['en'], shortKey);
    // Fallback to key itself
    if (typeof value !== 'string') return key;
    // Replace params
    if (Object.keys(params).length > 0) {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), val);
      });
    }
    return value;
  }, [locale, apiTranslations]);

  return (
    <I18nContext.Provider value={{ locale, dir, t, setLocale, languages }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
export default I18nContext;

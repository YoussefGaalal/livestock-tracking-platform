import React from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { useI18n } from './index';
import { setStoredLocale } from '../utils/api';

const defaultLanguages = [
  { code: 'en', name: 'English', native_name: 'English', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', native_name: 'العربية', direction: 'rtl' },
  { code: 'ur', name: 'Urdu', native_name: 'اردو', direction: 'rtl' },
  { code: 'eu', name: 'Basque', native_name: 'Euskara', direction: 'ltr' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, languages, t } = useI18n();
  const langList = languages?.length > 0 ? languages : defaultLanguages;
  const currentLang = langList.find(l => l.code === locale);

  const handleChange = (e) => {
    const newLocale = e.target.value;
    setStoredLocale(newLocale);
    setLocale(newLocale);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={locale}
        onChange={handleChange}
        className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-all text-brand-primary font-semibold text-sm border-none cursor-pointer"
        title={t('common.switchLanguage')}
      >
        {langList.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.native_name || lang.name}
          </option>
        ))}
      </select>
      {currentLang?.direction === 'rtl' && (
        <span className="text-xs font-bold text-brand-secondary">RTL</span>
      )}
    </div>
  );
}

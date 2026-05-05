import { MaterialSymbol } from 'react-material-symbols';
import { useI18n } from './index';

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
    setLocale(newLocale);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={locale}
        onChange={handleChange}
        className="px-3 py-2 rounded-xl bg-[#F4F4EF] hover:bg-[#E3E3DE] transition-all text-[#002819] font-semibold text-sm border-none cursor-pointer"
        title={t('common.switchLanguage') || 'Switch Language'}
      >
        {langList.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.native_name || lang.name}
          </option>
        ))}
      </select>
      {currentLang?.direction === 'rtl' && (
        <span className="text-xs font-bold text-[#D4AF37]">RTL</span>
      )}
    </div>
  );
}

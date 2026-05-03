import { MaterialSymbol } from 'react-material-symbols';
import { useI18n } from './index';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F4F4EF] hover:bg-[#E3E3DE] transition-all text-[#002819] font-semibold text-sm"
      title={locale === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    >
      <MaterialSymbol icon="translate" size={18} />
      <span className="font-bold">
        {locale === 'en' ? 'عربي' : 'EN'}
      </span>
    </button>
  );
}

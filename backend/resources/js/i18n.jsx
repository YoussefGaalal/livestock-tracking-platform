import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useTranslation, I18nextProvider } from 'react-i18next';
import { useEffect } from 'react';

const resources = {
  en: {
    translation: {
      auth: {
        login: 'Sign in to your account',
        register: 'Create your account',
        email: 'Email address',
        password: 'Password',
        confirmPassword: 'Confirm password',
        forgotPassword: 'Forgot password?',
        rememberMe: 'Remember me',
        noAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
      },
      users: {
        name: 'Full name',
        phone: 'Phone number',
      },
      errors: {
        unauthorized: 'Invalid credentials',
        serverError: 'Server error',
        networkError: 'Network error',
      },
      common: {
        loading: 'Loading...',
        language: 'Language',
      },
      platform: {
        name: 'Oasis Trace',
      },
    },
  },
  ar: {
    translation: {
      auth: {
        login: 'تسجيل الدخول إلى حسابك',
        register: 'إنشاء حساب جديد',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        confirmPassword: 'تأكيد كلمة المرور',
        forgotPassword: 'نسيت كلمة المرور؟',
        rememberMe: 'تذكرني',
        noAccount: 'ليس لديك حساب؟',
        haveAccount: 'لديك حساب بالفعل؟',
      },
      users: {
        name: 'الاسم الكامل',
        phone: 'رقم الهاتف',
      },
      errors: {
        unauthorized: 'بيانات الدخول غير صحيحة',
        serverError: 'خطأ في الخادم',
        networkError: 'خطأ في الاتصال',
      },
      common: {
        loading: 'جاري التحميل...',
        language: 'اللغة',
      },
      platform: {
        name: 'أواسيس تريس',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('i18nextLng') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Sync locale with backend on init
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('oasis_token');
  if (token) {
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.settings?.locale) {
          const backendLocale = data.settings.locale;
          const currentLocale = localStorage.getItem('i18nextLng') || 'en';
          if (backendLocale !== currentLocale) {
            localStorage.setItem('i18nextLng', backendLocale);
            i18n.changeLanguage(backendLocale);
          }
        }
      })
      .catch(() => {});
  }
}

export function useI18n() {
  const { t, i18n: i18nInstance } = useTranslation();
  return {
    t,
    dir: i18nInstance.dir(),
    language: i18nInstance.language,
    changeLanguage: (lng) => {
      i18nInstance.changeLanguage(lng);
      localStorage.setItem('i18nextLng', lng);
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
      // Sync with backend
      const token = localStorage.getItem('oasis_token');
      if (token) {
        fetch('/api/auth/locale', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ locale: lng })
        }).catch(() => {});
      }
    },
  };
}

export function I18nProvider({ children }) {
  useEffect(() => {
    const lng = i18n.language;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  }, []);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export default i18n;

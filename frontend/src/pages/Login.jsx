import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { usePlatform } from '../context/PlatformContext';
import { setAuthToken, setAuthUser, setUserRole, setPendingSubscription } from '../utils/cookies';
import { apiFetch } from '../utils/api';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

export default function Login() {
  const { t, dir } = useI18n();
  const { platformName } = usePlatform();
  const isRtl = dir === 'rtl';

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, getMe } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError(t('errors.unauthorized'));
      }
    } else {
      try {
        const response = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
            phone,
            language: localStorage.getItem('oasis_locale') || 'en',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const userRole = data.user?.role || data.user?.roles?.[0] || 'Shepherd';
          setAuthToken(data.token);
          setAuthUser({ ...data.user, role: userRole });
          setUserRole(userRole);
          setPendingSubscription(true);
          navigate('/subscription/select');
        } else {
          const data = await response.json();
          setError(data.message || data.errors?.email?.[0] || t('errors.serverError'));
        }
      } catch (err) {
        setError(t('errors.networkError'));
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsForgotPassword(false);
        setError('');
        alert(data.message || t('auth.resetLinkSent'));
      } else {
        const data = await response.json();
        setError(data.message || t('errors.serverError'));
      }
    } catch (err) {
      setError(t('errors.networkError'));
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-brand-light via-neutral-100 to-neutral-200 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-neutral-300/30" />
        <div
          className="w-full h-full"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 40, 25, 0.85), rgba(6, 64, 43, 0.7)), url(https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=2070&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-6">
        <div className="bg-white/95 backdrop-blur-xl p-10 md:p-12 rounded-3xl shadow-[0_24px_64px_rgba(6,64,43,0.15)]">
<div className="flex flex-col items-center mb-10">
            <div className="w-18 h-18 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-brand-primary/30">
              <MaterialSymbol icon="track_changes" size={36} className="text-brand-accent" weight="fill" />
            </div>
            <div className="absolute top-0 right-0 mt-6 mr-6">
              <LanguageSwitcher />
            </div>
            <h1 className="text-4xl font-black text-brand-primary font-['Manrope'] tracking-tight mb-2">
              {isLogin ? t('auth.login') : t('auth.register')}
            </h1>
            <p className="text-neutral-600 font-medium">{platformName}</p>
          </div>

          <form className="space-y-5" onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}>
            {!isLogin && (
              <div className="space-y-3">
                <label className={`block text-sm font-bold text-brand-primary px-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('users.name')}
                </label>
                <div className="relative">
                  <MaterialSymbol
                    icon="person"
                    size={20}
                    className={`absolute top-1/2 -translate-y-1/2 text-neutral-500 ${isRtl ? 'right-5 left-auto' : 'left-5'}`}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('users.name')}
                    required={!isLogin}
                    className={`w-full bg-neutral-100 rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 transition-all font-medium text-neutral-700 placeholder:text-neutral-400 ${
                      isRtl ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className={`block text-sm font-bold text-brand-primary px-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                {t('auth.email')}
              </label>
              <div className="relative">
                <MaterialSymbol
                  icon="mail"
                  size={20}
                  className={`absolute top-1/2 -translate-y-1/2 text-neutral-500 ${isRtl ? 'right-5 left-auto' : 'left-5'}`}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@oasis.com"
                  required
                  className={`w-full bg-neutral-100 rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 transition-all font-medium text-neutral-700 placeholder:text-neutral-400 ${
                    isRtl ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
                  }`}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-3">
                <label className={`block text-sm font-bold text-brand-primary px-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('users.phone')}
                </label>
                <div className="relative">
                  <MaterialSymbol
                    icon="phone"
                    size={20}
                    className={`absolute top-1/2 -translate-y-1/2 text-neutral-500 ${isRtl ? 'right-5 left-auto' : 'left-5'}`}
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('users.phone')}
                    className={`w-full bg-neutral-100 rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 transition-all font-medium text-neutral-700 placeholder:text-neutral-400 ${
                      isRtl ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
                    }`}
                  />
                </div>
              </div>
            )}

<div className="space-y-3">
              <div className={`flex justify-between items-center px-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <label className="text-sm font-bold text-brand-primary">{isForgotPassword ? t('auth.email') : t('auth.password')}</label>
                {isLogin && !isForgotPassword && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs font-semibold text-brand-accent hover:underline bg-transparent border-none cursor-pointer"
                  >
                    {t('auth.forgotPassword')}
                  </button>
)}
              </div>
              {!isForgotPassword && (
              <div className="relative">
                <MaterialSymbol
                  icon="lock"
                  size={20}
                  className={`absolute top-1/2 -translate-y-1/2 text-neutral-500 ${isRtl ? 'right-5 left-auto' : 'left-5'}`}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className={`w-full bg-neutral-100 rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 transition-all font-medium text-neutral-700 placeholder:text-neutral-400 ${
                    isRtl ? 'pr-14 pl-5' : 'pl-14 pr-14'
                  }`}
                />
                <MaterialSymbol
                  icon={showPassword ? 'visibility_off' : 'visibility'}
                  size={20}
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-neutral-500 cursor-pointer hover:text-brand-primary ${isRtl ? 'left-5 right-auto' : 'right-5'}`}
                />
              </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-3">
                <label className={`block text-sm font-bold text-brand-primary px-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <MaterialSymbol
                    icon="lock"
                    size={20}
                    className={`absolute top-1/2 -translate-y-1/2 text-neutral-500 ${isRtl ? 'right-5 left-auto' : 'left-5'}`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="••••••••"
                    required={!isLogin}
                    minLength={8}
                    className={`w-full bg-neutral-100 rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 transition-all font-medium text-neutral-700 placeholder:text-neutral-400 ${
                      isRtl ? 'pr-14 pl-5' : 'pl-14 pr-14'
                    }`}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-danger/10 text-danger rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {isLogin && (
              <div className={`flex items-center gap-3 px-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-2 border-neutral-200 text-brand-primary focus:ring-2 focus:ring-brand-secondary/20 cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-neutral-600 font-medium cursor-pointer">
                  {t('auth.rememberMe')}
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-br from-brand-primary to-brand-secondary text-brand-accent font-bold py-5 rounded-2xl shadow-xl shadow-brand-primary/25 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${
                isRtl ? 'flex-row-reverse' : ''
              }`}
            >
              <span className="font-bold">{loading ? t('common.loading') : (isLogin ? t('auth.login') : t('auth.register'))}</span>
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <MaterialSymbol icon={isLogin ? "login" : "person_add"} size={20} weight="fill" />
              )}
            </button>
          </form>

<div className="mt-8 pt-8 border-t border-neutral-200 text-center">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                }}
                className="text-sm text-neutral-600"
              >
                {t('auth.backToLogin')}{' '}
                <span className="text-brand-primary font-bold hover:text-brand-accent transition-colors">
                  {t('auth.login')}
                </span>
              </button>
            ) : (
              <div className="text-sm text-neutral-600">
                <span>{isLogin ? t('auth.noAccount') : t('auth.haveAccount')}{' '}</span>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Sign-in clicked, current isLogin:', isLogin);
                      setIsLogin(prev => !prev);
                      setError('');
                    }}
                    className="text-brand-primary font-bold hover:text-brand-accent transition-colors cursor-pointer hover:underline bg-transparent border-none p-0 m-0 inline"
                  >
                  {isLogin ? t('auth.register') : t('auth.login')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className={`absolute bottom-0 w-full py-8 px-12 z-20 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex justify-between items-center max-w-screen-2xl mx-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
            <p className="text-white/80 font-medium text-sm">
            © 2024 {platformName}. Digital Majlis.
          </p>
        </div>
      </footer>
    </div>
  );
}


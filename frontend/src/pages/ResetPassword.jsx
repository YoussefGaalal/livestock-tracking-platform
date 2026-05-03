import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { useI18n } from '../i18n';
import { apiFetch } from '../utils/api';

export default function ResetPassword() {
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== passwordConfirmation) {
      setError(t('auth.passwordMismatch') || 'Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordMinLength') || 'Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.message || t('errors.serverError'));
      }
    } catch (err) {
      setError(t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-light via-neutral-100 to-neutral-200 ${isRtl ? 'rtl' : 'ltr'}`}>
        <div className="bg-white/95 backdrop-blur-xl p-10 md:p-12 rounded-3xl shadow-[0_24px_64px_rgba(6,64,43,0.15)] max-w-md w-full mx-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-18 h-18 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-brand-primary/30">
              <MaterialSymbol icon="check_circle" size={36} className="text-brand-accent" weight="fill" />
            </div>
            <h1 className="text-2xl font-black text-brand-primary">{t('auth.passwordResetSuccess') || 'Password Reset Successful'}</h1>
            <p className="text-neutral-600 mt-2">{t('auth.redirectingToLogin') || 'Redirecting to login...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-light via-neutral-100 to-neutral-200 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="bg-white/95 backdrop-blur-xl p-10 md:p-12 rounded-3xl shadow-[0_24px_64px_rgba(6,64,43,0.15)] max-w-md w-full mx-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-18 h-18 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-brand-primary/30">
            <MaterialSymbol icon="lock_reset" size={36} className="text-brand-accent" weight="fill" />
          </div>
          <h1 className="text-2xl font-black text-brand-primary">{t('auth.resetPassword')}</h1>
          <p className="text-neutral-600 mt-2">{t('auth.enterNewPassword') || 'Enter your new password'}</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
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
                required
                readOnly={!!searchParams.get('email')}
                className={`w-full bg-neutral-100 rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 transition-all font-medium text-neutral-700 placeholder:text-neutral-400 ${
                  isRtl ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
                } ${searchParams.get('email') ? 'opacity-60' : ''}`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className={`block text-sm font-bold text-brand-primary px-1 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t('auth.password')}
            </label>
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
          </div>

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
                required
                minLength={8}
                className={`w-full bg-neutral-100 rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 transition-all font-medium text-neutral-700 placeholder:text-neutral-400 ${
                  isRtl ? 'pr-14 pl-5' : 'pl-14 pr-14'
                }`}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-danger/10 text-danger rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-brand-primary to-brand-secondary text-brand-accent font-bold py-5 rounded-2xl shadow-xl shadow-brand-primary/25 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <span className="font-bold">{loading ? t('common.loading') : t('auth.resetPassword')}</span>
            {loading ? (
              <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
            ) : (
              <MaterialSymbol icon="lock_reset" size={20} weight="fill" />
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-neutral-200 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-neutral-600"
          >
            <span className="text-brand-primary font-bold hover:text-brand-accent transition-colors">
              {t('auth.backToLogin')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

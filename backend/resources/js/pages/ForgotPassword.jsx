import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { requestPasswordReset } from '../utils/api';
import { useI18n } from '../i18n';
import { usePlatform } from '../context/PlatformContext';

export default function ForgotPassword() {
  const { t, dir } = useI18n();
  const { platformName } = usePlatform();
  const isRtl = dir === 'rtl';

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      await requestPasswordReset(email);
      setStatus('success');
      setMessage(t('passwords.sent') || 'If that email exists, a reset link has been sent.');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || t('errors.serverError'));
    }
  };

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-[#FAF1F5] via-[#F4F4EF] to-[#E3E3DE] ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#eeeee9]/30" />
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
              <div className="w-18 h-18 bg-gradient-to-br from-[#002819] to-[#06402B] rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-[#002819]/30">
                <MaterialSymbol icon="lock_reset" size={36} className="text-[#D4AF37]" weight="fill" />
              </div>
              <h1 className="text-4xl font-black text-[#002819] font-['Manrope'] tracking-tight mb-2">
                {t('auth.forgotPassword') || 'Forgot Password'}
              </h1>
              <p className="text-[#404943] font-medium">{platformName}</p>
            </div>

            {status === 'success' ? (
              <div className="rounded-xl bg-green-50 p-6 text-center">
                <MaterialSymbol icon="check_circle" size={48} className="text-green-600 mx-auto mb-4" />
                <div className="text-sm text-green-800 mb-4">{message}</div>
                <Link to="/app/login" className="text-sm font-semibold text-[#06402B] hover:text-[#D4AF37] transition-colors">
                  ← {t('auth.login') || 'Back to login'}
                </Link>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <label className={`block text-sm font-bold text-[#002819] px-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <MaterialSymbol
                      icon="mail"
                      size={20}
                      className={`absolute top-1/2 -translate-y-1/2 text-[#717973] ${isRtl ? 'right-5 left-auto' : 'left-5'}`}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@oasis.com"
                      required
                      className={`w-full bg-[#F4F4EF] rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#06402B]/20 transition-all font-medium text-[#1a1c19] placeholder:text-[#c0c9c1] ${
                        isRtl ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
                      }`}
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <div className="p-4 bg-[#BA1A1A]/10 text-[#BA1A1A] rounded-xl text-sm font-medium">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className={`w-full bg-gradient-to-br from-[#002819] to-[#06402B] text-[#D4AF37] font-bold py-5 rounded-2xl shadow-xl shadow-[#002819]/25 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${
                    isRtl ? 'flex-row-reverse' : ''
                  }`}
                >
                  <span className="font-bold">{status === 'loading' ? (t('common.loading') || 'Sending...') : (t('auth.sendResetLink') || 'Send Reset Link')}</span>
                  {status === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MaterialSymbol icon="send" size={20} weight="fill" />
                  )}
                </button>
              </form>
            )}

            {status !== 'success' && (
              <div className="mt-8 pt-8 border-t border-[#E3E3DE] text-center">
                <Link to="/app/login" className="text-sm text-[#404943]">
                  <span className="text-[#002819] font-bold hover:text-[#D4AF37] transition-colors">
                    {t('auth.login') || 'Back to login'}
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className={`py-6 px-12 z-20 bg-[#06402B] ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex justify-center items-center max-w-screen-2xl mx-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
          <p className="text-white/80 font-medium text-sm">
            © 2024 {platformName}. Digital Majlis.
          </p>
        </div>
      </footer>
    </div>
  );
}

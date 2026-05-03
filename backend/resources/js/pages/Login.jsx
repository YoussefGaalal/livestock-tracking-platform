import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { usePlatform } from '../context/PlatformContext';

export default function Login() {
  const { t, dir } = useI18n();
  const { platformName } = usePlatform();
  const isRtl = dir === 'rtl';

  const [isLogin, setIsLogin] = useState(true);
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
  const { login } = useAuth();

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
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
            phone,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('oasis_user', JSON.stringify(data.user));
          localStorage.setItem('oasis_token', data.token);
          localStorage.setItem('oasis_role', data.user.role);
          localStorage.setItem('oasis_user_id', data.user.id);
          localStorage.setItem('pending_subscription', 'true');
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

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#FAF1F5] via-[#F4F4EF] to-[#E3E3DE] ${isRtl ? 'rtl' : 'ltr'}`}>
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
              <MaterialSymbol icon="track_changes" size={36} className="text-[#D4AF37]" weight="fill" />
            </div>
            <h1 className="text-4xl font-black text-[#002819] font-['Manrope'] tracking-tight mb-2">
              {isLogin ? t('auth.login') : t('auth.register')}
            </h1>
            <p className="text-[#404943] font-medium">{platformName}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-3">
                <label className={`block text-sm font-bold text-[#002819] px-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('users.name')}
                </label>
                <div className="relative">
                  <MaterialSymbol
                    icon="person"
                    size={20}
                    className={`absolute top-1/2 -translate-y-1/2 text-[#717973] ${isRtl ? 'right-5 left-auto' : 'left-5'}`}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('users.name')}
                    required={!isLogin}
                    className={`w-full bg-[#F4F4EF] rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#06402B]/20 transition-all font-medium text-[#1a1c19] placeholder:text-[#c0c9c1] ${
                      isRtl ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
                    }`}
                  />
                </div>
              </div>
            )}

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

            {!isLogin && (
              <div className="space-y-3">
                <label className={`block text-sm font-bold text-[#002819] px-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('users.phone')}
                </label>
                <div className="relative">
                  <MaterialSymbol
                    icon="phone"
                    size={20}
                    className={`absolute top-1/2 -translate-y-1/2 text-[#717973] ${isRtl ? 'right-5 left-auto' : 'left-5'}`}
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('users.phone')}
                    className={`w-full bg-[#F4F4EF] rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#06402B]/20 transition-all font-medium text-[#1a1c19] placeholder:text-[#c0c9c1] ${
                      isRtl ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className={`flex justify-between items-center px-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <label className="text-sm font-bold text-[#002819]">{t('auth.password')}</label>
                {isLogin && (
                  <a className="text-xs font-semibold text-[#D4AF37] hover:underline" href="#">
                    {t('auth.forgotPassword')}
                  </a>
                )}
              </div>
              <div className="relative">
                <MaterialSymbol
                  icon="lock"
                  size={20}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#717973] ${isRtl ? 'right-5 left-auto' : 'left-5'}`}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className={`w-full bg-[#F4F4EF] rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#06402B]/20 transition-all font-medium text-[#1a1c19] placeholder:text-[#c0c9c1] ${
                    isRtl ? 'pr-14 pl-5' : 'pl-14 pr-14'
                  }`}
                />
                <MaterialSymbol
                  icon={showPassword ? 'visibility_off' : 'visibility'}
                  size={20}
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#717973] cursor-pointer hover:text-[#002819] ${isRtl ? 'left-5 right-auto' : 'right-5'}`}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-3">
                <label className={`block text-sm font-bold text-[#002819] px-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <MaterialSymbol
                    icon="lock"
                    size={20}
                    className={`absolute top-1/2 -translate-y-1/2 text-[#717973] ${isRtl ? 'right-5 left-auto' : 'left-5'}`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="••••••••"
                    required={!isLogin}
                    minLength={8}
                    className={`w-full bg-[#F4F4EF] rounded-xl py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#06402B]/20 transition-all font-medium text-[#1a1c19] placeholder:text-[#c0c9c1] ${
                      isRtl ? 'pr-14 pl-5' : 'pl-14 pr-14'
                    }`}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-[#BA1A1A]/10 text-[#BA1A1A] rounded-xl text-sm font-medium">
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
                  className="w-5 h-5 rounded-lg border-2 border-[#E3E3DE] text-[#002819] focus:ring-2 focus:ring-[#06402B]/20 cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-[#404943] font-medium cursor-pointer">
                  {t('auth.rememberMe')}
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-br from-[#002819] to-[#06402B] text-[#D4AF37] font-bold py-5 rounded-2xl shadow-xl shadow-[#002819]/25 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${
                isRtl ? 'flex-row-reverse' : ''
              }`}
            >
              <span className="font-bold">{loading ? t('common.loading') : (isLogin ? t('auth.login') : t('auth.register'))}</span>
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              ) : (
                <MaterialSymbol icon={isLogin ? "login" : "person_add"} size={20} weight="fill" />
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#E3E3DE] text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-[#404943]"
            >
              {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
              <span className="text-[#002819] font-bold hover:text-[#D4AF37] transition-colors">
                {isLogin ? t('auth.register') : t('auth.login')}
              </span>
            </button>
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

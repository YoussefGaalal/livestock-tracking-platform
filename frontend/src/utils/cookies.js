const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'Lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60,
};

export const CookieService = {
  get(name) {
    try {
      const matches = document.cookie.match(new RegExp(
        '(^| )' + name + '=([^;]+)'
      ));
      return matches ? decodeURIComponent(matches[2]) : null;
    } catch (e) {
      return null;
    }
  },

  set(name, value, options = {}) {
    try {
      const opts = { ...COOKIE_OPTIONS, ...options };
      let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
      
      if (opts.path) cookie += `; path=${opts.path}`;
      if (opts.maxAge) cookie += `; max-age=${opts.maxAge}`;
      if (opts.sameSite) cookie += `; samesite=${opts.sameSite}`;
      if (opts.secure) cookie += '; secure';
      if (opts.domain) cookie += `; domain=${opts.domain}`;
      
      document.cookie = cookie;
      return true;
    } catch (e) {
      console.error('Cookie set error:', e);
      return false;
    }
  },

  remove(name) {
    try {
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      return true;
    } catch (e) {
      return false;
    }
  },

  getAll() {
    try {
      const cookies = {};
      document.cookie.split(';').forEach(c => {
        const [key, val] = c.trim().split('=');
        if (key) cookies[decodeURIComponent(key)] = decodeURIComponent(val || '');
      });
      return cookies;
    } catch (e) {
      return {};
    }
  },

  clear() {
    ['oasis_token', 'oasis_user', 'oasis_role'].forEach(name => this.remove(name));
  }
};

const TOKEN_COOKIE = 'oasis_token';
const USER_COOKIE = 'oasis_user';
const ROLE_COOKIE = 'oasis_role';
const PENDING_SUB_COOKIE = 'pending_subscription';

export const getAuthToken = () => CookieService.get(TOKEN_COOKIE);
export const setAuthToken = (token) => CookieService.set(TOKEN_COOKIE, token);
export const getAuthUser = () => {
  const user = CookieService.get(USER_COOKIE);
  return user ? JSON.parse(user) : null;
};
export const setAuthUser = (user) => CookieService.set(USER_COOKIE, JSON.stringify(user));
export const getUserRole = () => CookieService.get(ROLE_COOKIE);
export const setUserRole = (role) => CookieService.set(ROLE_COOKIE, role);
export const getPendingSubscription = () => CookieService.get(PENDING_SUB_COOKIE) === 'true';
export const setPendingSubscription = (value) => CookieService.set(PENDING_SUB_COOKIE, String(value));

export const clearAuth = () => {
  CookieService.remove(TOKEN_COOKIE);
  CookieService.remove(USER_COOKIE);
  CookieService.remove(ROLE_COOKIE);
  CookieService.remove(PENDING_SUB_COOKIE);
};

export const LOCALE_COOKIE = 'oasis_locale';
export const getLocale = () => localStorage.getItem(LOCALE_COOKIE) || 'en';
export const setLocale = (locale) => localStorage.setItem(LOCALE_COOKIE, locale);

export default CookieService;
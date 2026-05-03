const STORAGE_PREFIX = 'oasis_';

const StorageService = {
  get(key) {
    try {
      const value = localStorage.getItem(STORAGE_PREFIX + key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error(`Storage get error for ${key}:`, e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Storage set error for ${key}:`, e);
    }
  },

  remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  getString(key) {
    return localStorage.getItem(STORAGE_PREFIX + key);
  },

  setString(key, value) {
    localStorage.setItem(STORAGE_PREFIX + key, value);
  },

  clear() {
    const keys = ['user', 'token', 'user_id', 'role', 'locale', 'pending_subscription'];
    keys.forEach(key => this.remove(key));
  }
};

export const getAuthUser = () => StorageService.get('user');
export const getAuthToken = () => StorageService.getString('token');
export const getUserId = () => StorageService.getString('user_id');
export const getUserRole = () => StorageService.getString('role');
export const setAuthUser = (user) => StorageService.set('user', user);
export const setAuthToken = (token) => StorageService.setString('token', token);
export const setUserId = (id) => StorageService.setString('user_id', String(id));
export const setUserRole = (role) => StorageService.setString('role', role);
export const clearAuth = () => {
  StorageService.remove('user');
  StorageService.remove('token');
  StorageService.remove('user_id');
  StorageService.remove('role');
};

export const getLocale = () => StorageService.getString('locale');
export const setLocale = (locale) => StorageService.setString('locale', locale);

export const getPendingSubscription = () => StorageService.getString('pending_subscription') === 'true';
export const setPendingSubscription = (value) => StorageService.setString('pending_subscription', String(value));
export const clearPendingSubscription = () => StorageService.remove('pending_subscription');

export default StorageService;
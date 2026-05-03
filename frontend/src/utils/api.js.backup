import { getAuthUser, getAuthToken, getLocale } from './cookies';

export const getStoredLocale = getLocale;
export const setStoredLocale = (locale) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('oasis_locale', locale);
  }
};

export const getAuthHeaders = () => {
  const user = getAuthUser();
  const token = getAuthToken();
  const locale = getStoredLocale();
  
  const headers = {
    'Accept': 'application/json',
    'Accept-Language': locale,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (user && user.id) {
    headers['X-User-Id'] = String(user.id);
  }

  return headers;
};

const API_BASE = ''; // Use Vite proxy

export const getApiBase = () => API_BASE;

const buildUrl = (url, options = {}) => {
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url = `${url}?${searchParams.toString()}`;
    delete options.params;
  }
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
};

export const apiFetch = async (url, options = {}) => {
  const headers = getAuthHeaders();
  const fullUrl = buildUrl(url, options);
  const isJsonBody = options.body && !(options.body instanceof FormData) && typeof options.body === 'string';
  
  const fetchOptions = {
    ...options,
    headers: {
      ...headers,
      ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  };
  
  if (options.body instanceof FormData) {
    delete fetchOptions.headers['Content-Type'];
  }
  
  return fetch(fullUrl, fetchOptions);
};

const api = {
  get: async (url, options = {}) => {
    const res = await apiFetch(url, { method: 'GET', ...options });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    return { ok: true, data, status: res.status };
  },
  post: async (url, body, options = {}) => {
    const res = await apiFetch(url, { method: 'POST', body: JSON.stringify(body), ...options });
    if (!res.ok) return { ok: false, status: res.status, data: {} };
    const data = await res.json().catch(() => ({}));
    return { ok: true, data, status: res.status };
  },
  put: async (url, body, options = {}) => {
    const res = await apiFetch(url, { method: 'PUT', body: JSON.stringify(body), ...options });
    if (!res.ok) return { ok: false, status: res.status, data: {} };
    const data = await res.json().catch(() => ({}));
    return { ok: true, data, status: res.status };
  },
  delete: async (url, options = {}) => {
    const res = await apiFetch(url, { method: 'DELETE', ...options });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json().catch(() => ({}));
    return { ok: true, data, status: res.status };
  },
};

export default api;

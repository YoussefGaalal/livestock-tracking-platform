// Use relative URLs so the frontend works on any domain (local dev proxy + production same-origin).
const API_BASE = '';

/**
 * Build headers for every API request.
 * Reads the Bearer token stored at login and injects it automatically.
 */
export const getAuthHeaders = () => {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('oasis_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const apiFetch = async (url, options = {}) => {
  const headers = getAuthHeaders();
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  const fetchOptions = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  };

  // Don't set Content-Type for FormData — browser sets it with the boundary.
  if (options.body instanceof FormData) {
    delete fetchOptions.headers['Content-Type'];
  }

  return fetch(fullUrl, fetchOptions);
};

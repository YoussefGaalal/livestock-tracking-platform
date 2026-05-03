export const getAuthHeaders = () => {
  const userStr = localStorage.getItem('oasis_user');
  const headers = {
    'Accept': 'application/json',
  };
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        headers['X-User-Id'] = String(user.id);
        headers['X-User-Role'] = user.role || 'Owner';
      }
    } catch (e) {
      console.error('Failed to parse user:', e);
    }
  }
  
  return headers;
};

const API_BASE = 'http://localhost:8050';

export const apiFetch = async (url, options = {}) => {
  const headers = getAuthHeaders();
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  
  const fetchOptions = {
    ...options,
    headers: {
      ...headers,
    },
  };
  
  if (options.body instanceof FormData) {
    delete fetchOptions.headers['Content-Type'];
  } else if (options.headers) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      ...options.headers,
    };
  }
  
  return fetch(fullUrl, fetchOptions);
};

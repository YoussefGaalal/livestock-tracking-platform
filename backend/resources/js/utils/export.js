import { getAuthHeaders } from './api';

const API_BASE = 'http://localhost:8050';

export const exportData = async (endpoint, filename) => {
  try {
    const userStr = localStorage.getItem('oasis_user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const headers = {};
    
    if (user) {
      headers['X-User-Id'] = String(user.id);
      headers['X-User-Role'] = user.role || 'Owner';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export error:', error);
    return false;
  }
};

export const exportDatabase = async () => {
  try {
    const userStr = localStorage.getItem('oasis_user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const headers = {};
    
    if (user) {
      headers['X-User-Id'] = String(user.id);
      headers['X-User-Role'] = user.role || 'Owner';
    }

    const response = await fetch(`${API_BASE}/api/export/database`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oasis_database_${new Date().toISOString().split('T')[0]}.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Database export error:', error);
    return false;
  }
};

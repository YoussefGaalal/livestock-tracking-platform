import { getAuthUser } from './storage';
import api from './api';

export const exportData = async (endpoint, filename) => {
  try {
    const res = await api.get(endpoint);
    
    if (!res.ok) {
      throw new Error('Export failed');
    }

    const blob = await res.blob();
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
    const res = await api.get('/api/export/database');
    
    if (!res.ok) {
      throw new Error('Export failed');
    }

    const blob = await res.blob();
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

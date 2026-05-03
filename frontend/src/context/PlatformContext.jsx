import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const PlatformContext = createContext();

export function PlatformProvider({ children }) {
  const [platformName, setPlatformName] = useState('The Oasis');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlatformName = async () => {
      try {
        const res = await api.get('/api/admin/settings/general');
        if (res.ok) {
          const data = res.data;
          if (data?.data?.platform_name) {
            setPlatformName(data.data.platform_name);
            document.title = data.data.platform_name;
          }
        }
      } catch (error) {
        console.error('Failed to fetch platform name:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlatformName();
  }, []);

  const refreshPlatformName = async () => {
    try {
      const res = await api.get('/api/admin/settings/general');
      if (res.ok) {
        const data = res.data;
        if (data?.data?.platform_name) {
          setPlatformName(data.data.platform_name);
          document.title = data.data.platform_name;
        }
      }
    } catch (error) {
      console.error('Failed to refresh platform name:', error);
    }
  };

  return (
    <PlatformContext.Provider value={{ platformName, loading, refreshPlatformName }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}

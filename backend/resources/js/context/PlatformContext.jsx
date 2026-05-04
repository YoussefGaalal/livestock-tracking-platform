import { createContext, useContext, useState, useEffect } from 'react';

const PlatformContext = createContext();

export function PlatformProvider({ children }) {
  const [platformName, setPlatformName] = useState('The Oasis');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlatformName = async () => {
      try {
        const res = await fetch('/api/admin/settings/general', {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data?.platform_name) {
            setPlatformName(data.data.platform_name);
            document.title = data.data.platform_name;
          }
        }
      } catch (error) {
        // Non-fatal — default name stays
        console.warn('Could not fetch platform name:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlatformName();
  }, []);

  const refreshPlatformName = async () => {
    try {
      const res = await fetch('/api/admin/settings/general', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.platform_name) {
          setPlatformName(data.data.platform_name);
          document.title = data.data.platform_name;
        }
      }
    } catch (error) {
      console.warn('Could not refresh platform name:', error);
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

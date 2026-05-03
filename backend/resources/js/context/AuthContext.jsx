import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({ user: null, isAuthenticated: false, login: async () => false, logout: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('oasis_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('oasis_user') !== null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('oasis_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('oasis_user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8050/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user || { id: 0, email, name: 'User', role: 'Admin', phone: null });
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('oasis_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

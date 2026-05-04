import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('oasis_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('oasis_token');
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
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store BOTH the user profile and the Bearer token
        const userData = data.user || { id: 0, email, name: 'User', role: 'Admin', phone: null };
        setUser(userData);
        setIsAuthenticated(true);
        if (data.token) {
          localStorage.setItem('oasis_token', data.token);
        }
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
    localStorage.removeItem('oasis_token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthUser, setAuthUser, setAuthToken, setUserRole, clearAuth, getAuthToken } from '../utils/cookies';
import { apiFetch } from '../utils/api';

export const AuthContext = createContext({ user: null, isAuthenticated: false, login: async () => false, logout: () => {}, getMe: async () => null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getAuthUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => getAuthUser() !== null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setAuthUser(user);
    } else {
      clearAuth();
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Login failed response:', response.status, errorData);
        return false;
      }

      const data = await response.json();
      console.log('Login success:', data);

      if (data.user) {
        const userRole = data.user.role || data.user.roles?.[0] || 'Owner';
        const userWithRole = { ...data.user, role: userRole };

        setUser(userWithRole);
        setAuthUser(userWithRole);
        setUserRole(userRole);
      } else {
        const defaultUser = { id: 0, email, name: 'User', role: 'Admin', phone: null };
        setUser(defaultUser);
        setAuthUser(defaultUser);
        setUserRole('Admin');
      }
      if (data.token) {
        setAuthToken(data.token);
      }
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getMe = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          const userRole = data.role || data.roles?.[0] || 'Owner';
          const userWithRole = { ...data, role: userRole };
          setUser(userWithRole);
          setAuthUser(userWithRole);
          setUserRole(userRole);
          setIsAuthenticated(true);
          return userWithRole;
        }
      }
    } catch (error) {
      console.error('Get me error:', error);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setIsAuthenticated(false);
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, getMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, loading, navigate]);
  
  return { isAuthenticated, loading };
}

export function useRequireRole(roles) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const hasRole = user?.role && roles.includes(user.role);
  
  useEffect(() => {
    if (!loading && user && !hasRole) {
      navigate('/403');
    }
  }, [user, loading, hasRole, navigate]);
  
  return { hasRole, loading, userRole: user?.role };
}
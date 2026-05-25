import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, authHeader } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);

  const headers = useMemo(() => authHeader(token), [token]);

  const syncSession = async () => {
    if (!token) {
      setIsAuthReady(true);
      return;
    }

    try {
      const data = await apiRequest('/api/auth/me', { headers });
      setUser(data.user);
      setStatus(`Welcome back, ${data.user.name}`);
    } catch {
      localStorage.removeItem('token');
      setToken('');
      setUser(null);
      setStatus('Session expired. Please login again.');
    } finally {
      setIsAuthReady(true);
    }
  };

  useEffect(() => {
    syncSession();
  }, [token]);

  const login = async ({ email, password }) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setIsAuthReady(true);
    setStatus('Logged in successfully');
    return data;
  };

  const register = async ({ name, email, password, role }) => {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setIsAuthReady(true);
    setStatus('Account created successfully');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setIsAuthReady(true);
    setStatus('Logged out');
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, status, setStatus, headers, login, register, logout, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

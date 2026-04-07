import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/utils/axiosConfig';

const AuthContext = createContext(null);

const BACKEND_URL = 'https://unevaporative-holden-unvatted.ngrok-free.dev';
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [privateKey, setPrivateKey] = useState(localStorage.getItem('privateKey'));
  const [loading, setLoading] = useState(true);

  const checkSessionAuth = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${API}/me`, {
        withCredentials: true
      });
      setUser(response.data);
      
      const keyResponse = await axiosInstance.get(`${API}/me/private-key`, {
        withCredentials: true
      });
      setPrivateKey(keyResponse.data.private_key);
      localStorage.setItem('privateKey', keyResponse.data.private_key);
    } catch (error) {
      // Not authenticated via session cookie
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      
      const keyResponse = await axiosInstance.get(`${API}/me/private-key`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrivateKey(keyResponse.data.private_key);
      localStorage.setItem('privateKey', keyResponse.data.private_key);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Don't call logout here to avoid circular dependency
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=') || window.location.pathname === '/auth/callback') {
      setLoading(false);
      return;
    }
    
    // Check for user in localStorage first (from AuthCallback)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    
    // Check if user is authenticated via session cookie or JWT token
    if (token) {
      fetchCurrentUser();
    } else {
      checkSessionAuth();
    }
  }, [token, fetchCurrentUser, checkSessionAuth]);

  const login = async (email, password) => {
    const response = await axiosInstance.post(`${API}/auth/login`, { email, password });
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
    
    const keyResponse = await axiosInstance.get(`${API}/me/private-key`, {
      headers: { Authorization: `Bearer ${response.data.token}` }
    });
    setPrivateKey(keyResponse.data.private_key);
    localStorage.setItem('privateKey', keyResponse.data.private_key);
    
    return response.data;
  };

  const register = async (name, email, phone, password, role = 'student') => {
    const response = await axiosInstance.post(`${API}/auth/register`, {
      name,
      email,
      phone,
      password,
      role
    });
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
    
    const keyResponse = await axiosInstance.get(`${API}/me/private-key`, {
      headers: { Authorization: `Bearer ${response.data.token}` }
    });
    setPrivateKey(keyResponse.data.private_key);
    localStorage.setItem('privateKey', keyResponse.data.private_key);
    
    return response.data;
  };

  const logout = async () => {
    try {
      await axiosInstance.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setToken(null);
    setUser(null);
    setPrivateKey(null);
    localStorage.removeItem('token');
    localStorage.removeItem('privateKey');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, privateKey, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
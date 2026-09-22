import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../services/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore token and user on initial mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token') || localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          // Optionally sync fresh user profile in background
          try {
            const meRes = await authApi.getMe();
            if (meRes?.data?.user) {
              setUser(meRes.data.user);
              localStorage.setItem('user', JSON.stringify(meRes.data.user));
            }
          } catch (syncErr) {
            // If token expired (401), localStorage is already cleared by api interceptor
            if (syncErr.response?.status === 401) {
              setUser(null);
              setToken(null);
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore auth session:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('access_token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        return res.data.user;
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
    return null;
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = Boolean(user && (user.role === 'ADMIN' || user.role === 'MODERATOR'));
  const isSeller = Boolean(user && (user.role === 'SELLER' || user.role === 'VERIFIED_SELLER'));
  const isBuyer = Boolean(user && user.role === 'BUYER');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isSeller,
        isBuyer,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

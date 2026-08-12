'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { decodeJwt, JwtUser } from './jwt';
import api from './api';

interface AuthContextType {
  user: JwtUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUserFromToken = async () => {
    const token = Cookies.get('accessToken');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded) {
        setUser((prev) => (prev ? { ...prev, ...decoded } : decoded));
      }
      // Fetch full profile in the background without blocking the initial render
      api.get('/auth/me')
        .then((response) => {
          setUser(response.data.data || response.data);
        })
        .catch((err) => {
          console.error('Failed to load user profile from api in background:', err);
        });
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      await loadUserFromToken();
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const COOKIE_OPTIONS = {
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
  };

  const login = async (accessToken: string, refreshToken: string) => {
    Cookies.set('accessToken', accessToken, COOKIE_OPTIONS);
    Cookies.set('refreshToken', refreshToken, COOKIE_OPTIONS);
    await loadUserFromToken();
    window.location.href = '/dashboard';
  };

  const logout = () => {
    Cookies.remove('accessToken', COOKIE_OPTIONS);
    Cookies.remove('refreshToken', COOKIE_OPTIONS);
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    await loadUserFromToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

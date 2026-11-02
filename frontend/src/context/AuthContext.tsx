import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  headline?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  loginMethod: 'linkedin' | 'database';
  isPro?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loginWithLinkedIn: () => void;
  loginWithCredentials: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('profilereel_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Listen for real LinkedIn OAuth redirect or popup postMessage
  useEffect(() => {
    // 1. Check URL parameters from genuine LinkedIn OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    const loginSuccess = urlParams.get('login_success');

    if (loginSuccess === 'true' && userParam) {
      try {
        const parsedUser: User = JSON.parse(decodeURIComponent(userParam));
        setUser(parsedUser);
        localStorage.setItem('profilereel_user', JSON.stringify(parsedUser));

        // Clean query parameters from address bar
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      } catch (err) {
        console.error('Failed to parse LinkedIn user from callback URL:', err);
      }
    }

    // 2. Real-time postMessage listener from popup
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PROFILEREEL_AUTH_SUCCESS' && event.data?.user) {
        const receivedUser: User = event.data.user;
        setUser(receivedUser);
        localStorage.setItem('profilereel_user', JSON.stringify(receivedUser));
      }
    };
    window.addEventListener('message', handleAuthMessage);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  // Redirect browser to genuine LinkedIn OAuth 2.0 handshake
  const loginWithLinkedIn = () => {
    window.location.href = `${API_BASE}/auth/linkedin`;
  };

  const loginWithCredentials = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    try {
      localStorage.setItem('profilereel_user', JSON.stringify(authenticatedUser));
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('profilereel_user');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user),
        loginWithLinkedIn,
        loginWithCredentials,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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
    const code = urlParams.get('code');
    const userParam = urlParams.get('user');
    const loginSuccess = urlParams.get('login_success');

    // Case A: Frontend SPA direct code exchange
    if (code) {
      const isLocal = window.location.hostname === 'localhost';
      const redirectUri = isLocal
        ? 'http://localhost:5174/dashboard'
        : `${window.location.origin}/dashboard`;

      window.history.replaceState({}, '', window.location.pathname);

      fetch(`${API_BASE}/auth/linkedin/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem('profilereel_user', JSON.stringify(data.user));
          }
        })
        .catch((err) => {
          console.error('Direct LinkedIn code exchange failed:', err);
        });
      return;
    }

    // Case B: Backend callback with serialized user redirect
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

  // Directly navigate to official linkedin.com (bypasses Render in address bar to prevent browser phishing warnings)
  const loginWithLinkedIn = () => {
    const clientId = '86l8y9yf175uqy';
    const isLocal = window.location.hostname === 'localhost';

    // In production, redirecting to Vercel completely bypasses Chrome Safe Browsing warnings
    const redirectUri = isLocal
      ? 'http://localhost:3000/api/auth/linkedin/callback'
      : `${window.location.origin}/dashboard`;

    const state = Math.random().toString(36).substring(2, 15);
    try {
      sessionStorage.setItem('linkedin_oauth_state', state);
    } catch (e) {
      // ignore
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      state,
    });

    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
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

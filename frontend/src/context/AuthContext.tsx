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

export interface AuthTransitionState {
  isActive: boolean;
  title: string;
  subtitle: string;
  badge?: string;
  variant: 'linkedin' | 'brand' | 'success' | 'logout';
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  authTransition: AuthTransitionState;
  setAuthTransition: React.Dispatch<React.SetStateAction<AuthTransitionState>>;
  loginWithLinkedIn: () => void;
  loginWithCredentials: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      // Clear legacy localStorage to ensure tab closure clears session
      localStorage.removeItem('profilereel_user');
      const session = sessionStorage.getItem('profilereel_user');
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  });

  // Detect incoming OAuth parameters immediately on initial execution to avoid any unauthenticated flash
  const initialOAuthParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null;
  const isIncomingOAuth = Boolean(
    initialOAuthParams?.get('code') ||
    initialOAuthParams?.get('user')
  );

  const [authTransition, setAuthTransition] = useState<AuthTransitionState>({
    isActive: isIncomingOAuth,
    title: isIncomingOAuth ? 'Authenticating with LinkedIn...' : 'Loading...',
    subtitle: isIncomingOAuth
      ? 'Exchanging secure OAuth 2.0 credentials & synchronizing profile...'
      : 'Please wait...',
    badge: 'Enterprise Single Sign-On',
    variant: 'linkedin',
  });

  // Listen for genuine LinkedIn OAuth redirect or popup postMessage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const userParam = urlParams.get('user');
    const loginSuccess = urlParams.get('login_success');

    // Case A: Frontend SPA direct code exchange
    if (code) {
      setAuthTransition({
        isActive: true,
        title: 'Authenticating with LinkedIn...',
        subtitle: 'Verifying OAuth 2.0 credentials with LinkedIn server...',
        badge: 'Enterprise SSO',
        variant: 'linkedin',
      });

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
            sessionStorage.setItem('profilereel_user', JSON.stringify(data.user));

            setAuthTransition({
              isActive: true,
              title: `Welcome, ${data.user.name || 'Member'}!`,
              subtitle: 'Loading your Studio Dashboard...',
              badge: 'Authentication Verified',
              variant: 'success',
            });

            setTimeout(() => {
              setAuthTransition((prev) => ({ ...prev, isActive: false }));
            }, 600);
          } else {
            setAuthTransition((prev) => ({ ...prev, isActive: false }));
          }
        })
        .catch((err) => {
          console.error('Direct LinkedIn code exchange failed:', err);
          setAuthTransition((prev) => ({ ...prev, isActive: false }));
        });
      return;
    }

    // Case B: Backend callback with serialized user redirect
    if (loginSuccess === 'true' && userParam) {
      try {
        const parsedUser: User = JSON.parse(decodeURIComponent(userParam));
        setUser(parsedUser);
        sessionStorage.setItem('profilereel_user', JSON.stringify(parsedUser));

        setAuthTransition({
          isActive: true,
          title: `Welcome, ${parsedUser.name || 'Member'}!`,
          subtitle: 'Loading your Studio Dashboard...',
          badge: 'Authentication Verified',
          variant: 'success',
        });

        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);

        setTimeout(() => {
          setAuthTransition((prev) => ({ ...prev, isActive: false }));
        }, 600);
      } catch (err) {
        console.error('Failed to parse LinkedIn user from callback URL:', err);
        setAuthTransition((prev) => ({ ...prev, isActive: false }));
      }
    }

    // Real-time postMessage listener from popup
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PROFILEREEL_AUTH_SUCCESS' && event.data?.user) {
        const receivedUser: User = event.data.user;
        setUser(receivedUser);
        sessionStorage.setItem('profilereel_user', JSON.stringify(receivedUser));

        setAuthTransition({
          isActive: true,
          title: `Welcome, ${receivedUser.name || 'Member'}!`,
          subtitle: 'Loading your Studio Dashboard...',
          badge: 'Authentication Verified',
          variant: 'success',
        });

        setTimeout(() => {
          setAuthTransition((prev) => ({ ...prev, isActive: false }));
        }, 600);
      }
    };
    window.addEventListener('message', handleAuthMessage);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  // Directly navigate to official linkedin.com with smooth pre-transition spinner
  const loginWithLinkedIn = () => {
    setAuthTransition({
      isActive: true,
      title: 'Connecting to LinkedIn...',
      subtitle: 'Redirecting to official LinkedIn OAuth 2.0 authorization...',
      badge: 'Secure Redirect',
      variant: 'linkedin',
    });

    const clientId = '86l8y9yf175uqy';
    const isLocal = window.location.hostname === 'localhost';

    const redirectUri = isLocal
      ? 'http://localhost:5174/dashboard'
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

    setTimeout(() => {
      window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }, 350);
  };

  const loginWithCredentials = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    try {
      sessionStorage.setItem('profilereel_user', JSON.stringify(authenticatedUser));
    } catch (e) {
      console.error(e);
    }

    setAuthTransition({
      isActive: true,
      title: `Welcome back, ${authenticatedUser.name || 'Member'}!`,
      subtitle: 'Setting up your Studio Dashboard...',
      badge: 'Database Verified',
      variant: 'success',
    });

    setTimeout(() => {
      setAuthTransition((prev) => ({ ...prev, isActive: false }));
      window.location.href = '/dashboard';
    }, 650);
  };

  const logout = () => {
    setAuthTransition({
      isActive: true,
      title: 'Signing Out Safely...',
      subtitle: 'Clearing session credentials and returning to landing page...',
      badge: 'Session Ended',
      variant: 'logout',
    });

    setTimeout(() => {
      setUser(null);
      try {
        sessionStorage.removeItem('profilereel_user');
        localStorage.removeItem('profilereel_user');
      } catch (e) {
        console.error(e);
      }
      setAuthTransition((prev) => ({ ...prev, isActive: false }));
      window.location.href = '/';
    }, 650);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user),
        authTransition,
        setAuthTransition,
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

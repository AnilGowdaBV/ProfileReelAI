import React, { useState, useEffect } from 'react';
import { X, Shield, ArrowRight, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithLinkedIn, loginWithCredentials } = useAuth();
  const [activeTab, setActiveTab] = useState<'linkedin' | 'email'>('linkedin');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-refresh and reset form every time modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      setActiveTab('linkedin');
      setIsRegisterMode(false);
      setName('');
      setEmail('');
      setPassword('');
      setIsSubmitting(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleModalClose = () => {
    setErrorMsg(null);
    setName('');
    setEmail('');
    setPassword('');
    setIsSubmitting(false);
    setIsRegisterMode(false);
    onClose();
  };

  const handleTabSwitch = (tab: 'linkedin' | 'email') => {
    setActiveTab(tab);
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const endpoint = isRegisterMode ? `${API_BASE}/auth/register` : `${API_BASE}/auth/login`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed. Please verify credentials.');
      }

      loginWithCredentials({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || 'Member',
        headline: data.user.headline || 'Verified Member',
        avatarUrl: data.user.avatarUrl,
        isPro: data.user.isPro,
        loginMethod: 'database',
      });

      handleModalClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate with database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleModalClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 text-slate-900 dark:text-white">
        
        {/* Close Button */}
        <button
          onClick={handleModalClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0A66C2]/10 border border-[#0A66C2]/20 mb-3 shadow-md shadow-[#0A66C2]/15">
            <svg className="w-7 h-7 text-[#0A66C2] fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </div>

          <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">
            Sign In to ProfileReel AI
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Official OAuth 2.0 OpenID Connect &amp; Secure Cloud Database login.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabSwitch('linkedin')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'linkedin'
                ? 'bg-white dark:bg-charcoal-800 text-[#0A66C2] dark:text-[#38bdf8] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            LinkedIn OAuth
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('email')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white dark:bg-charcoal-800 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Database Login
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Genuine LinkedIn OAuth */}
        {activeTab === 'linkedin' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={loginWithLinkedIn}
              className="w-full py-4 px-4 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-extrabold text-sm shadow-xl shadow-[#0A66C2]/25 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span>Continue with LinkedIn</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed text-center">
              🔒 Redirects to official <strong>linkedin.com</strong> authorization screen. Your profile picture, verified name, and email will be securely synchronized.
            </div>
          </div>
        )}

        {/* Tab 2: Database Email / Password Authentication */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {isRegisterMode && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Anil BV"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isRegisterMode ? 'Create Database Account' : 'Sign In with Database'}</span>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setErrorMsg(null);
                }}
                className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer"
              >
                {isRegisterMode
                  ? 'Already have an account? Sign In'
                  : "Don't have an account yet? Create one"}
              </button>
            </div>
          </form>
        )}

        {/* Security & Privacy Notice */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 text-center">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>OAuth 2.0 SSL • Secure Normalized Auth</span>
        </div>
      </div>
    </div>
  );
};

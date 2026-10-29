import React from 'react';
import { Film, Database, CheckCircle, AlertCircle, Zap, Sun, Moon } from 'lucide-react';
import { HealthStatus } from '../types/candidate';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  health?: HealthStatus;
  isPro?: boolean;
  onOpenSubscribeModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  isPro = false,
  onOpenSubscribeModal,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/5 bg-white/80 dark:bg-charcoal-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent p-0.5 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-white dark:bg-charcoal-950 rounded-[10px] flex items-center justify-center transition-colors">
              <Film className="w-5 h-5 text-brand-500 dark:text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                ProfileReel AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              One profile. One AI. One powerful story.
            </p>
          </div>
        </div>

        {/* Navigation Links, Theme Toggle & Pro Action */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#career-hub" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
              ⚡ 45+ Verified Roles
            </a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
              Pricing Plans
            </a>
          </nav>

          {/* Database Health Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">MySQL:</span>
            {health?.database.connected ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                <AlertCircle className="w-3 h-3" /> Offline
              </span>
            )}
          </div>

          {/* Light / Dark Mode Toggle Switch */}
          <button
            type="button"
            id="theme-toggle-button"
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200/80 dark:bg-charcoal-900 dark:hover:bg-charcoal-800 text-slate-700 dark:text-slate-300 shadow-sm flex items-center justify-center"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700 hover:text-indigo-600 transition-colors" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
            )}
          </button>

          {/* Pro Action Button */}
          {onOpenSubscribeModal && (
            <button
              type="button"
              onClick={onOpenSubscribeModal}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isPro
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 shadow-emerald-500/10'
                  : 'bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-brand-500/25'
              }`}
            >
              {isPro ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>PRO ACTIVE</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Upgrade to Pro 👑</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

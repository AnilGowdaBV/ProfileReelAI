import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BeInterviewerModal } from './BeInterviewerModal';
import { AddCourseButton } from './AddCourseButton';
import { Film, Database, CheckCircle, AlertCircle, Zap, Sun, Moon, LogOut } from 'lucide-react';
import { HealthStatus } from '../types/candidate';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  health?: HealthStatus;
  isPro?: boolean;
  onOpenSubscribeModal?: () => void;
  hasScore?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  isPro = false,
  onOpenSubscribeModal,
  hasScore = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [interviewerOpen, setInterviewerOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(user?.avatarUrl || '');

  useEffect(() => {
    if (!user?.email) return;
    if (user.avatarUrl) {
      setPhotoUrl(user.avatarUrl);
      return;
    }
    let cancelled = false;
    api.interviewerStatus(user.email).then(async (row) => {
      if (cancelled) return;
      if (row.photoUrl) {
        setPhotoUrl(row.photoUrl);
        return;
      }
      const photo = await api.candidatePhoto(user.email);
      if (!cancelled && photo.photoUrl) setPhotoUrl(photo.photoUrl);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [user?.email, user?.avatarUrl]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 dark:border-white/5 bg-white/90 dark:bg-charcoal-950/80 backdrop-blur-xl transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2">
        
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-2 md:gap-3 group cursor-pointer">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 opacity-60 blur-xs group-hover:opacity-100 transition-opacity" />
            <img
              src="/logo.jpg"
              alt="ProfileReel AI"
              className="relative h-8 w-8 md:w-9 md:h-9 rounded-xl object-cover shadow-md border border-slate-200/50 dark:border-white/20 group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="truncate whitespace-nowrap font-extrabold text-sm md:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-indigo-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
            ProfileReel AI
          </span>
        </div>

        {/* Navigation Links, Theme Toggle & Pro Action */}
        <div className="flex shrink-0 items-center gap-1 md:gap-2.5">
          <AddCourseButton label="Course" submittedBy={user?.name || user?.email || ''} className="md:hidden px-2 py-1 rounded-lg text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10" />
          <button type="button" onClick={() => setInterviewerOpen(true)} className="md:hidden px-2 py-1 rounded-lg text-[10px] font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10">
            Interview
          </button>
          <nav className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {hasScore && (
              <a href="#career-hub" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-brand-600 dark:hover:text-white transition-all">
                ⚡ 15 Verified Roles
              </a>
            )}
            <button type="button" onClick={() => setInterviewerOpen(true)} className="px-3 py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 text-violet-700 dark:text-violet-300 transition-all">
              Be an interviewer
            </button>
            <AddCourseButton submittedBy={user?.name || user?.email || ''} className="px-3 py-1.5 rounded-lg text-emerald-700 transition-all hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10" />
          </nav>

          {/* Database Health Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 shadow-xs text-xs">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300">MySQL:</span>
            {health?.database.connected ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                <AlertCircle className="w-3 h-3" /> Offline
              </span>
            )}
          </div>

          {/* Light / Dark Mode Toggle Switch */}
          <button
            type="button"
            id="theme-toggle-button"
            onClick={toggleTheme}
            className="hidden md:flex p-2 rounded-xl transition-all cursor-pointer border border-slate-200 hover:border-slate-300 dark:border-white/10 bg-white hover:bg-slate-100 dark:bg-charcoal-900 dark:hover:bg-charcoal-800 text-slate-700 dark:text-slate-300 shadow-xs hover:shadow-sm items-center justify-center"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700 hover:text-brand-600 transition-colors" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
            )}
          </button>

          {/* Pro Action Button */}
          {onOpenSubscribeModal && (
            <button
              type="button"
              onClick={onOpenSubscribeModal}
              className={`hidden md:flex px-3.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isPro
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 shadow-emerald-500/10'
                  : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-brand-500/25 hover:shadow-brand-500/40 transform hover:scale-[1.02] active:scale-[0.98]'
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

          {/* User Profile Pill & Log Out */}
          {user && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 md:w-10 md:h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center text-xs font-bold">
                    {user.name ? user.name.substring(0, 2).toUpperCase() : 'IN'}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
                  {user.name}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer text-xs"
                title="Log Out to Landing Page"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <BeInterviewerModal open={interviewerOpen} onClose={() => setInterviewerOpen(false)} />
    </header>
  );
};

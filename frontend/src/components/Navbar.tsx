import React from 'react';
import { Film, Sparkles, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { HealthStatus } from '../types/candidate';

interface NavbarProps {
  health?: HealthStatus;
}

export const Navbar: React.FC<NavbarProps> = ({ health }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-charcoal-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent p-0.5 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-charcoal-950 rounded-[10px] flex items-center justify-center">
              <Film className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ProfileReel AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Phase 1
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              One profile. One AI. One powerful story.
            </p>
          </div>
        </div>

        {/* Database & System Health Pill */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">MySQL 8.4:</span>
            {health?.database.connected ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                <AlertCircle className="w-3 h-3" /> Offline
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-medium">Mock Provider Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};

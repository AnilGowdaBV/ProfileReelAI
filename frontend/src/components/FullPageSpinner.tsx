import React from 'react';

export interface FullPageSpinnerProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  variant?: 'linkedin' | 'brand' | 'success' | 'logout';
}

export const FullPageSpinner: React.FC<FullPageSpinnerProps> = ({
  title = 'Loading...',
  subtitle = 'Please wait while we process your request',
  badge = 'ProfileReel AI Studio',
  variant = 'brand',
}) => {
  const gradientStops = {
    linkedin: {
      from: '#0A66C2',
      via: '#3b82f6',
      to: '#6366f1',
      glow: 'from-blue-600/30 via-indigo-600/30 to-blue-500/20',
    },
    brand: {
      from: '#4f46e5',
      via: '#6366f1',
      to: '#a855f7',
      glow: 'from-brand-600/30 via-indigo-600/30 to-purple-600/25',
    },
    logout: {
      from: '#e11d48',
      via: '#f43f5e',
      to: '#8b5cf6',
      glow: 'from-rose-600/30 via-pink-600/25 to-purple-600/20',
    },
    success: {
      from: '#10b981',
      via: '#059669',
      to: '#6366f1',
      glow: 'from-emerald-600/30 via-teal-600/25 to-indigo-600/20',
    },
  }[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/80 dark:bg-[#070b14]/90 backdrop-blur-2xl transition-all duration-300 animate-fade-in"
    >
      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        {/* Ambient Pulsing Glow behind the Spinner */}
        <div
          className={`absolute -top-12 w-64 h-64 bg-gradient-to-r ${gradientStops.glow} rounded-full blur-3xl opacity-70 animate-pulse pointer-events-none`}
        />

        {/* Central Spinner Apparatus */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          {/* Outer Track */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-200/20 dark:border-white/10" />

          {/* Smooth Hardware-Accelerated SVG Spinner */}
          <svg
            className="w-full h-full animate-spin transition-all duration-700"
            viewBox="0 0 96 96"
            fill="none"
            style={{ animationDuration: '1.2s' }}
          >
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke={`url(#spinner-gradient-${variant})`}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="180"
              strokeDashoffset="75"
            />
            <defs>
              <linearGradient id={`spinner-gradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientStops.from} />
                <stop offset="50%" stopColor={gradientStops.via} />
                <stop offset="100%" stopColor={gradientStops.to} />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered Brand Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl p-1 bg-white dark:bg-charcoal-900 shadow-xl border border-white/20 flex items-center justify-center overflow-hidden">
              <img
                src="/logo.jpg"
                alt="ProfileReel AI"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 dark:bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-200 dark:text-slate-300 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>{badge}</span>
          </div>
        )}

        {/* Animated Title */}
        <h3 className="text-xl font-extrabold tracking-tight text-white mb-2">
          {title}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed max-w-xs">
            {subtitle}
          </p>
        )}

        {/* Animated Progress Indicator Dots */}
        <div className="flex items-center gap-1.5 mt-6">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

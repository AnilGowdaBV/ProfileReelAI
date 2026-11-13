import React from 'react';

export function holdMin(startedAt: number, minMs = 480) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, Math.max(0, minMs - (Date.now() - startedAt)));
  });
}

export const SectionSpinner: React.FC<{
  label?: string;
  dark?: boolean;
  overlay?: boolean;
  compact?: boolean;
}> = ({ label = 'Loading', dark = false, overlay = false, compact = false }) => {
  const size = compact ? 'h-8 w-8' : 'h-12 w-12';
  const inner = (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <span className={`relative grid place-items-center ${size}`}>
        <span className={`absolute inset-0 rounded-full border-2 ${dark ? 'border-white/10' : 'border-violet-100'}`} />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500 border-r-fuchsia-400" />
      </span>
      {label && (
        <p className={`${compact ? 'text-xs' : 'text-sm'} font-bold ${dark ? 'text-slate-200' : 'text-slate-600'}`}>
          {label}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div
        className={`absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px] ${
          dark ? 'bg-[#070b16]/80' : 'bg-[#f4f2fb]/85'
        }`}
      >
        {inner}
      </div>
    );
  }

  return <div className={compact ? 'flex justify-center py-8' : 'flex justify-center py-16'}>{inner}</div>;
};

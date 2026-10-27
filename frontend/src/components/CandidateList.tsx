import React from 'react';
import { Candidate } from '../types/candidate';
import { StatusBadge } from './StatusBadge';
import { User, ChevronRight, Clock, FileText } from 'lucide-react';

interface CandidateListProps {
  candidates: Candidate[];
  selectedId?: string;
  onSelect: (candidate: Candidate) => void;
  isLoading: boolean;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  selectedId,
  onSelect,
  isLoading,
}) => {
  if (isLoading && candidates.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-400 text-sm animate-pulse">
        Loading recent candidates...
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-charcoal-850 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-300">No candidates analyzed yet</p>
        <p className="text-xs text-slate-500 mt-1">
          Paste a LinkedIn profile URL or choose one of the preset fixtures above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>Analyzed Candidates</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300">
            {candidates.length}
          </span>
        </h3>
        <span className="text-xs text-slate-400">Click to view facts</span>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {candidates.map((cand) => {
          const isSelected = cand.id === selectedId;
          const formattedDate = new Date(cand.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <button
              key={cand.id}
              onClick={() => onSelect(cand)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-brand-500/10 border-brand-500/40 shadow-md shadow-brand-500/10'
                  : 'bg-charcoal-900/60 hover:bg-charcoal-900 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-brand-600 text-white' : 'bg-charcoal-800 text-slate-400'
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {cand.displayName || 'Candidate Profile'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {cand.normalizedProfileUrl.replace('https://www.linkedin.com/in/', '')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={cand.retrievalStatus} />
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formattedDate}
                  </span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 ${
                    isSelected ? 'text-brand-400' : 'text-slate-600'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

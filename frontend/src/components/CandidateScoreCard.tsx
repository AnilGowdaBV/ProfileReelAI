import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { CandidateScore, ScoreTier } from '../types/candidate';

interface CandidateScoreCardProps {
  score: CandidateScore | null;
  isLoading: boolean;
  onRefreshScore: () => void;
  candidateName?: string;
}

export const CandidateScoreCard: React.FC<CandidateScoreCardProps> = ({
  score,
  isLoading,
  onRefreshScore,
  candidateName,
}) => {
  if (isLoading && !score) {
    return (
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-sm text-slate-300 font-medium">
          Evaluating profile intelligence & computing score...
        </p>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="glass-panel rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">
            Candidate Profile Score
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Analyze this candidate's verified career trajectory, skill depth, educational credentials, and business impact.
          </p>
        </div>
        <button
          onClick={onRefreshScore}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-accent hover:from-brand-500 hover:to-brand-accent text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Generate AI Profile Score</span>
        </button>
      </div>
    );
  }

  const { overallScore, tier, tierLabel, breakdown, keyStrengths, growthAreas, recommendedRoles } =
    score;

  // Colors based on score tier
  const getTierConfig = (tier: ScoreTier) => {
    switch (tier) {
      case 'EXCEPTIONAL':
        return {
          textColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          strokeColor: '#34d399',
          gradientId: 'grad-exceptional',
          badgeText: 'Top 5% Candidate',
        };
      case 'STRONG':
        return {
          textColor: 'text-cyan-400',
          bgColor: 'bg-cyan-500/10',
          borderColor: 'border-cyan-500/30',
          strokeColor: '#22d3ee',
          gradientId: 'grad-strong',
          badgeText: 'Highly Qualified',
        };
      case 'PROFICIENT':
        return {
          textColor: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          strokeColor: '#fbbf24',
          gradientId: 'grad-proficient',
          badgeText: 'Solid Foundation',
        };
      case 'DEVELOPING':
      default:
        return {
          textColor: 'text-slate-400',
          bgColor: 'bg-slate-500/10',
          borderColor: 'border-slate-500/30',
          strokeColor: '#94a3b8',
          gradientId: 'grad-developing',
          badgeText: 'Developing Profile',
        };
    }
  };

  const tierConfig = getTierConfig(tier);
  const activenessDimension = breakdown.activeness ?? breakdown.impact ?? {
    score: 0,
    max: 2.0,
    description: 'LinkedIn engagement',
  };

  // SVG Radial circle calculations (10-point scale)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(10, Math.max(0, Number(overallScore) || 0));
  const strokeDashoffset = circumference - (normalizedScore / 10) * circumference;

  return (
    <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 relative overflow-hidden space-y-6">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>AI Verified Candidate Evaluation (10-Point Scale)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Profile Rating & Recruiter Insights</span>
            {candidateName && (
              <span className="text-sm font-normal text-slate-400">
                — {candidateName}
              </span>
            )}
          </h2>
        </div>

        <button
          onClick={onRefreshScore}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-850 hover:bg-charcoal-800 border border-white/10 hover:border-brand-500/30 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-400' : ''}`}
          />
          <span>{isLoading ? 'Re-scoring...' : 'Re-calculate Rating'}</span>
        </button>
      </div>

      {/* Hero Score Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Circular Wheel Gauge */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-charcoal-900/60 border border-white/5">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
              {/* Background track circle */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="stroke-charcoal-800"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke={tierConfig.strokeColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: `drop-shadow(0 0 6px ${tierConfig.strokeColor}40)`,
                }}
              />
            </svg>

            {/* Score numbers in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-4xl font-extrabold tracking-tight ${tierConfig.textColor}`}>
                {Number(overallScore).toFixed(1)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                / 10
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${tierConfig.bgColor} ${tierConfig.textColor} border ${tierConfig.borderColor}`}
            >
              {tierConfig.badgeText}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">{tierLabel}</p>
          </div>
        </div>

        {/* 4 Dimensional Progress Bars */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Experience & Projects */}
            <div className="p-4 rounded-xl bg-charcoal-900/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-brand-400" />
                  Experience & Projects
                </span>
                <span className="font-mono font-bold text-brand-300">
                  {Number(breakdown.experience.score).toFixed(1)} / {breakdown.experience.max}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (breakdown.experience.score / breakdown.experience.max) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {breakdown.experience.description}
              </p>
            </div>

            {/* Technical Skills */}
            <div className="p-4 rounded-xl bg-charcoal-900/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Technical & Skill Depth
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {Number(breakdown.skills.score).toFixed(1)} / {breakdown.skills.max}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (breakdown.skills.score / breakdown.skills.max) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {breakdown.skills.description}
              </p>
            </div>

            {/* Education */}
            <div className="p-4 rounded-xl bg-charcoal-900/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  Education & Credentials
                </span>
                <span className="font-mono font-bold text-purple-300">
                  {Number(breakdown.education.score).toFixed(1)} / {breakdown.education.max}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (breakdown.education.score / breakdown.education.max) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {breakdown.education.description}
              </p>
            </div>

            {/* LinkedIn Activeness & Professional Presence */}
            <div className="p-4 rounded-xl bg-charcoal-900/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  LinkedIn Activeness & Presence
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {Number(activenessDimension.score).toFixed(1)} / {activenessDimension.max}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (activenessDimension.score / activenessDimension.max) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {activenessDimension.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Intelligence & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-white/5">
        {/* Key Strengths */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Verified Strengths</span>
          </div>
          <div className="space-y-2">
            {keyStrengths.map((str, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-charcoal-900/70 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>{str}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Areas & Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Growth Opportunities</span>
          </div>
          <div className="space-y-2">
            {growthAreas.map((gap, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-charcoal-900/70 border border-amber-500/20 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>{gap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Roles */}
      {recommendedRoles.length > 0 && (
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Recommended Roles:
          </span>
          {recommendedRoles.map((role, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-lg bg-charcoal-850 border border-white/10 text-brand-300 text-xs font-medium"
            >
              {role}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

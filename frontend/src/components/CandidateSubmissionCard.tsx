import React, { useState } from 'react';
import {
  Search,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  SlidersHorizontal,
  KeyRound,
  FileText,
  User,
} from 'lucide-react';

export interface CandidateSubmissionPayload {
  profileUrl: string;
  displayName?: string;
  headline?: string;
  profileText?: string;
  pdlApiKey?: string;
}

interface CandidateSubmissionCardProps {
  onSubmit: (payload: string | CandidateSubmissionPayload) => Promise<void>;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const CandidateSubmissionCard: React.FC<CandidateSubmissionCardProps> = ({
  onSubmit,
  isLoading,
  errorMessage,
}) => {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Advanced enrichment state
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [profileText, setProfileText] = useState('');
  const [pdlApiKey, setPdlApiKey] = useState('');

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setValidationError('Please enter a LinkedIn profile URL');
      return false;
    }

    let testUrl = value.trim();
    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
      testUrl = `https://${testUrl}`;
    }

    try {
      const parsed = new URL(testUrl);
      if (!parsed.hostname.toLowerCase().includes('linkedin.com')) {
        setValidationError('URL must belong to linkedin.com (e.g. linkedin.com/in/username)');
        return false;
      }
      if (!parsed.pathname.includes('/in/')) {
        setValidationError('URL path must include /in/{username}');
        return false;
      }
    } catch {
      setValidationError('Please enter a valid web URL format');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) return;

    if (!showEnrichment) {
      onSubmit(url.trim());
    } else {
      onSubmit({
        profileUrl: url.trim(),
        displayName: displayName.trim() || undefined,
        headline: headline.trim() || undefined,
        profileText: profileText.trim() || undefined,
        pdlApiKey: pdlApiKey.trim() || undefined,
      });
    }
  };

  return (
    <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-200 border-2 border-brand-500/20">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-500/10 dark:bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/8 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Transform Candidate Profile
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Enter any LinkedIn candidate URL. The AI validates authorized data access, extracts accurate
              career facts, and renders a 720p narrated video reel.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowEnrichment(!showEnrichment)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
              showEnrichment
                ? 'bg-brand-500/15 border-brand-500/40 text-brand-700 dark:text-brand-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 dark:bg-charcoal-900 dark:border-white/10 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showEnrichment ? 'Hide Live Data Controls' : 'Live Data & Custom Details'}</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>

            <input
              type="text"
              id="candidate-profile-url-input"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (validationError) validateUrl(e.target.value);
              }}
              placeholder="Paste LinkedIn URL: https://www.linkedin.com/in/dhruva-h-40a5a9353/"
              className={`w-full pl-11 pr-36 py-3.5 bg-slate-50/90 dark:bg-charcoal-900/90 rounded-2xl border-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:bg-white dark:focus:bg-charcoal-900 transition-all ${
                validationError || errorMessage
                  ? 'border-rose-500/60 focus:ring-rose-500/20'
                  : 'border-slate-200 hover:border-slate-300 dark:border-white/10 focus:border-brand-500 focus:ring-brand-500/15 shadow-inner'
              }`}
              disabled={isLoading}
            />

            <div className="absolute inset-y-1.5 right-1.5 flex items-center">
              <button
                type="submit"
                id="submit-candidate-button"
                disabled={isLoading || !url.trim()}
                className="h-full px-5 sm:px-6 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-accent hover:from-brand-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expandable Live Enrichment & Direct Details Panel */}
          {showEnrichment && (
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-charcoal-900/95 border border-slate-200 dark:border-brand-500/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
                  <SlidersHorizontal className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Direct Data &amp; Live Enrichment Controls</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Zero Hallucination Guaranteed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* People Data Labs API Key */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span>People Data Labs (PDL) API Key</span>
                  </label>
                  <input
                    type="password"
                    value={pdlApiKey}
                    onChange={(e) => setPdlApiKey(e.target.value)}
                    placeholder="Enter PDL API key for live LinkedIn enrichment"
                    className="w-full px-3 py-2 bg-white dark:bg-charcoal-950 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Enables authorized real-time enrichment via People Data Labs Person Enrichment API.
                  </p>
                </div>

                {/* Candidate Name & Headline Overrides */}
                <div className="space-y-2">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>Candidate Full Name</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Dhruva H"
                      className="w-full px-3 py-1.5 bg-white dark:bg-charcoal-950 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Candidate Headline / Current Title</span>
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Full-Stack Engineer | React &amp; Cloud Architectures"
                      className="w-full px-3 py-1.5 bg-white dark:bg-charcoal-950 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Direct Profile Text Parser (Paste from LinkedIn/Resume) */}
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Paste Candidate Profile Text / About / Experience (From LinkedIn tab)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    AI parses sections into structured facts
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  placeholder="Paste experience, education, skills, or about text directly from candidate's profile..."
                  className="w-full p-3 bg-white dark:bg-charcoal-950 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Validation or API Error banner */}
          {(validationError || errorMessage) && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Notice</p>
                <p>{validationError || errorMessage}</p>
              </div>
            </div>
          )}

          {/* Compliance & Privacy Note */}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              Zero scraping compliance: We only access authorized data feeds and direct input. No passwords or session cookies are ever requested or stored.
            </span>
          </div>

        </form>
      </div>
    </div>
  );
};

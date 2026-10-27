import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import {
  CandidateSubmissionCard,
  CandidateSubmissionPayload,
} from '../components/CandidateSubmissionCard';
import { CandidateDetailsCard } from '../components/CandidateDetailsCard';
import { CandidateList } from '../components/CandidateList';
import { Candidate, HealthStatus } from '../types/candidate';
import { api, ApiError } from '../services/api';
import { Sparkles, Database, ShieldCheck, Video } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | undefined>(undefined);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial system health and existing candidates from backend/MySQL
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [healthData, candidatesData] = await Promise.all([
          api.getHealth().catch(() => undefined),
          api.listCandidates().catch(() => []),
        ]);

        if (healthData) setHealth(healthData);
        if (candidatesData) {
          setCandidates(candidatesData);
          if (candidatesData.length > 0) {
            setSelectedCandidate(candidatesData[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsInitialLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const handleCandidateSubmit = async (
    payload: string | CandidateSubmissionPayload,
  ) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.submitCandidate(payload);

      // Re-fetch candidate with full facts
      const candidateDetails = await api.getCandidate(response.candidateId);
      setSelectedCandidate(candidateDetails);

      // Refresh candidate list
      const updatedList = await api.listCandidates();
      setCandidates(updatedList);
    } catch (err: any) {
      console.error('Submission error:', err);
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to connect to backend server. Verify the API is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col">
      <Navbar health={health} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto pt-2 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AI-Powered Profile Scoring & Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            One Profile. One AI.{' '}
            <span className="bg-gradient-to-r from-brand-500 via-brand-accent to-purple-400 bg-clip-text text-transparent">
              One Powerful Story.
            </span>
          </h1>

          <p className="text-base text-slate-400 leading-relaxed">
            Validate candidate LinkedIn profiles, extract verified career facts from authorized sources,
            and evaluate candidate readiness with a 100-point AI scoring board.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-0.5">Strict Authorized Ingestion</h4>
              <p className="text-xs text-slate-400">
                Zero scraping policy. Modular provider interface with structured data integrity safeguards.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-0.5">MySQL 8.4 Normalized Storage</h4>
              <p className="text-xs text-slate-400">
                Structured candidate entities, verified category facts, and job lifecycle state persistence.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-0.5">100-Point Profile Scoring</h4>
              <p className="text-xs text-slate-400">
                Multi-dimensional evaluation across experience trajectory, skill depth, education, and impact metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Submission Card */}
        <CandidateSubmissionCard
          onSubmit={handleCandidateSubmit}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />

        {/* Active Candidate Details & Analyzed History */}
        <div className="grid grid-cols-1 gap-8">
          {selectedCandidate && (
            <CandidateDetailsCard
              candidate={selectedCandidate}
              isProcessing={isLoading}
            />
          )}

          <CandidateList
            candidates={candidates}
            selectedId={selectedCandidate?.id}
            onSelect={(candidate) => setSelectedCandidate(candidate)}
            isLoading={isInitialLoading}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-charcoal-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>
          ProfileReel AI &copy; 2026. Built with NestJS, MySQL 8.4, React, Vite, and TypeORM. Phase 1 Production Architecture.
        </p>
      </footer>
    </div>
  );
};

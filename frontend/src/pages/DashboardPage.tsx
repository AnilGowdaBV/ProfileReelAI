import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import {
  CandidateSubmissionCard,
  CandidateSubmissionPayload,
} from '../components/CandidateSubmissionCard';
import { CandidateDetailsCard } from '../components/CandidateDetailsCard';
import { CareerHubSection } from '../components/CareerHubSection';
import { PricingSection } from '../components/PricingSection';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { PolicyModals, PolicyType } from '../components/PolicyModals';
import { Footer } from '../components/Footer';
import { Candidate, HealthStatus } from '../types/candidate';
import { api, ApiError } from '../services/api';
import { Sparkles, Database, ShieldCheck, Zap } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | undefined>(undefined);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pro Subscription State
  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem('profilereel_pro_active') === 'true';
  });
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Legal / Compliance Policy Modals
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

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

  const candidateSkills = (selectedCandidate?.facts || [])
    .filter((f) => f.category === 'skills')
    .map((f) => f.factText);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-charcoal-950 flex flex-col text-slate-800 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        health={health}
        isPro={isPro}
        onOpenSubscribeModal={() => setIsSubModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        {/* Hero Banner & Feature Highlights (Commented out from UI per user request) */}
        {/*
        <div className="text-center max-w-3xl mx-auto pt-2 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
            <span>AI-Powered Profile Scoring &amp; Live Career Opportunities</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            One Profile. One AI.{' '}
            <span className="bg-gradient-to-r from-brand-600 via-brand-accent to-purple-600 dark:from-brand-500 dark:via-brand-accent dark:to-purple-400 bg-clip-text text-transparent">
              One Powerful Story.
            </span>
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Evaluate candidate LinkedIn profiles, extract verified career facts from authorized sources,
            generate 10-point profile scores, and unlock 45+ live career roles with Razorpay Pro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Strict Authorized Ingestion</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Zero scraping policy. Modular provider interface with structured data integrity safeguards.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">MySQL 8.4 Normalized Storage</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Structured candidate entities, verified category facts, and job lifecycle state persistence.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">45+ Live Career Roles &amp; Scoring</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                10-point multi-dimensional scoring, real-time job matching, and 1-on-1 FAANG mock interviews.
              </p>
            </div>
          </div>
        </div>
        */}

        {/* Submission Card */}
        <CandidateSubmissionCard
          onSubmit={handleCandidateSubmit}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />

        {/* Active Candidate Details & Intelligence */}
        {selectedCandidate && (
          <CandidateDetailsCard
            candidate={selectedCandidate}
            isProcessing={isLoading}
            onClose={() => setSelectedCandidate(null)}
          />
        )}

        {/* Career Hub Section (45+ Roles, Preferred Courses, Mock Interview Panel) */}
        <CareerHubSection
          isPro={isPro}
          onOpenSubscribeModal={() => setIsSubModalOpen(true)}
          candidateSkills={candidateSkills}
        />

        {/* Transparent Razorpay Pricing & Subscription Section */}
        <PricingSection
          onOpenSubscribeModal={() => setIsSubModalOpen(true)}
          isPro={isPro}
        />
      </main>

      {/* Official Razorpay Pro Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        isPro={isPro}
        onUnlockPro={() => {
          setIsPro(true);
          localStorage.setItem('profilereel_pro_active', 'true');
        }}
        onResetFree={() => {
          setIsPro(false);
          localStorage.removeItem('profilereel_pro_active');
        }}
      />

      {/* Mandatory RBI & Razorpay Legal Compliance Modals */}
      <PolicyModals
        activePolicy={activePolicy}
        onClose={() => setActivePolicy(null)}
      />

      {/* Professional Footer */}
      <Footer onOpenPolicy={(policy) => setActivePolicy(policy)} />
    </div>
  );
};

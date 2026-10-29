import React from 'react';
import { Check, Shield, Zap, QrCode, Lock, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  onOpenSubscribeModal: () => void;
  isPro: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onOpenSubscribeModal,
  isPro,
}) => {
  return (
    <section id="pricing" className="scroll-mt-24 py-12 border-t border-slate-200/80 dark:border-white/5 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 text-center">
        
        {/* Badge & Title */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/90 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
          <Shield className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Simple &amp; Transparent Pricing • Powered by Razorpay</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Flat ₹100 Monthly Subscription
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-10">
          One single, transparent plan. Unlock all 45+ live career roles, priority 1-on-1 FAANG mock interview slots, tailored learning tracks, and unlimited AI video reels.
        </p>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left mb-10">
          
          {/* Card 1: Free Tier */}
          <div className="glass-panel p-8 rounded-3xl border border-slate-200/90 dark:border-white/5 flex flex-col justify-between hover:shadow-xl transition-all">
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Starter Tier
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Free Community</h3>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
                ₹0 <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ forever</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                Essential candidate intelligence and foundational scoring for individuals.
              </p>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-white/5 pt-6 mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">10-Point Profile Scoring Card</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">1 Verified AI Profile Video Reel</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Preview of Top 3 Verified Live Roles</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-500">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 text-[10px]">
                    ✕
                  </div>
                  <span>45+ Live Direct Job Applications</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-500">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 text-[10px]">
                    ✕
                  </div>
                  <span>FAANG Mock Interview Panel</span>
                </div>
              </div>
            </div>

            <div className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-transparent text-center text-xs font-bold text-slate-700 dark:text-slate-300">
              Current Default Tier
            </div>
          </div>

          {/* Card 2: Pro Tier (Flat ₹100 / month) */}
          <div className="relative glass-panel-elevated p-8 rounded-3xl border-2 border-brand-500/40 bg-gradient-to-b from-white via-indigo-50/40 to-purple-50/25 dark:from-brand-950/20 dark:via-charcoal-900 dark:to-charcoal-950 shadow-2xl shadow-brand-500/15 flex flex-col justify-between ring-4 ring-brand-500/5 hover:shadow-brand-500/25 transition-all">
            <span className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-brand-500 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md shadow-brand-500/30">
              Recommended for Candidates
            </span>

            <div>
              <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Full Pro Access</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">ProfileReel Pro</h3>
              
              <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1">
                ₹100 <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ month</span>
              </div>
              <div className="text-[11px] text-brand-700 dark:text-brand-300 font-semibold mb-4">
                Single Unified Plan • Instant Automated Activation
              </div>
              
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-6">
                Complete access to the entire verified tech jobs catalog, FAANG mock interview slots, and expert upskilling tracks.
              </p>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-200 border-t border-brand-500/20 pt-6 mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">45+ Live Verified Roles (1-click apply)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">FAANG Mock Interviews (1-on-1 slots)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">Meta, Stanford &amp; DeepLearning Tracks</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">Unlimited AI Video Reels (720p HD)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">Full Recruiter Intelligence Dossier</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              id="pricing-upgrade-pro-button"
              onClick={onOpenSubscribeModal}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isPro ? 'Pro Active • Manage Subscription' : 'Subscribe for ₹100 via Razorpay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Policy & Trust Strip */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>256-Bit SSL Encrypted</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Instant UPI &amp; Cards</span>
          </span>
          <span>•</span>
          <span className="text-amber-700 dark:text-amber-400/90 font-medium">
            Strict No-Refund &amp; No-Cancellation Policy
          </span>
        </div>
      </div>
    </section>
  );
};

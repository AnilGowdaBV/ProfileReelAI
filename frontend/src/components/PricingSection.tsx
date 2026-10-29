import React, { useState } from 'react';
import { Check, Shield, Zap, Sparkles, CreditCard, QrCode, Lock, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  onOpenSubscribeModal: () => void;
  isPro: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onOpenSubscribeModal,
  isPro,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section id="pricing" className="scroll-mt-24 py-12 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-4 text-center">
        
        {/* Badge & Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Shield className="w-3.5 h-3.5 text-brand-400" />
          <span>Transparent Pricing • Powered by Razorpay</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Predictable Pricing for Career Acceleration
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto mb-8">
          One unified subscription unlocks all 45+ live Instahyre roles, FAANG mock interview slots, tailored learning tracks, and unlimited AI video reels.
        </p>

        {/* Billing Switcher (Monthly vs Annual) */}
        <div className="inline-flex items-center p-1 rounded-xl bg-charcoal-900 border border-white/10 mb-10">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
              Save 33%
            </span>
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left mb-12">
          
          {/* Card 1: Free Tier */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Starter Tier
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Free Community</h3>
              <div className="text-3xl font-extrabold text-white mb-4">
                ₹0 <span className="text-sm font-normal text-slate-400">/ forever</span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Essential candidate intelligence and foundational scoring for individuals.
              </p>

              <div className="space-y-3 text-xs text-slate-300 border-t border-white/5 pt-6 mb-8">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>10-Point Profile Scoring Card</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>1 Verified AI Profile Video Reel</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Preview of Top 3 Verified Live Roles</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-500">
                  <span className="w-4 h-4 text-center">✕</span>
                  <span>45+ Live Instahyre Direct Applications</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-500">
                  <span className="w-4 h-4 text-center">✕</span>
                  <span>FAANG Mock Interview Panel</span>
                </div>
              </div>
            </div>

            <div className="w-full py-3 px-4 rounded-xl bg-white/5 text-center text-xs font-semibold text-slate-300">
              Current Default Tier
            </div>
          </div>

          {/* Card 2: Pro Tier */}
          <div className="relative glass-panel p-8 rounded-3xl border border-brand-500/50 bg-gradient-to-b from-brand-950/20 via-charcoal-900 to-charcoal-950 shadow-2xl shadow-brand-500/15 flex flex-col justify-between">
            <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-brand-500 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md shadow-brand-500/30">
              Recommended for Candidates
            </span>

            <div>
              <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Full Pro Access</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2">ProfileReel Pro</h3>
              
              <div className="text-4xl font-extrabold text-white mb-1">
                {billingCycle === 'monthly' ? (
                  <>₹1 <span className="text-sm font-normal text-slate-400">/ mo</span></>
                ) : (
                  <>₹2 <span className="text-sm font-normal text-slate-400">/ yr</span></>
                )}
              </div>
              <div className="text-[11px] text-brand-300/80 mb-4 font-medium">
                Testing Mode: ₹{billingCycle === 'monthly' ? '1' : '2'} • Production: ₹{billingCycle === 'monthly' ? '999/mo' : '7,999/yr'}
              </div>
              
              <p className="text-xs text-slate-300 mb-6">
                Complete access to the entire Instahyre jobs catalog, FAANG mock interview slots, and expert upskilling tracks.
              </p>

              <div className="space-y-3 text-xs text-slate-200 border-t border-brand-500/20 pt-6 mb-8">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong className="text-white">45+ Live Instahyre Roles</strong> (1-click direct apply)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong className="text-white">FAANG Mock Interviews:</strong> Priority 1-on-1 slots</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong className="text-white">Full Learning Tracks:</strong> Meta, Stanford &amp; DeepLearning.AI</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong className="text-white">Unlimited AI Video Reels</strong> (Download MP4 720p HD)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong className="text-white">Full Recruiter Dossier</strong> with detailed gaps &amp; trajectory</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenSubscribeModal}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isPro ? 'Pro Active • Manage Subscription' : 'Subscribe via Razorpay Gateway'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Razorpay Trust Strip */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>256-Bit SSL Encrypted</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-brand-400" />
            <span>Instant UPI &amp; Card Verification</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span>Official Razorpay Merchant</span>
          </span>
        </div>
      </div>
    </section>
  );
};

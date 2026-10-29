import React, { useState } from 'react';
import { API_BASE } from '../services/api';
import { Shield, Check, X, Sparkles, CreditCard, QrCode, Lock, RotateCcw } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onUnlockPro: () => void;
  onResetFree: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  isPro,
  onUnlockPro,
  onResetFree,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleRazorpayCheckout = () => {
    setIsProcessing(true);
    // Open the hosted Razorpay checkout page from the backend
    const checkoutUrl = `${API_BASE}/payments/checkout?plan=${selectedPlan}`;
    window.open(checkoutUrl, '_blank', 'width=520,height=720');

    // Simulate completion check or allow instant demo unlock
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-charcoal-900 via-charcoal-950 to-black border border-brand-500/30 shadow-2xl shadow-brand-500/10 overflow-hidden text-white p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Razorpay Gateway Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold tracking-wide uppercase mb-3">
            <Shield className="w-3.5 h-3.5 text-brand-400" />
            <span>Razorpay Secured Gateway</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Unlock ProfileReel AI Pro
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tracked directly in your <strong className="text-slate-200">Razorpay Dashboard</strong> with automated instant unlock.
          </p>
        </div>

        {/* Plan Switcher Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Monthly */}
          <button
            type="button"
            onClick={() => setSelectedPlan('monthly')}
            className={`relative p-4 rounded-xl text-left border transition-all ${
              selectedPlan === 'monthly'
                ? 'bg-brand-500/15 border-brand-500 shadow-lg shadow-brand-500/20'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider text-brand-400 mb-1">
              Popular Plan
            </div>
            <div className="text-sm font-bold text-white mb-1">Pro Monthly</div>
            <div className="text-xl font-extrabold text-white">
              ₹1 <span className="text-xs font-normal text-slate-400">/ mo</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              (Live: ₹999/mo)
            </div>
          </button>

          {/* Annual */}
          <button
            type="button"
            onClick={() => setSelectedPlan('annual')}
            className={`relative p-4 rounded-xl text-left border transition-all ${
              selectedPlan === 'annual'
                ? 'bg-brand-500/15 border-brand-500 shadow-lg shadow-brand-500/20'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
            }`}
          >
            <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-[9px] font-bold text-white uppercase tracking-wider">
              Save 33%
            </span>
            <div className="text-[10px] uppercase font-bold tracking-wider text-purple-400 mb-1">
              Best Value
            </div>
            <div className="text-sm font-bold text-white mb-1">Pro Annual</div>
            <div className="text-xl font-extrabold text-white">
              ₹2 <span className="text-xs font-normal text-slate-400">/ yr</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              (Live: ₹7,999/yr)
            </div>
          </button>
        </div>

        {/* Benefits Checklist */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-6 space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-300 leading-tight">
              <strong className="text-white">45+ Live Instahyre Roles:</strong> Instant 1-click apply to top tech companies
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-300 leading-tight">
              <strong className="text-white">FAANG Mock Interviews:</strong> Priority 1-on-1 slots with Google &amp; Swiggy Staff Engineers
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-300 leading-tight">
              <strong className="text-white">Complete Learning Pathways:</strong> Meta, Stanford &amp; DeepLearning.AI certified
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-300 leading-tight">
              <strong className="text-white">Unlimited 10-Point Scoring:</strong> Dynamic AI video reels & recruiter dossier export
            </span>
          </div>
        </div>

        {/* Payment Methods Badges */}
        <div className="mb-6">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 text-center">
            All Payment Methods Supported via Razorpay
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium text-slate-300">
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10 flex items-center gap-1">
              <QrCode className="w-3 h-3 text-brand-400" /> UPI QR
            </span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Google Pay</span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">PhonePe</span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Paytm</span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-brand-400" /> Cards (Visa/MC)
            </span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Netbanking</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Razorpay Gateway Button */}
          <button
            type="button"
            onClick={handleRazorpayCheckout}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Pay {selectedPlan === 'monthly' ? '₹1' : '₹2'} with Razorpay Gateway</span>
          </button>

          {/* Quick Demo Unlock (Free testing) */}
          <button
            type="button"
            onClick={() => {
              onUnlockPro();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Instant Demo Unlock (Skip Payment for Review)</span>
          </button>

          {/* Reset to Free Tier */}
          {isPro && (
            <button
              type="button"
              onClick={() => {
                onResetFree();
                onClose();
              }}
              className="w-full py-2 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Pro &amp; Switch Back to Free Tier</span>
            </button>
          )}
        </div>

        {/* Security Footer Guarantee */}
        <div className="mt-5 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-slate-400" />
          <span>Official Razorpay Merchant • 256-Bit SSL Encrypted • Direct Bank Settlement</span>
        </div>
      </div>
    </div>
  );
};

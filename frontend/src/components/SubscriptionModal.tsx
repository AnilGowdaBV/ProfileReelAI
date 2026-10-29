import React, { useState } from 'react';
import { API_BASE } from '../services/api';
import { Shield, Check, X, CreditCard, QrCode, Lock, RotateCcw } from 'lucide-react';

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
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleRazorpayCheckout = () => {
    setIsProcessing(true);
    // Open the hosted Razorpay checkout page from the backend for ₹100 monthly plan
    const checkoutUrl = `${API_BASE}/payments/checkout?plan=monthly&amount=100`;
    window.open(checkoutUrl, '_blank', 'width=520,height=720');

    // Reset processing state
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gradient-to-b dark:from-charcoal-900 dark:via-charcoal-950 dark:to-black border border-slate-200 dark:border-brand-500/30 shadow-2xl shadow-slate-900/20 dark:shadow-brand-500/10 overflow-hidden text-slate-900 dark:text-white p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Razorpay Gateway Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-semibold tracking-wide uppercase mb-3">
            <Shield className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Razorpay Secured Gateway</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Unlock ProfileReel AI Pro
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            Single transparent monthly subscription tracked directly in your <strong className="text-slate-800 dark:text-slate-200">Razorpay Dashboard</strong>.
          </p>
        </div>

        {/* Single Subscription Plan Card: ₹100 / month */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-500/10 via-slate-50 to-indigo-50/50 dark:from-brand-500/15 dark:via-charcoal-850 dark:to-charcoal-900 border border-brand-500/40 shadow-xl shadow-brand-500/10 text-center mb-6">
          <div className="text-[10px] uppercase font-extrabold tracking-wider text-brand-700 dark:text-brand-400 mb-1">
            Official Subscription Plan
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mb-1">ProfileReel AI Pro</div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1">
            <span>₹100</span>
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ month</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Instant Access • 30 Days Pro Membership
          </div>
        </div>

        {/* Benefits Checklist */}
        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 mb-5 space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-700 dark:text-slate-300 leading-tight">
              <strong className="text-slate-900 dark:text-white">45+ Live Verified Roles:</strong> Instant 1-click apply to top tech companies
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-700 dark:text-slate-300 leading-tight">
              <strong className="text-slate-900 dark:text-white">FAANG Mock Interviews:</strong> Priority 1-on-1 slots with Google &amp; Swiggy Staff Engineers
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-700 dark:text-slate-300 leading-tight">
              <strong className="text-slate-900 dark:text-white">Complete Learning Pathways:</strong> Meta, Stanford &amp; DeepLearning.AI certified
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-700 dark:text-slate-300 leading-tight">
              <strong className="text-slate-900 dark:text-white">Unlimited 10-Point Scoring:</strong> Dynamic AI video reels &amp; recruiter dossier export
            </span>
          </div>
        </div>

        {/* Payment Methods Badges */}
        <div className="mb-6">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-2 text-center">
            All Payment Methods Supported via Razorpay
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-1">
              <QrCode className="w-3 h-3 text-brand-600 dark:text-brand-400" /> UPI QR
            </span>
            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">Google Pay</span>
            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">PhonePe</span>
            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">Paytm</span>
            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-brand-600 dark:text-brand-400" /> Cards (Visa/MC)
            </span>
            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">Netbanking</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Razorpay Gateway Button */}
          <button
            type="button"
            onClick={handleRazorpayCheckout}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Connecting to Razorpay...'
                : 'Proceed to Pay ₹100 via Razorpay (UPI / Cards)'}
            </span>
          </button>

          {/* Quick Mock Toggle for Testing */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
            {!isPro ? (
              <button
                type="button"
                onClick={() => {
                  onUnlockPro();
                  onClose();
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer text-center"
              >
                Instant Developer Unlock (Test Mode)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onResetFree();
                  onClose();
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 dark:bg-white/5 dark:hover:bg-rose-500/10 text-slate-700 dark:text-slate-400 dark:hover:text-rose-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Free Tier</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Film, Shield, Mail, Lock } from 'lucide-react';
import { PolicyType } from './PolicyModals';

interface FooterProps {
  onOpenPolicy: (type: PolicyType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPolicy }) => {
  return (
    <footer className="border-t border-white/5 bg-charcoal-950 mt-16 pt-12 pb-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Column 1: Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-purple-600 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-charcoal-950 rounded-[6px] flex items-center justify-center">
                  <Film className="w-4 h-4 text-brand-400" />
                </div>
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                ProfileReel AI
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              AI-powered candidate screening and career elevation engine. Generating verified profile video reels, 10-point scoring, and live Instahyre opportunity matching.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Razorpay Verified Payment Merchant</span>
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a href="#career-hub" className="hover:text-white transition-colors">
                  ⚡ 45+ Verified Roles (Instahyre)
                </a>
              </li>
              <li>
                <a href="#career-hub" className="hover:text-white transition-colors">
                  🎙️ 1-on-1 FAANG Mock Interviews
                </a>
              </li>
              <li>
                <a href="#career-hub" className="hover:text-white transition-colors">
                  📚 Tailored Upskilling Courses
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  👑 ProfileReel Pro Membership
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Razorpay Compliance */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Legal &amp; Compliance
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('terms')}
                  className="hover:text-white transition-colors text-left"
                >
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('privacy')}
                  className="hover:text-white transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('refund')}
                  className="hover:text-emerald-400 text-slate-300 font-medium transition-colors text-left"
                >
                  Refund &amp; Cancellation Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('pricing')}
                  className="hover:text-white transition-colors text-left"
                >
                  Pricing &amp; Billing Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Customer Support & Entity */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Customer Support
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div>Thinkify Labs • ProfileReel AI</div>
              <div>Bengaluru, Karnataka 560068, India</div>
              <div>
                Email:{' '}
                <a href="mailto:support@profilereel.ai" className="text-brand-300 hover:underline">
                  support@profilereel.ai
                </a>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onOpenPolicy('contact')}
                  className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors"
                >
                  Contact Support Team
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            &copy; 2026 ProfileReel AI • Operated by Thinkify Labs. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Razorpay 256-Bit SSL Payments</span>
            </span>
            <span>•</span>
            <span>Made in Bengaluru, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import { X, Shield, Mail, MapPin, Building } from 'lucide-react';

export type PolicyType = 'terms' | 'privacy' | 'refund' | 'contact' | 'pricing' | null;

interface PolicyModalsProps {
  activePolicy: PolicyType;
  onClose: () => void;
}

export const PolicyModals: React.FC<PolicyModalsProps> = ({ activePolicy, onClose }) => {
  if (!activePolicy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-charcoal-950 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col text-slate-700 dark:text-slate-300">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-charcoal-900/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {activePolicy === 'terms' && 'Terms and Conditions'}
              {activePolicy === 'privacy' && 'Privacy Policy'}
              {activePolicy === 'refund' && 'Refund and Cancellation Policy'}
              {activePolicy === 'contact' && 'Contact Us & Customer Support'}
              {activePolicy === 'pricing' && 'Pricing & Billing Information'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed">
          {/* TERMS AND CONDITIONS */}
          {activePolicy === 'terms' && (
            <>
              <p>
                <strong>Last Updated: October 2026</strong>
              </p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">1. Agreement to Terms</h4>
              <p>
                By accessing or using ProfileReel AI (the "Service"), provided by Thinkify Labs ("we", "our", or "us"), you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the Service.
              </p>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">2. Nature of Service</h4>
              <p>
                ProfileReel AI is a career intelligence and digital profile enhancement platform. The Service generates AI-narrated candidate profile videos, calculates 10-point profile scores based on publicly verifiable background information, and matches candidates to open job roles sourced via authorized industry partners.
              </p>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">3. User Submissions &amp; Authorized Ingestion</h4>
              <p>
                Users confirm that any LinkedIn URLs or profile text submitted for evaluation belong to them or are authorized for recruitment screening. We do not engage in unauthorized scraping; all data ingestion adheres strictly to authorized API interfaces.
              </p>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">4. Subscriptions &amp; Payments</h4>
              <p>
                Paid tiers ("ProfileReel Pro") are billed on a recurring monthly or annual basis via Razorpay. All fees are quoted in Indian Rupees (INR) and include applicable taxes unless stated otherwise.
              </p>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">5. Governing Law</h4>
              <p>
                These Terms shall be governed and construed in accordance with the laws of India, under the jurisdiction of the courts of Bangalore, Karnataka.
              </p>
            </>
          )}

          {/* PRIVACY POLICY */}
          {activePolicy === 'privacy' && (
            <>
              <p>
                <strong>Last Updated: October 2026</strong>
              </p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">1. Information We Collect</h4>
              <p>
                We collect information provided directly by you, such as your LinkedIn profile URL, display name, employment history, educational qualifications, and technical competencies. When you make a purchase, payment processing is handled securely by Razorpay; we do not store sensitive credit card or UPI PIN details on our servers.
              </p>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">2. How We Use Information</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>To generate synthesized AI video introductions and career highlight reels.</li>
                <li>To compute calibrated 10-point profile readiness scores.</li>
                <li>To match candidate competencies against live open career opportunities.</li>
                <li>To verify and process payment transactions via our payment gateway partner, Razorpay.</li>
              </ul>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">3. Data Security &amp; Storage</h4>
              <p>
                Candidate data is stored in enterprise-grade MySQL databases with 256-bit SSL transport encryption. We do not sell or rent personal information to third-party advertisers.
              </p>
            </>
          )}

          {/* REFUND AND CANCELLATION POLICY */}
          {activePolicy === 'refund' && (
            <>
              <p>
                <strong>Last Updated: October 2026</strong>
              </p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">1. Strict No-Refund Policy</h4>
              <p>
                All purchases, payments, and subscriptions on ProfileReel AI are <strong>final and non-refundable</strong>. Because ProfileReel AI provides instant, immediate digital access to AI-powered profile scoring, candidate video reel synthesis, FAANG mock interview booking, and verified career job matching upon payment confirmation, we do not offer refunds, prorated credits, or chargebacks once payment is completed.
              </p>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">2. No Cancellation / No Partial Period Returns</h4>
              <p>
                Once a subscription is purchased for ₹100 / month, your membership remains active and unlocked for the entire 30-day period. Because access is delivered instantly in full, mid-period subscription cancellations or partial-term refunds are not provided.
              </p>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">3. Technical Support &amp; Delivery Inquiries</h4>
              <p>
                Users are encouraged to review the free tier features before upgrading. If you experience any technical difficulties accessing paid features after your payment is completed, please reach out immediately to our support team at <span className="text-brand-600 dark:text-brand-300 font-semibold">support@profilereel.ai</span> with your Razorpay payment ID, and our engineering team will ensure your access is verified and fully operational.
              </p>
            </>
          )}

          {/* CONTACT US */}
          {activePolicy === 'contact' && (
            <>
              <p>
                For merchant inquiries, technical support, billing questions, or feedback, our support team is available Monday through Saturday, 9:00 AM – 7:00 PM IST.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-white/5 space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-900 dark:text-white font-bold">Support Email</div>
                    <a href="mailto:support@profilereel.ai" className="text-brand-600 dark:text-brand-300 hover:underline">
                      support@profilereel.ai
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-900 dark:text-white font-bold">Operating Entity</div>
                    <div>Thinkify Labs • ProfileReel AI Division</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-900 dark:text-white font-bold">Registered Office</div>
                    <div>Bengaluru, Karnataka 560068, India</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PRICING POLICY */}
          {activePolicy === 'pricing' && (
            <>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Flat ₹100 Monthly Subscription Structure</h4>
              <p>
                ProfileReel AI offers one simple, transparent subscription model for job seekers and candidates:
              </p>

              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                <li>
                  <strong className="text-slate-900 dark:text-white">ProfileReel Pro:</strong> Flat rate of <strong>₹100 per month</strong>. Grants 30 days of full access to all 45+ verified Instahyre roles, priority FAANG mock interview booking, upskilling learning tracks, and unlimited AI video reels.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">No Hidden Fees:</strong> What you see is what you pay. No setup charges, surge pricing, or surprise billing.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Currency &amp; Processing:</strong> All payments are securely processed in Indian Rupees (INR) through the Razorpay Payment Gateway.
                </li>
              </ul>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-charcoal-900/40 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

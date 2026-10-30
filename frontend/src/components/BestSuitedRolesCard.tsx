import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Sparkles,
  MapPin,
  CheckCircle,
  ExternalLink,
  Building,
  Upload,
  FileText,
  X,
  Loader2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { CandidateScore, CandidateFact } from '../types/candidate';
import { JobRole, getBestMatchedRolesForCandidate } from '../data/rolesData';
import { api } from '../services/api';

interface BestSuitedRolesCardProps {
  candidateName?: string;
  candidateLinkedinUrl?: string;
  score?: CandidateScore | null;
  candidateSkills?: string[];
  candidateFacts?: CandidateFact[];
}

export const BestSuitedRolesCard: React.FC<BestSuitedRolesCardProps> = ({
  candidateName,
  candidateLinkedinUrl,
  score,
  candidateSkills = [],
  candidateFacts = [],
}) => {
  // Modal & Application State
  const [applyingJob, setApplyingJob] = useState<JobRole | null>(null);
  const [expressedInterestJobs, setExpressedInterestJobs] = useState<Record<string, boolean>>({});

  // Form Fields
  const [formFullName, setFormFullName] = useState(candidateName || '');
  const [formLinkedinUrl, setFormLinkedinUrl] = useState(candidateLinkedinUrl || '');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCurrentSalary, setFormCurrentSalary] = useState('');
  const [formExpectedSalary, setFormExpectedSalary] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Dynamically recommended target companies based on candidate profile rating & experience
  const recommendedCompanies = useMemo(() => {
    return getBestMatchedRolesForCandidate(score, candidateFacts);
  }, [score, candidateFacts]);

  const handleOpenModal = (job: JobRole) => {
    setApplyingJob(job);
    setSubmitStatus(null);
    if (!formFullName && candidateName) setFormFullName(candidateName);
    if (!formLinkedinUrl && candidateLinkedinUrl) setFormLinkedinUrl(candidateLinkedinUrl);
    if (!formLocation && job.location && job.location !== 'Work From Home (Remote)') {
      setFormLocation(job.location.split(',')[0].trim());
    }
  };

  const handleCloseModal = () => {
    setApplyingJob(null);
    setSubmitStatus(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      let resumeData: string | undefined = undefined;
      if (resumeFile) {
        resumeData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(undefined);
          reader.readAsDataURL(resumeFile);
        });
      }

      await api.applyForJob({
        jobId: applyingJob.id,
        jobTitle: 'Expression of Interest',
        companyName: applyingJob.company,
        fullName: formFullName.trim(),
        linkedinUrl: formLinkedinUrl.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        currentSalary: formCurrentSalary.trim(),
        expectedSalary: formExpectedSalary.trim(),
        location: formLocation.trim(),
        resumeFileName: resumeFile?.name,
        resumeData,
        applicationType: 'Express Interest',
        sheetName: 'Sheet2',
      });

      setExpressedInterestJobs((prev) => ({ ...prev, [applyingJob.id]: true }));
      setSubmitStatus({
        type: 'success',
        message: '✓ Interest expressed successfully! Your profile has been forwarded to the hiring team.',
      });

      setTimeout(() => {
        handleCloseModal();
      }, 1600);
    } catch (err: any) {
      setSubmitStatus({
        type: 'error',
        message: err.message || 'Failed to submit. Please check your network connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHighRating = (score?.overallScore ?? 0) >= 8.0 || score?.tier === 'EXCEPTIONAL';

  return (
    <>
      <div className="glass-panel-elevated p-5 sm:p-6 rounded-3xl border-2 border-brand-500/25 shadow-xl shadow-brand-500/5 relative overflow-hidden space-y-5">
        {/* Subtle Ambient Accent Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/8 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="relative border-b border-slate-200/90 dark:border-white/5 pb-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20 text-[11px] font-extrabold uppercase tracking-wide">
              <Sparkles className="w-3 h-3 text-brand-500" />
              <span>AI Role & Company Matching</span>
            </span>
            {score && (
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Score: {score.overallScore}/10
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Candidate is Best Suitable For</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {isHighRating
              ? `High-prestige target companies tailored to ${candidateName || 'candidate'} based on leadership score & verified background.`
              : `High-growth companies and opportunities tailored to ${candidateName || 'candidate'} based on profile rating & skill depth.`}
          </p>
        </div>

        {/* Recommended Target Companies (Express Interest) */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Recommended Target Companies</span>
            </span>
            <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Express Interest
            </span>
          </div>

          <div className="space-y-2">
            {recommendedCompanies.map((job) => (
              <div
                key={job.id}
                className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-charcoal-900/80 border border-brand-500/20 hover:border-brand-500/40 transition-all flex items-center justify-between gap-3 shadow-xs hover:shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-charcoal-950 border border-slate-200 dark:border-white/10 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                    <img
                      src={job.logo}
                      alt={job.company}
                      className="w-full h-full object-contain"
                      onError={(e: any) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.textContent = job.company[0];
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {job.company}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {job.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(job)}
                    disabled={expressedInterestJobs[job.id]}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      expressedInterestJobs[job.id]
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-xs hover:shadow-md shadow-brand-500/25'
                    }`}
                  >
                    {expressedInterestJobs[job.id] ? '✓ Interest Expressed' : 'Express Interest'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Express Interest Modal */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel-elevated max-w-lg w-full rounded-3xl p-6 sm:p-8 border-2 border-brand-500/30 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200 dark:border-white/5">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2 flex-shrink-0">
                <img
                  src={applyingJob.logo}
                  alt={applyingJob.company}
                  className="w-full h-full object-contain"
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.textContent = applyingJob.company[0];
                  }}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  Express Interest
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  {applyingJob.company}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {applyingJob.location}
                </p>
              </div>
            </div>

            {submitStatus && (
              <div
                className={`p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                  submitStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                }`}
              >
                {submitStatus.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{submitStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="e.g. Anil BV"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  LinkedIn Profile URL *
                </label>
                <input
                  type="url"
                  required
                  value={formLinkedinUrl}
                  onChange={(e) => setFormLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current CTC
                  </label>
                  <input
                    type="text"
                    value={formCurrentSalary}
                    onChange={(e) => setFormCurrentSalary(e.target.value)}
                    placeholder="e.g. 12 LPA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expected CTC
                  </label>
                  <input
                    type="text"
                    value={formExpectedSalary}
                    onChange={(e) => setFormExpectedSalary(e.target.value)}
                    placeholder="e.g. 18 LPA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Resume / CV (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center hover:border-brand-500/40 transition-colors">
                  <input
                    id="resume-upload-input-best-fit"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="resume-upload-input-best-fit" className="cursor-pointer block">
                    <Upload className="w-5 h-5 mx-auto text-brand-600 dark:text-brand-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      {resumeFile ? resumeFile.name : 'Click to upload resume (PDF recommended)'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Auto-synced with hiring team Google Sheet
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer bg-gradient-to-r from-brand-600 to-brand-accent hover:from-brand-500 hover:to-brand-accent shadow-brand-500/25"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Interest...</span>
                    </>
                  ) : (
                    <span>Submit Expression of Interest</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

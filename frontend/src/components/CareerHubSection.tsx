import React, { useState } from 'react';
import {
  Briefcase,
  GraduationCap,
  Mic,
  Sparkles,
  ExternalLink,
  Lock,
  CheckCircle,
  Star,
  Clock,
  Building,
  RefreshCw,
  MapPin,
  Calendar,
  X,
  FileText,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { CandidateScore } from '../types/candidate';
import { LIVE_ROLES } from '../data/rolesData';

interface CareerHubSectionProps {
  isPro: boolean;
  onOpenSubscribeModal: () => void;
  candidateSkills?: string[];
  candidateName?: string;
  candidateLinkedinUrl?: string;
  candidateScore?: CandidateScore | null;
}

export const CareerHubSection: React.FC<CareerHubSectionProps> = ({
  isPro,
  onOpenSubscribeModal,
  candidateSkills = [],
  candidateName,
  candidateLinkedinUrl,
  candidateScore,
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'courses' | 'interviews'>('roles');
  const [bookedInterviews, setBookedInterviews] = useState<Record<string, boolean>>({});

  // Direct Job Application State
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [applyingJob, setApplyingJob] = useState<any | null>(null);
  const [formFullName, setFormFullName] = useState('');
  const [formLinkedinUrl, setFormLinkedinUrl] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCurrentSalary, setFormCurrentSalary] = useState('');
  const [formExpectedSalary, setFormExpectedSalary] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenApplyModal = (job: any) => {
    setApplyingJob(job);
    setSubmitStatus(null);
    if (!formFullName && candidateName) {
      setFormFullName(candidateName);
    }
    if (!formLinkedinUrl && candidateLinkedinUrl) {
      setFormLinkedinUrl(candidateLinkedinUrl);
    }
    if (!formLocation && job.location && job.location !== 'Work From Home (Remote)') {
      setFormLocation(job.location.split(',')[0].trim());
    }
  };

  const handleCloseApplyModal = () => {
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
        jobTitle: applyingJob.title,
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
      });

      setAppliedJobs((prev) => ({ ...prev, [applyingJob.id]: true }));
      setSubmitStatus({
        type: 'success',
        message: '✓ Application submitted successfully! Your profile has been sent to our hiring team.',
      });

      setTimeout(() => {
        handleCloseApplyModal();
      }, 1500);
    } catch (err: any) {
      setSubmitStatus({
        type: 'error',
        message: err.message || 'Failed to submit application. Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preferred Courses
  const COURSES = [
    {
      id: 'c-1',
      title: 'Advanced System Design & Scalable Microservices',
      provider: 'Meta • Coursera',
      rating: '4.9 ★',
      duration: '8 Weeks',
      logo: '⚙️',
      skills: ['System Design', 'Microservices', 'Distributed Systems'],
      url: 'https://www.coursera.org/learn/system-design',
    },
    {
      id: 'c-2',
      title: 'Generative AI & Agentic Architectures in Production',
      provider: 'DeepLearning.AI',
      rating: '4.9 ★',
      duration: '5 Weeks',
      logo: '🤖',
      skills: ['LLMs', 'LangChain', 'Agentic AI', 'RAG'],
      url: 'https://www.deeplearning.ai/courses/generative-ai-with-llms/',
    },
    {
      id: 'c-3',
      title: 'Cloud-Native Kubernetes & DevOps Engineering',
      provider: 'Google Cloud Training',
      rating: '4.8 ★',
      duration: '6 Weeks',
      logo: '☁️',
      skills: ['Docker', 'Kubernetes', 'CI/CD', 'Cloud Infra'],
      url: 'https://www.coursera.org/specializations/google-cloud-devops',
    },
    {
      id: 'c-4',
      title: 'Full-Stack Modern Cloud Architecture & React/Node',
      provider: 'IBM Skills Network',
      rating: '4.8 ★',
      duration: '7 Weeks',
      logo: '⚡',
      skills: ['React', 'Node.js', 'Next.js', 'REST APIs'],
      url: 'https://www.coursera.org/professional-certificates/ibm-full-stack-cloud-developer',
    },
  ];

  // Expert Panelists
  const INTERVIEW_PANEL = [
    {
      id: 'p-1',
      name: 'Arjun Sethi',
      avatar: 'AS',
      role: 'Staff Software Engineer at Google (ex-Uber)',
      domain: 'System Design & Distributed Backend',
      experience: '11+ yrs exp • 180+ Interviews',
      rating: '4.9 ★',
      slots: 'Tomorrow, 5:00 PM',
    },
    {
      id: 'p-2',
      name: 'Priya Narang',
      avatar: 'PN',
      role: 'Lead AI Architect at Microsoft AI',
      domain: 'GenAI, LLMs & Machine Learning Systems',
      experience: '9+ yrs exp • 140+ Interviews',
      rating: '5.0 ★',
      slots: 'Today, 7:00 PM',
    },
    {
      id: 'p-3',
      name: 'Rohan Mehta',
      avatar: 'RM',
      role: 'Director of Engineering at Swiggy (ex-Amazon)',
      domain: 'Full-Stack Architecture & Leadership Round',
      experience: '14+ yrs exp • 250+ Interviews',
      rating: '4.9 ★',
      slots: 'Thursday, 4:00 PM',
    },
    {
      id: 'p-4',
      name: 'Sneha Roy',
      avatar: 'SR',
      role: 'Engineering Manager at Netflix',
      domain: 'High-Concurrency Streaming & Distributed Data',
      experience: '10+ yrs exp • 160+ Interviews',
      rating: '4.9 ★',
      slots: 'Monday, 6:30 PM',
    },
  ];

  const handleToggleBooking = (id: string) => {
    setBookedInterviews((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section id="career-hub" className="scroll-mt-24 space-y-6">
      {/* Unlocked via 10-Point Profile Scoring Banner */}
      {candidateScore && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-purple-500/10 border border-brand-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span>Matched Career Opportunities Unlocked</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-500/20 text-brand-700 dark:text-brand-300">
                  Profile Score: {candidateScore.overallScore}/10 ({candidateScore.tier})
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Curated opportunities tailored to {candidateName || 'candidate'} based on 10-point verified career intelligence.
              </p>
            </div>
          </div>
          {isPro && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Pro Active (45+ Roles)
            </span>
          )}
        </div>
      )}

      {/* Header with 3 Tabs */}
      <div className="glass-panel p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-charcoal-900/80 rounded-xl border border-slate-200 dark:border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>⚡ 45+ Verified Roles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>📚 Preferred Courses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interviews')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'interviews'
                ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>🎙️ 1-on-1 Interview Panel</span>
          </button>
        </div>

        {/* Live Pro Badge / Trigger */}
        <div className="flex items-center gap-3 px-3">
          {isPro ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>PRO ACTIVE • ALL UNLOCKED</span>
            </span>
          ) : (
            <button
              onClick={onOpenSubscribeModal}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-brand-500/20 hover:from-amber-500/30 hover:to-brand-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Unlock 45+ Pro Features</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: 45+ ROLES */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
            <span>
              Showing {isPro ? LIVE_ROLES.length : 3} of {LIVE_ROLES.length} Live Opportunities
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Verified Real-Time Opportunities
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(isPro ? LIVE_ROLES : LIVE_ROLES.slice(0, 3)).map((job) => (
              <div
                key={job.id}
                className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-brand-500/40 dark:hover:border-brand-500/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
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
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300 transition-colors">
                          {job.title}
                        </h4>
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{job.company}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <span>{job.location}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {job.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenApplyModal(job)}
                  disabled={appliedJobs[job.id]}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    appliedJobs[job.id]
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-brand-500/10 hover:bg-brand-600 hover:text-white text-brand-700 dark:text-brand-300 dark:hover:bg-brand-500 border border-brand-500/20 cursor-pointer shadow-sm'
                  }`}
                >
                  {appliedJobs[job.id] ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>✓ Applied</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Here</span>
                      <Briefcase className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Locked Pro Teaser Card */}
          {!isPro && (
            <div className="relative rounded-2xl p-6 overflow-hidden bg-gradient-to-r from-amber-500/10 via-white to-amber-500/10 dark:from-charcoal-900 dark:via-charcoal-950 dark:to-charcoal-900 border border-amber-500/40 shadow-xl shadow-amber-500/5">
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-brand-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      Unlock 45+ More Verified Roles
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg">
                      Explore exclusive high-paying opportunities directly matching your exact candidate profile in real-time.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenSubscribeModal}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Unlock with Pro</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PREFERRED COURSES */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(isPro ? COURSES : COURSES.slice(0, 2)).map((course) => (
              <div
                key={course.id}
                className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-brand-500/40 dark:hover:border-brand-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{course.logo}</div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{course.title}</h4>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{course.provider}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    <span className="text-amber-500 dark:text-amber-400 font-semibold">{course.rating}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {course.duration}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {course.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href={course.url}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 rounded-xl bg-brand-500/10 hover:bg-brand-600 hover:text-white text-brand-700 dark:text-brand-300 dark:hover:bg-brand-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Enroll in Specialization</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>

          {!isPro && (
            <div className="rounded-2xl p-6 bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-charcoal-900 dark:to-charcoal-950 border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Unlock Full Curriculum &amp; Certifications
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Access 20+ specialized architect tracks from Google, Meta &amp; DeepLearning.AI.
                </p>
              </div>
              <button
                onClick={onOpenSubscribeModal}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 text-white font-bold text-xs shadow-lg shadow-brand-500/25 flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Unlock with Pro</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 1-ON-1 INTERVIEW PANEL */}
      {activeTab === 'interviews' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(isPro ? INTERVIEW_PANEL : INTERVIEW_PANEL.slice(0, 2)).map((panelist) => {
              const isBooked = !!bookedInterviews[panelist.id];

              return (
                <div
                  key={panelist.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-brand-500/40 dark:hover:border-brand-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-md">
                        {panelist.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{panelist.name}</h4>
                          <span className="text-emerald-500 text-xs">✓</span>
                          <span className="text-amber-500 dark:text-amber-400 text-[11px] font-semibold">
                            {panelist.rating}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">{panelist.role}</div>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 mb-4">
                      <div>🎯 {panelist.domain}</div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3 h-3 text-brand-500 dark:text-brand-400" />
                        <span className="text-slate-700 dark:text-slate-300">Available: {panelist.slots}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleBooking(panelist.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isBooked
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                        : 'bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-700 dark:bg-white/5 dark:hover:bg-brand-500 dark:text-slate-200 dark:hover:text-white border border-slate-200 dark:border-transparent'
                    }`}
                  >
                    {isBooked ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>✓ Interview Slot Requested</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>Request 1-on-1 Interview</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {!isPro && (
            <div className="rounded-2xl p-6 bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-charcoal-900 dark:to-charcoal-950 border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Unlock Full FAANG Interview Panel
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Schedule priority 1-on-1 mock technical and behavioral rounds with 15+ Staff Engineers and Directors.
                </p>
              </div>
              <button
                onClick={onOpenSubscribeModal}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 text-white font-bold text-xs shadow-lg shadow-brand-500/25 flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Unlock with Pro</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* DIRECT IN-APP JOB APPLICATION MODAL                        */}
      {/* ========================================================== */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-200 dark:border-brand-500/30 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto space-y-5 bg-white dark:bg-gradient-to-b dark:from-charcoal-900 dark:to-charcoal-950">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseApplyModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-400 dark:hover:text-white dark:border-white/10 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 text-[10px] font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider mb-2">
                <span>⚡</span> PROFILE REEL AI TALENT DIRECT
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Apply for Job Opportunity</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Applying for <strong className="text-brand-600 dark:text-brand-300">{applyingJob.title}</strong> at{' '}
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{applyingJob.company}</span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-charcoal-900/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-charcoal-900 transition-all"
                />
              </div>

              {/* LinkedIn Profile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  LinkedIn Profile URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formLinkedinUrl}
                  onChange={(e) => setFormLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/username"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-charcoal-900/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-charcoal-900 transition-all"
                />
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-charcoal-900/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-charcoal-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-charcoal-900/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-charcoal-900 transition-all"
                  />
                </div>
              </div>

              {/* Salaries Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Salary / CTC
                  </label>
                  <input
                    type="text"
                    value={formCurrentSalary}
                    onChange={(e) => setFormCurrentSalary(e.target.value)}
                    placeholder="e.g. ₹12 LPA"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-charcoal-900/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-charcoal-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Salary / CTC
                  </label>
                  <input
                    type="text"
                    value={formExpectedSalary}
                    onChange={(e) => setFormExpectedSalary(e.target.value)}
                    placeholder="e.g. ₹18 LPA"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-charcoal-900/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-charcoal-900 transition-all"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Bangalore, India"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-charcoal-900/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-charcoal-900 transition-all"
                />
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attach Resume (PDF / DOCX) <span className="text-rose-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-brand-500/30 rounded-xl p-4 text-center hover:bg-brand-500/5 hover:border-brand-500 transition-all cursor-pointer">
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <Upload className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {resumeFile ? (
                        <span className="text-brand-600 dark:text-brand-300 font-semibold">📎 {resumeFile.name}</span>
                      ) : (
                        'Click to upload or drag resume file (PDF, DOCX)'
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500">Max file size: 5MB</span>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {submitStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    submitStatus.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
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

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseApplyModal}
                  className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all cursor-pointer border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <Briefcase className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

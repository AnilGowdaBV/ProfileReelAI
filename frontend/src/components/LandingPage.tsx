import React, { useState, useEffect } from 'react';
import {
  Film,
  Sparkles,
  ShieldCheck,
  Video,
  Award,
  Briefcase,
  Star,
  ArrowRight,
  Play,
  Pause,
  Download,
  Zap,
  ChevronDown,
  Users,
  Check,
  Cpu,
  Compass,
  Sun,
  Moon,
  Building2,
  Lock,
  Volume2,
  VolumeX,
  ExternalLink,
  Code2,
  TrendingUp,
  Sliders,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenPricing?: () => void;
  isPro?: boolean;
}

interface DemoProfile {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  initials: string;
  score: string;
  tier: string;
  tierColor: string;
  quote: string;
  experienceScore: string;
  techScore: string;
  eduScore: string;
  socialScore: string;
  topSkills: string[];
  matchedRole: {
    title: string;
    company: string;
    salary: string;
    match: string;
  };
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'sanket',
    name: 'Sanket Atal',
    role: 'MD Intuit • Ex-Salesforce VP Engineering',
    company: 'Intuit',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    initials: 'SA',
    score: '9.0',
    tier: 'Top 5% Candidate',
    tierColor: 'emerald',
    quote: '18+ years leading enterprise cloud architecture & hyper-scale engineering systems.',
    experienceScore: '3.5 / 3.5',
    techScore: '2.5 / 2.5',
    eduScore: '1.3 / 2.0',
    socialScore: '1.7 / 2.0',
    topSkills: ['Distributed Systems', 'Cloud Architecture', 'Engineering Leadership', 'Microservices'],
    matchedRole: {
      title: 'Principal Systems Architect',
      company: 'Google Cloud',
      salary: '₹85L - ₹1.2 Cr',
      match: '98% Match',
    },
  },
  {
    id: 'anil',
    name: 'Anil BV',
    role: 'Full Stack Engineer & Python Specialist',
    company: 'Thinkify Labs',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    initials: 'AB',
    score: '8.8',
    tier: 'High-Velocity Developer',
    tierColor: 'indigo',
    quote: 'Specialized in asynchronous Python pipelines, scalable React applications & microservices.',
    experienceScore: '3.2 / 3.5',
    techScore: '2.4 / 2.5',
    eduScore: '1.5 / 2.0',
    socialScore: '1.7 / 2.0',
    topSkills: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker', 'Redis'],
    matchedRole: {
      title: 'Senior Full Stack Engineer',
      company: 'Swiggy',
      salary: '₹48L - ₹65L',
      match: '96% Match',
    },
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    role: 'AI / LLM Infrastructure Researcher',
    company: 'Stanford AI Lab',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    initials: 'PS',
    score: '9.6',
    tier: 'Top 1% Elite Talent',
    tierColor: 'purple',
    quote: 'Published researcher in multimodal generative models, transformer distillation & low-latency inference.',
    experienceScore: '3.5 / 3.5',
    techScore: '2.5 / 2.5',
    eduScore: '2.0 / 2.0',
    socialScore: '1.6 / 2.0',
    topSkills: ['PyTorch', 'Transformers', 'CUDA', 'LLM Fine-Tuning', 'Distributed Training'],
    matchedRole: {
      title: 'Staff AI Research Engineer',
      company: 'Microsoft AI',
      salary: '₹95L - ₹1.3 Cr',
      match: '99% Match',
    },
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenPricing,
  isPro = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedDemo, setSelectedDemo] = useState<DemoProfile>(DEMO_PROFILES[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(38);

  // Simulated video playback progress
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 450);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const faqs = [
    {
      q: 'What is ProfileReel AI?',
      a: 'ProfileReel AI is a talent intelligence platform that turns any candidate LinkedIn profile into a broadcast-ready 720p narrated video reel, a verified 10-point scorecard, and matches them to 45+ live FAANG career roles in seconds.',
    },
    {
      q: 'How does the 10-Point Candidate Score work?',
      a: 'Our algorithmic model evaluates 4 core pillars: Experience & Impact (3.5 pts), Technical Architecture (2.5 pts), Education & Credentials (2.0 pts), and LinkedIn Activeness & Industry Authority (2.0 pts). Every score is grounded in verifiable career data.',
    },
    {
      q: 'What does the AI Video Reel look like?',
      a: 'It is a 720p HD MP4 video with AI voice narration, highlighting candidate achievements, company milestones, tech stack keywords, and recruiter metrics ready for instant download and review.',
    },
    {
      q: 'How does the 45+ Live Tech Jobs matching work?',
      a: 'We maintain an active registry of 45+ tech opportunities across Google, Swiggy, Microsoft, and high-growth unicorns. Candidates can 1-click apply, with applications synced automatically to our recruiter Google Sheets pipeline.',
    },
    {
      q: 'How does the Pro Membership work?',
      a: 'Pro unlocks unlimited candidate profile evaluations, full 720p video downloads, 1-on-1 FAANG mock interview slots, and priority applications for just ₹100/month processed securely via Razorpay.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a13] text-slate-800 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors duration-300 overflow-x-hidden relative">
      
      {/* ─────────────────────────────────────────────────────────────
          CINEMATIC BACKGROUND AURORA & LIGHTING
          ───────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-brand-600/20 via-indigo-500/25 to-purple-600/20 dark:from-brand-500/15 dark:via-purple-600/20 dark:to-cyan-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[600px] -left-48 w-[600px] h-[600px] bg-cyan-500/10 dark:bg-cyan-500/10 blur-[140px] rounded-full" />
        <div className="absolute top-[1200px] -right-48 w-[650px] h-[650px] bg-purple-500/10 dark:bg-purple-600/10 blur-[150px] rounded-full" />
        {/* Subtle geometric dot matrix */}
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035] dark:opacity-[0.06]" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TOP NAVIGATION BAR
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/5 bg-white/80 dark:bg-[#070a13]/80 backdrop-blur-2xl transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-fuchsia-600 p-[1.5px] shadow-lg shadow-brand-500/20">
              <div className="w-full h-full bg-white dark:bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
                <Film className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-indigo-900 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                ProfileReel AI
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                One Profile. One AI. One Powerful Story.
              </p>
            </div>
          </div>

          {/* Links & CTA */}
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <a href="#interactive-preview" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                Live Simulator
              </a>
              <a href="#features" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                Workflow
              </a>
              <a href="#comparison" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                Resume vs AI
              </a>
              <a href="#faq" className="hover:text-brand-600 dark:hover:text-white transition-colors">
                FAQ
              </a>
            </nav>

            {/* Dark / Light Mode Switch */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200/80 hover:border-slate-300 dark:border-white/10 bg-white hover:bg-slate-100 dark:bg-[#121827] dark:hover:bg-[#1a2336] text-slate-700 dark:text-slate-300 shadow-xs transition-all cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700 hover:text-brand-600 transition-colors" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
              )}
            </button>

            {/* Sign in with LinkedIn Primary Button */}
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs shadow-lg shadow-[#0A66C2]/25 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span>Sign In with LinkedIn</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION (High-Impact Headline & Value Prop)
          ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 pb-12 text-center max-w-6xl mx-auto px-4">
        
        {/* Pulsing Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 dark:bg-[#121827]/90 backdrop-blur-xl border border-brand-500/30 shadow-xl shadow-brand-500/10 text-xs font-bold text-brand-700 dark:text-brand-300 mb-8 hover:scale-105 transition-all duration-300 cursor-default">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-slate-800 dark:text-slate-200">Next-Gen AI Talent Intelligence</span>
          <span className="text-brand-400 dark:text-brand-500">•</span>
          <span className="bg-gradient-to-r from-brand-600 to-purple-600 dark:from-brand-400 dark:to-purple-400 bg-clip-text text-transparent">
            45+ Live Verified Roles Active
          </span>
        </div>

        {/* Master Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] mb-6 max-w-5xl mx-auto">
          Turn Any LinkedIn Profile Into An{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-500 dark:from-cyan-400 dark:via-indigo-400 dark:to-fuchsia-400 animate-gradient-x">
            AI Video Reel &amp; 10-Point Score
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          From raw profile link to an AI-narrated 720p cinematic reel, verifiable multi-dimensional evaluation, and 1-click matches to 45+ elite FAANG tech opportunities.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto mb-16">
          <button
            type="button"
            onClick={onOpenLogin}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0A66C2] via-blue-600 to-indigo-600 hover:from-[#004182] hover:to-indigo-700 text-white font-extrabold text-sm shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            <span>Launch Dashboard with LinkedIn</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#interactive-preview"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-[#121827] border border-slate-200 dark:border-white/10 hover:border-brand-500/40 text-slate-800 dark:text-slate-200 font-bold text-sm shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center gap-2"
          >
            <span>Try Live Simulator</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            THE "WOW" CENTERPIECE: INTERACTIVE LIVE PRODUCT SIMULATOR
            ───────────────────────────────────────────────────────────── */}
        <div id="interactive-preview" className="relative max-w-5xl mx-auto text-left">
          
          {/* Glowing Ambient Halo behind the Mockup */}
          <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 opacity-30 dark:opacity-40 blur-2xl -z-10 animate-pulse" />

          {/* Master 3D-feeling Floating Shell */}
          <div className="rounded-[32px] bg-white dark:bg-[#0c121e] border-2 border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden transition-all duration-300">
            
            {/* Window Topbar with Profile Selector Tabs */}
            <div className="px-5 py-4 bg-slate-100/90 dark:bg-[#111927]/90 border-b border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                  profilereel-ai-studio // live-candidate-eval
                </span>
              </div>

              {/* Interactive Profile Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/80 dark:bg-charcoal-900/90 text-xs font-bold">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider px-2 hidden md:inline">
                  Select Profile:
                </span>
                {DEMO_PROFILES.map((p) => {
                  const isActive = p.id === selectedDemo.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedDemo(p);
                        setProgress(15);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-white dark:bg-brand-600 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{p.name.split(' ')[0]}</span>
                      <span className="text-[10px] opacity-75 font-mono">({p.score})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mockup Body: Split Video Reel & 10-Point Score Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (7 cols): The 720p HD AI Video Reel Mockup */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      720p HD Dynamic AI Reel
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    Remotion Engine • ~47s
                  </span>
                </div>

                {/* The Player Box */}
                <div className="relative rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-2xl aspect-[16/10] flex flex-col justify-between p-5 text-white">
                  
                  {/* Subtle Video Background Grid Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0b1329] via-[#091b36] to-[#040814] -z-10" />
                  <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-15 -z-10" />

                  {/* Player Top Header */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={selectedDemo.avatar}
                        alt={selectedDemo.name}
                        className="w-10 h-10 rounded-full border-2 border-brand-400 object-cover shadow-md"
                      />
                      <div>
                        <div className="text-sm font-extrabold flex items-center gap-1.5">
                          <span>{selectedDemo.name}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                        </div>
                        <div className="text-[10px] text-slate-300 font-medium line-clamp-1">
                          {selectedDemo.role}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold tracking-wide">
                      720p HD • 60 FPS
                    </span>
                  </div>

                  {/* Center Play Indicator & Dynamic Subtitle Quote */}
                  <div className="my-auto text-center z-10 py-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center mx-auto mb-3 shadow-xl shadow-brand-500/40 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-white" />
                      ) : (
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      )}
                    </button>
                    
                    <div className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 max-w-md mx-auto text-xs text-slate-200 italic font-medium leading-relaxed">
                      &ldquo;{selectedDemo.quote}&rdquo;
                    </div>

                    {/* Animated Audio Frequency Bars */}
                    <div className="flex items-center justify-center gap-1 mt-3 h-5">
                      {[35, 65, 20, 85, 45, 95, 70, 30, 90, 50, 100, 60, 40, 80, 55, 30, 75, 40].map((h, i) => (
                        <span
                          key={i}
                          className={`w-1 bg-cyan-400 rounded-full transition-all duration-300 ${
                            isPlaying ? 'animate-pulse' : 'opacity-40'
                          }`}
                          style={{
                            height: isPlaying ? `${h}%` : '20%',
                            animationDelay: `${i * 0.08}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Player Bottom Control Bar */}
                  <div className="z-10 space-y-2 pt-2 border-t border-white/10">
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                      <div
                        className="h-full bg-gradient-to-r from-brand-400 to-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                      <span>0:{Math.floor((progress * 47) / 100).toString().padStart(2, '0')} / 0:47</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className="hover:text-white transition-colors cursor-pointer"
                        >
                          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> MP4 Ready
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Skill Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-slate-400 font-semibold mr-1">Verified Stack:</span>
                  {selectedDemo.topSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#161f30] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column (5 cols): 10-Point Score Gauge & Matched Role Preview */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 10-Point Score Card */}
                <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-[#101726] border border-slate-200 dark:border-white/5 shadow-inner space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Algorithmic Evaluation
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        10-Point Scorecard
                      </h4>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      {selectedDemo.tier}
                    </span>
                  </div>

                  {/* Radial Gauge Display */}
                  <div className="flex items-center gap-4 py-1">
                    <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                          className="text-slate-200 dark:text-charcoal-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500 transition-all duration-700 ease-out"
                          strokeDasharray={`${parseFloat(selectedDemo.score) * 10}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {selectedDemo.score}
                        </span>
                        <span className="text-[9px] text-slate-400 block -mt-1 font-bold">/ 10</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                      <strong className="text-slate-900 dark:text-white block font-bold mb-0.5">
                        High Fit For Tier-1 Companies
                      </strong>
                      Candidate qualifies for accelerated technical rounds and senior architectural roles.
                    </div>
                  </div>

                  {/* 4 Score Metric Meters */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-white/5 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        <span>Experience &amp; Leadership</span>
                        <span className="font-mono text-brand-600 dark:text-brand-400">{selectedDemo.experienceScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full w-[95%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        <span>Technical Depth &amp; Scale</span>
                        <span className="font-mono text-brand-600 dark:text-brand-400">{selectedDemo.techScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full w-[90%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        <span>Education &amp; Credentials</span>
                        <span className="font-mono text-brand-600 dark:text-brand-400">{selectedDemo.eduScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full w-[75%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        <span>LinkedIn Industry Authority</span>
                        <span className="font-mono text-brand-600 dark:text-brand-400">{selectedDemo.socialScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-charcoal-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full w-[85%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Role Match Engine Preview */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/10 via-purple-500/5 to-transparent border border-brand-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600 dark:text-brand-400">
                      ⚡ AI Job Match Engine
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedDemo.matchedRole.match}
                    </span>
                  </div>

                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mb-0.5">
                    {selectedDemo.matchedRole.title}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span>{selectedDemo.matchedRole.company}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedDemo.matchedRole.salary}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-xs hover:bg-brand-600 dark:hover:bg-brand-400 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>1-Click Apply to 45+ Roles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          ENTERPRISE TRUST STRIP
          ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 mb-24">
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#0c121e]/70 border border-slate-200 dark:border-white/5 backdrop-blur-md text-center">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-4">
            Designed for high-impact candidate evaluation across top tech enterprises
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-80 grayscale hover:grayscale-0 transition-all duration-300 text-sm font-extrabold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">☁️ Salesforce</span>
            <span className="flex items-center gap-1.5">⚡ Google</span>
            <span className="flex items-center gap-1.5">💼 Intuit</span>
            <span className="flex items-center gap-1.5">🟧 Oracle</span>
            <span className="flex items-center gap-1.5">🛵 Swiggy</span>
            <span className="flex items-center gap-1.5">✈️ MakeMyTrip</span>
            <span className="flex items-center gap-1.5">🌐 OpenText</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BENTO GRID SHOWCASE (High-Fidelity UI Art)
          ───────────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-4 mb-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Next-Level Capability Suite</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
            Everything You Need To Assess Talent In Seconds
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Replace tedious resume skimming with rich, dynamic video dossiers, verified career facts, and instant job matching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Bento Card 1: 🎬 720p Remotion Video Generator (8 cols) */}
          <div className="md:col-span-8 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 dark:from-[#0c121e] dark:via-[#101726] dark:to-[#0c121e] border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-brand-500/30 transition-all">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> Remotion Video Engine
                </span>
                <span className="text-xs text-emerald-500 font-bold font-mono">
                  60 FPS • Canvas Synthesized
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                Broadcast-Quality Video Reels
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                We generate high-definition animated video reels with AI voice narration, highlighting career trajectory, tech milestones, and quantified business impact.
              </p>
            </div>

            {/* Visual Timeline Track Slice */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                <span>Timeline: 00:00 - 00:47</span>
                <span className="text-cyan-400">Audio Track: ElevenLabs Studio Voice</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <div className="text-[10px] text-slate-400">Scene 1 (0-15s)</div>
                  <div className="text-xs font-bold text-slate-200">Career Overview</div>
                </div>
                <div className="p-2.5 rounded-lg bg-brand-900/40 border border-brand-500/40">
                  <div className="text-[10px] text-brand-300">Scene 2 (16-32s)</div>
                  <div className="text-xs font-bold text-white">Tech Architecture</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <div className="text-[10px] text-slate-400">Scene 3 (33-47s)</div>
                  <div className="text-xs font-bold text-slate-200">FAANG Suitability</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: 📊 10-Point Radar Gauge (4 cols) */}
          <div className="md:col-span-4 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-purple-50/40 dark:from-[#0c121e] dark:via-[#101726] dark:to-[#0c121e] border border-slate-200 dark:border-white/10 shadow-xl flex flex-col justify-between hover:border-purple-500/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> 10-Point Scale
                </span>
                <span className="text-xs text-brand-500 font-bold">Unbiased</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                Recruiter Intelligence
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Structured rating eliminating recruiter guesswork and unconscious bias.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#121827] border border-slate-200 dark:border-white/5 text-center">
              <div className="text-3xl font-black text-slate-900 dark:text-white">9.4</div>
              <div className="text-xs font-bold text-emerald-500">Top 1% Percentile</div>
              <div className="text-[11px] text-slate-500 mt-1">Ready for Staff &amp; Principal Hiring</div>
            </div>
          </div>

          {/* Bento Card 3: 💼 45+ Verified Live Tech Roles (6 cols) */}
          <div className="md:col-span-6 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-[#0c121e] dark:via-[#101726] dark:to-[#0c121e] border border-slate-200 dark:border-white/10 shadow-xl hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> 45+ Verified Roles
              </span>
              <span className="text-xs text-emerald-500 font-bold">Live Synced</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
              Google Sheets Auto-Sync
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
              1-click candidate applications dispatch immediately to active recruiter tracking spreadsheets.
            </p>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white dark:bg-[#121827] border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Staff Software Engineer</div>
                  <div className="text-[11px] text-slate-500">Google • Bengaluru</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹65L - ₹95L</div>
                  <span className="text-[10px] text-brand-600 font-bold">1-Click Apply →</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-[#121827] border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Principal Architect</div>
                  <div className="text-[11px] text-slate-500">Swiggy • Hybrid</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹75L - ₹1.1Cr</div>
                  <span className="text-[10px] text-brand-600 font-bold">1-Click Apply →</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 4: 🎓 Staff Mock Interviews (6 cols) */}
          <div className="md:col-span-6 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-pink-50/40 dark:from-[#0c121e] dark:via-[#101726] dark:to-[#0c121e] border border-slate-200 dark:border-white/10 shadow-xl hover:border-pink-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> 1-on-1 Mentorship
              </span>
              <span className="text-xs text-purple-500 font-bold">FAANG Staff</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
              Staff Engineer Mock Interviews
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
              1-on-1 interview slots with Google &amp; Swiggy Staff Engineers, plus certified Stanford &amp; DeepLearning.AI pathways.
            </p>

            <div className="p-3 rounded-xl bg-white dark:bg-[#121827] border border-slate-200/80 dark:border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                SS
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Saurabh Sharma • Google Staff Engineer</div>
                <div className="text-[11px] text-slate-500">System Design &amp; Scalability (1-on-1 Slot)</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                Book Slot
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          HOW IT WORKS (3 Simple Steps)
          ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 mb-28">
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Seamless Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            How ProfileReel AI Works
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Zero setup required. From raw profile link to actionable evaluation in three smooth steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Paste LinkedIn URL',
              desc: 'Enter any public LinkedIn profile URL. Authorized Apify adapters ingest verified career history, positions, and publications.',
              icon: Compass,
              color: 'from-blue-500 to-brand-500',
            },
            {
              step: '02',
              title: 'AI Synthesis & Scoring',
              desc: 'Our AI engine calculates a verified 10-point evaluation across technical skills, leadership scale, and educational credentials.',
              icon: Cpu,
              color: 'from-brand-500 to-purple-500',
            },
            {
              step: '03',
              title: 'Video Reel & 1-Click Apply',
              desc: 'Watch and download the 720p HD AI Video Reel, and immediately apply to 45+ matching FAANG tech opportunities.',
              icon: Video,
              color: 'from-purple-500 to-pink-500',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-7 rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 shadow-lg relative group hover:border-brand-500/40 transition-all hover:-translate-y-1"
              >
                <div className="text-4xl font-black text-slate-200 dark:text-charcoal-800 mb-4 font-mono group-hover:text-brand-500/30 transition-colors">
                  {item.step}
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${item.color} text-white flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          COMPARISON TABLE (Traditional Resume vs ProfileReel AI)
          ───────────────────────────────────────────────────────────── */}
      <section id="comparison" className="max-w-4xl mx-auto px-4 mb-28">
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600 dark:text-brand-400">
              The Evolution of Talent Screening
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Static PDF Resumes vs. ProfileReel AI
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-charcoal-800 text-slate-500 dark:text-slate-400">
                  <th className="pb-4 font-semibold">Evaluation Metric</th>
                  <th className="pb-4 font-semibold text-rose-500">Traditional PDF Resume</th>
                  <th className="pb-4 font-bold text-brand-600 dark:text-brand-400">ProfileReel AI ✨</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-charcoal-800">
                <tr>
                  <td className="py-4 font-medium text-slate-800 dark:text-slate-200">Format &amp; Engagement</td>
                  <td className="py-4 text-slate-500">Static 2-page text document</td>
                  <td className="py-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                    <Check className="w-4 h-4 text-emerald-500" /> Dynamic 720p Narrated Video Reel
                  </td>
                </tr>
                <tr>
                  <td className="py-4 font-medium text-slate-800 dark:text-slate-200">Objective Rating</td>
                  <td className="py-4 text-slate-500">Subjective recruiter skimming</td>
                  <td className="py-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                    <Check className="w-4 h-4 text-emerald-500" /> Algorithmic 10-Point Scorecard
                  </td>
                </tr>
                <tr>
                  <td className="py-4 font-medium text-slate-800 dark:text-slate-200">Career Role Matching</td>
                  <td className="py-4 text-slate-500">Manual searching on job boards</td>
                  <td className="py-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                    <Check className="w-4 h-4 text-emerald-500" /> 45+ Live Verified FAANG Roles
                  </td>
                </tr>
                <tr>
                  <td className="py-4 font-medium text-slate-800 dark:text-slate-200">Interview Preparation</td>
                  <td className="py-4 text-slate-500">Self-guided guessing</td>
                  <td className="py-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                    <Check className="w-4 h-4 text-emerald-500" /> 1-on-1 FAANG Staff Mock Interviews
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FAQ ACCORDION
          ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="max-w-3xl mx-auto px-4 mb-28">
        <div className="text-center mb-10">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Frequently Asked Questions
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Clear answers to how ProfileReel AI scoring, video reels, and payments work.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM CALL TO ACTION BANNER (Magnetic Final Push)
          ───────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <div className="p-8 sm:p-14 rounded-[36px] bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white text-center shadow-2xl shadow-brand-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready To Score Your Next Candidate?
            </h3>
            <p className="text-sm sm:text-base text-indigo-100 leading-relaxed font-normal">
              Sign in with your LinkedIn account to unlock the full ProfileReel AI dashboard and begin analyzing profiles in seconds.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-8 py-4 rounded-full bg-white text-[#0A66C2] hover:bg-slate-100 font-extrabold text-sm shadow-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span>Launch Dashboard with LinkedIn</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Strip */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2026 ProfileReel AI. Built for enterprise talent intelligence and career acceleration.</p>
      </footer>
    </div>
  );
};

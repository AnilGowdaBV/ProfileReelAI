import React, { useState, useEffect, useRef } from 'react';
import {
  Candidate,
  CandidateFact,
  FactCategory,
  VideoMetadata,
  CandidateScore,
} from '../types/candidate';
import { StatusBadge } from './StatusBadge';
import { VideoReelPlayer } from './VideoReelPlayer';
import { CandidateScoreCard } from './CandidateScoreCard';
import { BestSuitedRolesCard } from './BestSuitedRolesCard';
import {
  WorkedAtCompaniesHeaderRow,
  CompanyLogoBadge,
} from './WorkedAtCompanies';
import { api } from '../services/api';
import {
  User,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles,
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Video,
  Loader2,
  Play,
  X,
  Camera,
} from 'lucide-react';

interface CandidateDetailsCardProps {
  candidate: Candidate;
  isProcessing?: boolean;
  onClose?: () => void;
  onScoreCalculated?: (score: CandidateScore | null) => void;
}

export const CandidateDetailsCard: React.FC<CandidateDetailsCardProps> = ({
  candidate,
  isProcessing = false,
  onClose,
  onScoreCalculated,
}) => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [videoError, setVideoError] = useState<string | null>(null);

  // Avatar Upload / Edit state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPlaceholderSvg = (url?: string | null) =>
    !url ||
    url.includes('static.licdn.com/aero-v1/sc/h/') ||
    url.includes('ghost_person') ||
    url.toLowerCase().endsWith('.svg');

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    candidate.profilePictureUrl && !isPlaceholderSvg(candidate.profilePictureUrl)
      ? candidate.profilePictureUrl
      : null,
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState(false);

  useEffect(() => {
    if (candidate.profilePictureUrl && !isPlaceholderSvg(candidate.profilePictureUrl)) {
      setAvatarUrl(candidate.profilePictureUrl);
    } else {
      setAvatarUrl(null);
    }
  }, [candidate.id, candidate.profilePictureUrl]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidate.id) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Profile picture must be smaller than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await api.updateProfilePicture(candidate.id, base64);
        setAvatarUrl(res.profilePictureUrl || base64);
        candidate.profilePictureUrl = res.profilePictureUrl || base64;
        setAvatarSuccessMsg(true);
        setTimeout(() => setAvatarSuccessMsg(false), 5000);
      } catch (err: any) {
        console.error('Failed to update profile picture:', err);
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Profile Scoring state
  const [score, setScore] = useState<CandidateScore | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState<boolean>(false);

  // Check for existing score on load or candidate change
  useEffect(() => {
    let isMounted = true;
    async function loadScore() {
      if (candidate.id && candidate.retrievalStatus === 'SUCCESS') {
        setIsLoadingScore(true);
        try {
          const scoreData = await api.getCandidateScore(candidate.id);
          if (isMounted) {
            setScore(scoreData);
            onScoreCalculated?.(scoreData);
          }
        } catch (err) {
          console.error('Failed to load candidate score:', err);
          if (isMounted) onScoreCalculated?.(null);
        } finally {
          if (isMounted) setIsLoadingScore(false);
        }
      } else {
        setScore(null);
        onScoreCalculated?.(null);
      }
    }
    loadScore();
    return () => {
      isMounted = false;
    };
  }, [candidate.id, candidate.retrievalStatus]);

  const handleRefreshScore = async () => {
    if (!candidate.id) return;
    setIsLoadingScore(true);
    try {
      const scoreData = await api.calculateCandidateScore(candidate.id);
      setScore(scoreData);
      onScoreCalculated?.(scoreData);
    } catch (err) {
      console.error('Failed to calculate candidate score:', err);
    } finally {
      setIsLoadingScore(false);
    }
  };

  // Check for existing video on load or candidate change
  useEffect(() => {
    let isMounted = true;
    async function checkExistingVideo() {
      if (candidate.id && candidate.retrievalStatus === 'SUCCESS') {
        try {
          const existing = await api.getLatestVideo(candidate.id);
          if (isMounted && existing && existing.status === 'READY') {
            setVideo(existing);
          } else if (isMounted) {
            setVideo(null);
          }
        } catch {
          if (isMounted) setVideo(null);
        }
      } else {
        setVideo(null);
      }
    }
    checkExistingVideo();
    return () => {
      isMounted = false;
    };
  }, [candidate.id, candidate.retrievalStatus]);

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    setVideoError(null);
    setGenerationStage('Synthesizing professional introduction script...');

    const timer1 = setTimeout(() => {
      setGenerationStage('Generating high-quality voice narration audio...');
    }, 2500);

    const timer2 = setTimeout(() => {
      setGenerationStage('Composing animated video cards & rendering MP4 with FFmpeg...');
    }, 6000);

    try {
      const response = await api.generateVideo(candidate.id);
      setVideo({
        id: response.videoId,
        candidateId: response.candidateId,
        script: response.script,
        durationSeconds: response.durationSeconds,
        status: response.status,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Video generation failed:', err);
      setVideoError(err.message || 'Failed to generate video reel');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsGeneratingVideo(false);
      setGenerationStage('');
    }
  };

  const factsByCategory: Record<FactCategory, CandidateFact[]> = {
    headline: [],
    summary: [],
    experience: [],
    skills: [],
    education: [],
    certification: [],
  };

  if (candidate.facts) {
    for (const fact of candidate.facts) {
      if (factsByCategory[fact.category]) {
        factsByCategory[fact.category].push(fact);
      }
    }
  }

  const isUnavailable = candidate.retrievalStatus === 'PROFILE_DATA_UNAVAILABLE';
  const isSuccess = candidate.retrievalStatus === 'SUCCESS';

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Candidate Avatar with Upload / Edit Overlay */}
            <div className="relative group flex-shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload or update candidate profile photo"
                className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-accent p-0.5 shadow-xl shadow-brand-500/20 cursor-pointer relative overflow-hidden"
              >
                <div className="w-full h-full bg-slate-100 dark:bg-charcoal-900 rounded-[14px] flex items-center justify-center overflow-hidden relative">
                  {avatarUrl && !isPlaceholderSvg(avatarUrl) ? (
                    <img
                      src={avatarUrl}
                      alt={candidate.displayName || 'Candidate profile picture'}
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-600/15 to-brand-accent/20 text-brand-600 dark:text-brand-300 font-bold text-lg">
                      {(candidate.displayName || 'PR')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}

                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    {isUploadingAvatar ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Small Camera Badge on corner */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload custom photo"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-charcoal-900 cursor-pointer"
              >
                <Camera className="w-2.5 h-2.5" />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {candidate.displayName || 'Candidate Profile'}
                </h3>
                <StatusBadge status={candidate.retrievalStatus} />
                {avatarSuccessMsg && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold animate-pulse">
                    ✓ Photo updated! Re-generate reel to show in video
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <a
                  href={candidate.normalizedProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 transition-colors"
                >
                  <span>{candidate.normalizedProfileUrl}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {candidate.facts?.find((f) => f.factText.startsWith('LinkedIn Network:')) && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                    {candidate.facts.find((f) => f.factText.startsWith('LinkedIn Network:'))?.factText.replace('LinkedIn Network:', '').trim()}
                  </span>
                )}
                {candidate.facts?.find((f) => f.factText.startsWith('LinkedIn Engagement:')) && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                    {candidate.facts.find((f) => f.factText.startsWith('LinkedIn Engagement:'))?.factText.replace('LinkedIn Engagement:', '').trim()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar: Smooth Re-evaluate & Clear Profile */}
          <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
            {isSuccess && (
              <button
                type="button"
                id="refresh-profile-score-button"
                onClick={handleRefreshScore}
                disabled={isLoadingScore}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/15 border border-brand-500/25 text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                title="Re-evaluate candidate profile score"
              >
                {isLoadingScore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600 dark:text-brand-400" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Re-evaluate Score</span>
                  </>
                )}
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 border border-slate-200 dark:bg-charcoal-850 dark:hover:bg-charcoal-800 dark:text-slate-400 dark:hover:text-rose-300 dark:border-white/10 text-xs font-medium transition-all cursor-pointer shadow-xs"
                title="Clear profile and search another candidate"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Worked at Companies with Verified Brand Logos */}
        {isSuccess && <WorkedAtCompaniesHeaderRow facts={candidate.facts} />}

        {/* Pipeline Stage Indicators - Commented per user request */}
        {/*
        <div className="mt-5 pt-1">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Pipeline Progress
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              {video ? 'Video Reel Ready & Verified' : isSuccess ? 'Facts verified – Ready for Video Reel' : candidate.retrievalStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="text-[11px]">
                <p className="font-semibold text-slate-900 dark:text-white">1. URL Validated</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-[10px]">Syntax &amp; safety verified</p>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : isUnavailable
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-100 dark:bg-charcoal-850 border-slate-200 dark:border-white/5'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : isUnavailable ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <div className="text-[11px]">
                <p className="font-semibold text-slate-900 dark:text-white">2. Profile Ingestion</p>
                <p
                  className={`text-[10px] ${
                    isSuccess
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isUnavailable
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isSuccess
                    ? 'Authorized Profile'
                    : isUnavailable
                    ? 'Data Unavailable'
                    : 'Awaiting'}
                </p>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-100/60 dark:bg-charcoal-850/50 border-slate-200 dark:border-white/5 opacity-60'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 flex-shrink-0 ${
                  isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <div className="text-[11px]">
                <p className="font-semibold text-slate-900 dark:text-white">3. Fact Normalization</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isSuccess ? `${candidate.facts.length} facts extracted` : 'Pending'}
                </p>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                score
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : isLoadingScore
                  ? 'bg-brand-500/20 border-brand-500/40 animate-pulse'
                  : 'bg-slate-100/80 dark:bg-charcoal-850/50 border-slate-200 dark:border-white/5 opacity-80'
              }`}
            >
              <Award
                className={`w-4 h-4 flex-shrink-0 ${
                  score ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600 dark:text-brand-400'
                }`}
              />
              <div className="text-[11px]">
                <p className="font-semibold text-slate-900 dark:text-slate-200">4. Profile Score</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {score
                    ? `Score: ${score.overallScore}/10 (${score.tier})`
                    : isLoadingScore
                    ? 'Computing score...'
                    : 'Ready to evaluate'}
                </p>
              </div>
            </div>
          </div>
        </div>
        */}
      </div>

      {/* Candidate Profile Score & Compact AI Video Reel */}
      {isSuccess && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column: 10-Point Score Board & Recruiter Intelligence */}
          <div className="lg:col-span-7 space-y-6">
            <CandidateScoreCard
              score={score}
              isLoading={isLoadingScore}
              onRefreshScore={handleRefreshScore}
              candidateName={candidate.displayName}
            />
          </div>

          {/* Side Column: AI Video Reel & Best Suitable For Card */}
          <div className="lg:col-span-5 space-y-6">
            <VideoReelPlayer
              videoId={video?.id}
              candidateName={candidate.displayName || 'Candidate'}
              script={video?.script}
              durationSeconds={video?.durationSeconds}
              onGenerate={handleGenerateVideo}
              isGenerating={isGeneratingVideo}
              generationStage={generationStage}
              error={videoError}
            />

            {/* Candidate is Best Suitable For Card - Placed directly below video to eliminate whitespace */}
            <BestSuitedRolesCard
              candidateName={candidate.displayName}
              candidateLinkedinUrl={candidate.normalizedProfileUrl}
              score={score}
              candidateSkills={factsByCategory.skills.map((f) => f.factText)}
              candidateFacts={candidate.facts}
            />
          </div>
        </div>
      )}

      {/* Case 1: Data Unavailable Notice */}
      {isUnavailable && (
        <div className="glass-panel rounded-2xl p-6 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">
                Profile Data Unavailable (Strict Integrity Safeguard)
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                In compliance with strict data privacy guidelines, ProfileReel AI does not scrape, bypass CAPTCHAs,
                or invent candidate credentials. Because no authorized data was returned for this profile,
                video script generation is disabled.
              </p>
              <div className="p-3.5 rounded-xl bg-charcoal-900 border border-white/5 text-xs text-slate-400 font-mono">
                Status: PROFILE_DATA_UNAVAILABLE | Zero Hallucination Mode Active
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case 2: Success - Verified Candidate Facts Display (Commented out per user request) */}
      {false && isSuccess && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          // Main Column: Headline, Summary, Experience
          <div className="lg:col-span-2 space-y-6">
            // Headline & Summary
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Professional Summary &amp; Position
              </h4>

              {factsByCategory.headline.length > 0 && (
                <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-charcoal-900/80 border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block mb-1">
                    Verified Headline
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {factsByCategory.headline[0].factText}
                  </p>
                </div>
              )}

              {factsByCategory.summary.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-charcoal-900/80 border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Source Summary
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {factsByCategory.summary[0].factText}
                  </p>
                </div>
              )}
            </div>

            // Career Timeline / Experiences
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Verified Career Milestones ({factsByCategory.experience.length})
              </h4>

              <div className="space-y-3">
                {factsByCategory.experience.map((exp, idx) => {
                  const atMatch = exp.factText.match(/\bat\s+([^(:\n,]+)/i);
                  const companyName = atMatch
                    ? atMatch[1].replace(/\s+(from|during|since|in|tenure).*/i, '').replace(/\b(19|20)\d{2}\b.*/, '').trim()
                    : '';

                  return (
                    <div
                      key={exp.id || idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-charcoal-900/70 border border-slate-200 dark:border-white/5 hover:border-brand-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {companyName && (
                            <div className="mt-0.5 flex-shrink-0">
                              <CompanyLogoBadge company={companyName} size="md" />
                            </div>
                          )}
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                            {exp.factText}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                          VERIFIED
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          // Right Column: Skills, Education, Certifications
          <div className="space-y-6">
            // Skills
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Verified Skills ({factsByCategory.skills.length})
              </h4>

              <div className="flex flex-wrap gap-1.5">
                {factsByCategory.skills.map((skill, idx) => (
                  <span
                    key={skill.id || idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20"
                  >
                    {skill.factText}
                  </span>
                ))}
              </div>
            </div>

            // Education
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Education ({factsByCategory.education.length})
              </h4>

              <div className="space-y-2">
                {factsByCategory.education.map((edu, idx) => (
                  <div
                    key={edu.id || idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-charcoal-900/70 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-200"
                  >
                    {edu.factText}
                  </div>
                ))}
              </div>
            </div>

            // Certifications
            {factsByCategory.certification.length > 0 && (
              <div className="glass-panel rounded-2xl p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Certifications ({factsByCategory.certification.length})
                </h4>

                <div className="space-y-2">
                  {factsByCategory.certification.map((cert, idx) => (
                    <div
                      key={cert.id || idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-charcoal-900/70 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-200"
                    >
                      {cert.factText}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

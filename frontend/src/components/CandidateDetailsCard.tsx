import React, { useState, useEffect } from 'react';
import {
  Candidate,
  CandidateFact,
  FactCategory,
  VideoMetadata,
  CandidateScore,
} from '../types/candidate';
import { StatusBadge } from './StatusBadge';
import { MockBadge } from './MockBadge';
import { VideoReelPlayer } from './VideoReelPlayer';
import { CandidateScoreCard } from './CandidateScoreCard';
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
} from 'lucide-react';

interface CandidateDetailsCardProps {
  candidate: Candidate;
  isProcessing?: boolean;
}

export const CandidateDetailsCard: React.FC<CandidateDetailsCardProps> = ({
  candidate,
  isProcessing = false,
}) => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [videoError, setVideoError] = useState<string | null>(null);

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
          if (isMounted) setScore(scoreData);
        } catch (err) {
          console.error('Failed to load candidate score:', err);
        } finally {
          if (isMounted) setIsLoadingScore(false);
        }
      } else {
        setScore(null);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-accent p-0.5 shadow-xl shadow-brand-500/20 flex-shrink-0">
              <div className="w-full h-full bg-charcoal-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                {candidate.profilePictureUrl ? (
                  <img
                    src={candidate.profilePictureUrl}
                    alt={candidate.displayName || 'Candidate profile picture'}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <User className="w-7 h-7 text-brand-300" />
                )}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-white">
                  {candidate.displayName || 'Candidate Profile'}
                </h3>
                <StatusBadge status={candidate.retrievalStatus} />
                <MockBadge />
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <a
                  href={candidate.normalizedProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                >
                  <span>{candidate.normalizedProfileUrl}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {candidate.facts?.find((f) => f.factText.startsWith('LinkedIn Network:')) && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-medium">
                    {candidate.facts.find((f) => f.factText.startsWith('LinkedIn Network:'))?.factText.replace('LinkedIn Network:', '').trim()}
                  </span>
                )}
                {candidate.facts?.find((f) => f.factText.startsWith('LinkedIn Engagement:')) && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 font-medium">
                    {candidate.facts.find((f) => f.factText.startsWith('LinkedIn Engagement:'))?.factText.replace('LinkedIn Engagement:', '').trim()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button: Profile Score */}
          {isSuccess && (
            <div className="flex items-center">
              <button
                type="button"
                id="refresh-profile-score-button"
                onClick={handleRefreshScore}
                disabled={isLoadingScore}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-accent hover:from-brand-500 hover:to-brand-accent text-white font-bold text-xs shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoadingScore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Evaluating Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    <span>Re-evaluate Profile Score</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Pipeline Stage Indicators */}
        <div className="mt-5 pt-1">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              Pipeline Progress
            </span>
            <span className="text-slate-400 text-[11px]">
              {video ? 'Video Reel Ready & Verified' : isSuccess ? 'Facts verified – Ready for Video Reel' : candidate.retrievalStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="text-[11px]">
                <p className="font-semibold text-white">1. URL Validated</p>
                <p className="text-emerald-400 text-[10px]">Syntax & safety verified</p>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : isUnavailable
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-charcoal-850 border-white/5'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : isUnavailable ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <div className="text-[11px]">
                <p className="font-semibold text-white">2. Profile Ingestion</p>
                <p
                  className={`text-[10px] ${
                    isSuccess
                      ? 'text-emerald-400'
                      : isUnavailable
                      ? 'text-amber-400'
                      : 'text-slate-400'
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
                  : 'bg-charcoal-850/50 border-white/5 opacity-60'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 flex-shrink-0 ${
                  isSuccess ? 'text-emerald-400' : 'text-slate-500'
                }`}
              />
              <div className="text-[11px]">
                <p className="font-semibold text-white">3. Fact Normalization</p>
                <p className="text-[10px] text-slate-400">
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
                  : 'bg-charcoal-850/50 border-white/5 opacity-80'
              }`}
            >
              <Award
                className={`w-4 h-4 flex-shrink-0 ${
                  score ? 'text-emerald-400' : 'text-brand-400'
                }`}
              />
              <div className="text-[11px]">
                <p className="font-semibold text-slate-200">4. Profile Score</p>
                <p className="text-[10px] text-slate-400">
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

          {/* Side Column: AI Video Reel (Small / Compact Size) */}
          <div className="lg:col-span-5">
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

      {/* Case 2: Success - Verified Candidate Facts Display */}
      {isSuccess && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Headline, Summary, Experience */}
          <div className="lg:col-span-2 space-y-6">
            {/* Headline & Summary */}
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-400" />
                Professional Summary & Position
              </h4>

              {factsByCategory.headline.length > 0 && (
                <div className="mb-4 p-3.5 rounded-xl bg-charcoal-900/80 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-brand-400 block mb-1">
                    Verified Headline
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {factsByCategory.headline[0].factText}
                  </p>
                </div>
              )}

              {factsByCategory.summary.length > 0 && (
                <div className="p-3.5 rounded-xl bg-charcoal-900/80 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Source Summary
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {factsByCategory.summary[0].factText}
                  </p>
                </div>
              )}
            </div>

            {/* Career Timeline / Experiences */}
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-400" />
                Verified Career Milestones ({factsByCategory.experience.length})
              </h4>

              <div className="space-y-3">
                {factsByCategory.experience.map((exp, idx) => (
                  <div
                    key={exp.id || idx}
                    className="p-4 rounded-xl bg-charcoal-900/70 border border-white/5 hover:border-brand-500/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-100">
                        {exp.factText}
                      </p>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                        VERIFIED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Skills, Education, Certifications */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Verified Skills ({factsByCategory.skills.length})
              </h4>

              <div className="flex flex-wrap gap-1.5">
                {factsByCategory.skills.map((skill, idx) => (
                  <span
                    key={skill.id || idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20"
                  >
                    {skill.factText}
                  </span>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-400" />
                Education ({factsByCategory.education.length})
              </h4>

              <div className="space-y-2">
                {factsByCategory.education.map((edu, idx) => (
                  <div
                    key={edu.id || idx}
                    className="p-3 rounded-xl bg-charcoal-900/70 border border-white/5 text-xs text-slate-200"
                  >
                    {edu.factText}
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {factsByCategory.certification.length > 0 && (
              <div className="glass-panel rounded-2xl p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-400" />
                  Certifications ({factsByCategory.certification.length})
                </h4>

                <div className="space-y-2">
                  {factsByCategory.certification.map((cert, idx) => (
                    <div
                      key={cert.id || idx}
                      className="p-3 rounded-xl bg-charcoal-900/70 border border-white/5 text-xs text-slate-200"
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

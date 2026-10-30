import React, { useState } from 'react';
import {
  Film,
  Download,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  AlertTriangle,
  Video,
} from 'lucide-react';
import { API_BASE } from '../services/api';

export interface VideoReelPlayerProps {
  videoId?: string;
  candidateName: string;
  script?: string;
  durationSeconds?: number;
  onGenerate?: () => void;
  isGenerating?: boolean;
  generationStage?: string;
  error?: string | null;
}

export const VideoReelPlayer: React.FC<VideoReelPlayerProps> = ({
  videoId,
  candidateName,
  script,
  durationSeconds = 35,
  onGenerate,
  isGenerating = false,
  generationStage = '',
  error = null,
}) => {
  const [showScript, setShowScript] = useState(false);
  const streamUrl = videoId ? `${API_BASE}/videos/${videoId}/stream` : '';
  const downloadUrl = videoId ? `${API_BASE}/videos/${videoId}/download` : '';

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/10 relative overflow-hidden flex flex-col space-y-4">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Profile Reel</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/25">
                720p HD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ~{durationSeconds}s AI Narrated Video
            </p>
          </div>
        </div>

        {videoId && onGenerate && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            title="Re-generate Video Reel"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 dark:text-slate-300 dark:hover:text-white dark:border-white/10 text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Video Screen Area (Compact 16:9 Aspect Ratio) */}
      <div className="relative rounded-xl overflow-hidden bg-black/90 shadow-xl border border-white/10 aspect-video w-full flex items-center justify-center group">
        {videoId ? (
          /* Video Player when ready */
          <video
            key={videoId}
            src={streamUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-slate-950"
          >
            <source src={streamUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : isGenerating ? (
          /* Video Generating Loading State */
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
              <Film className="w-5 h-5 text-brand-400 absolute inset-0 m-auto" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Synthesizing AI Video Reel</p>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-[220px] line-clamp-2">
                {generationStage || 'Synthesizing voice narration and animated slides...'}
              </p>
            </div>
          </div>
        ) : (
          /* Video Placeholder / Generate Prompt */
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-2.5">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-600 to-brand-accent p-0.5 shadow-lg shadow-brand-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-charcoal-900 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-brand-300 fill-brand-300 ml-0.5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {candidateName}
              </p>
              <p className="text-[10px] text-slate-400">
                Grounded 35-second AI video introduction
              </p>
            </div>
            {onGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating}
                className="mt-1 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-accent hover:from-brand-500 hover:to-brand-accent text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate Video Reel</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-[11px]">{error}</span>
        </div>
      )}

      {/* Action Strip: Download Button when video is ready */}
      {videoId && (
        <div className="flex items-center gap-2">
          <a
            href={downloadUrl}
            download={`ProfileReel_${candidateName.replace(/\s+/g, '_')}.mp4`}
            id="download-video-mp4-button"
            className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download MP4</span>
          </a>
        </div>
      )}

      {/* Collapsible Script Accordion */}
      {script && (
        <div className="pt-2 border-t border-slate-200 dark:border-white/5">
          <button
            type="button"
            onClick={() => setShowScript(!showScript)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 dark:bg-charcoal-900/60 dark:hover:bg-charcoal-900 border border-slate-200 dark:border-white/5 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-300">
                AI Voiceover Script
              </span>
            </div>
            {showScript ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            )}
          </button>

          {showScript && (
            <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-white/5 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed max-h-36 overflow-y-auto animate-in fade-in">
              <p className="italic text-slate-500 dark:text-slate-400 text-[10px] mb-1">Narration Text:</p>
              <p className="text-slate-900 dark:text-slate-200">{script}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

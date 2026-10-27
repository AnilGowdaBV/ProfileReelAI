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
} from 'lucide-react';

import { API_BASE } from '../services/api';

interface VideoReelPlayerProps {
  videoId: string;
  candidateName: string;
  script?: string;
  durationSeconds?: number;
  onRegenerate?: () => void;
  isGenerating?: boolean;
}

export const VideoReelPlayer: React.FC<VideoReelPlayerProps> = ({
  videoId,
  candidateName,
  script,
  durationSeconds = 35,
  onRegenerate,
  isGenerating = false,
}) => {
  const [showScript, setShowScript] = useState(false);
  const streamUrl = `${API_BASE}/videos/${videoId}/stream`;
  const downloadUrl = `${API_BASE}/videos/${videoId}/download`;

  return (
    <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-brand-500/40 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Background glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-brand-400" />
              AI Video Reel Ready
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              720p HD MP4
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white">
            {candidateName} — Professional Introduction
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            Duration: ~{durationSeconds} seconds | Narrated Introduction
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <a
            href={downloadUrl}
            download={`ProfileReel_${candidateName.replace(/\s+/g, '_')}.mp4`}
            id="download-video-mp4-button"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download MP4</span>
          </a>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-white/10 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
            >
              Re-generate
            </button>
          )}
        </div>
      </div>

      {/* HTML5 Video Player Container */}
      <div className="relative rounded-xl overflow-hidden bg-black/90 shadow-2xl border border-white/10 aspect-video max-w-4xl mx-auto">
        <video
          key={videoId}
          src={streamUrl}
          controls
          playsInline
          className="w-full h-full object-contain"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Script Accordion */}
      {script && (
        <div className="mt-6 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={() => setShowScript(!showScript)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-charcoal-900/60 hover:bg-charcoal-900 border border-white/5 text-left transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold text-slate-200">
                AI Narrator Script (35s Voiceover)
              </span>
            </div>
            {showScript ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showScript && (
            <div className="mt-2 p-4 rounded-xl bg-charcoal-900 border border-white/5 text-xs text-slate-300 leading-relaxed font-sans animate-in fade-in">
              <p className="italic text-slate-400 mb-1">Spoken Narration:</p>
              <p className="text-slate-100">{script}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

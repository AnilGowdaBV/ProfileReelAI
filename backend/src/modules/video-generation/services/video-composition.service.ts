import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { GeneratedScript } from '../../script-generation/interfaces/script.interface';

@Injectable()
export class VideoCompositionService {
  private readonly logger = new Logger(VideoCompositionService.name);
  private ffmpegPath: string;

  constructor() {
    try {
      const ffmpeg = require('@ffmpeg-installer/ffmpeg');
      this.ffmpegPath = ffmpeg.path;
      this.logger.log(`Initialized VideoCompositionService with FFmpeg at: ${this.ffmpegPath}`);
    } catch (err: any) {
      this.logger.warn(`Could not load @ffmpeg-installer/ffmpeg, fallback to system 'ffmpeg': ${err.message}`);
      this.ffmpegPath = 'ffmpeg';
    }
  }

  async composeReelVideo(
    script: GeneratedScript,
    narrationWavPath: string,
    outputMp4Path: string,
    audioDurationSeconds?: number,
  ): Promise<{ videoPath: string; durationSeconds: number }> {
    const outputDir = path.dirname(outputMp4Path);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const hasAudio = fs.existsSync(narrationWavPath) && fs.statSync(narrationWavPath).size > 5000;
    
    // Ensure video duration matches audio or script length with a 1-second buffer
    const duration = Math.max(15, (audioDurationSeconds || script.estimatedDurationSeconds || 30) + 1);
    
    // Strictly sanitize text for FFmpeg drawtext to avoid filtergraph syntax errors
    const sanitizeFfmpeg = (str: string) =>
      (str || '')
        .replace(/[^\w\s\.,\-\/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const candidateName = sanitizeFfmpeg(script.candidateName || 'Candidate');
    const headline = sanitizeFfmpeg(script.headline || 'Professional').slice(0, 55);

    this.logger.log(`Rendering Profile Reel video for ${candidateName} (hasAudio=${hasAudio}, Duration: ${duration}s)...`);

    // Clean, readable typography and visual card layout
    const filterGraph = [
      // Elevated card box
      'drawbox=x=60:y=60:w=1160:h=600:color=0x151e32@0.95:t=fill',
      // Top violet accent bar
      'drawbox=x=60:y=60:w=1160:h=8:color=0x8b5cf6@1.0:t=fill',
      // Brand tag
      `drawtext=text='PROFILEREEL AI  |  VERIFIED CANDIDATE REEL':fontcolor=0x818cf8:fontsize=22:x=100:y=110`,
      // Candidate Name
      `drawtext=text='${candidateName}':fontcolor=white:fontsize=52:x=100:y=160`,
      // Headline
      `drawtext=text='${headline}':fontcolor=0x94a3b8:fontsize=24:x=100:y=235`,
      // Divider line
      'drawbox=x=100:y=280:w=1080:h=2:color=0x334155@0.8:t=fill',
      // Highlights title
      `drawtext=text='PROFESSIONAL CAREER HIGHLIGHTS':fontcolor=0xa78bfa:fontsize=22:x=100:y=310`,
      // Narration preview / captions box at bottom
      'drawbox=x=100:y=490:w=1080:h=130:color=0x0f172a@0.95:t=fill',
      'drawbox=x=100:y=490:w=6:h=130:color=0x38bdf8@1.0:t=fill',
      `drawtext=text='AI AGENT SPOKEN NARRATION':fontcolor=0x38bdf8:fontsize=15:x=130:y=515`,
      `drawtext=text='One Profile. One AI. One Powerful Story.':fontcolor=0xf1f5f9:fontsize=24:x=130:y=555`,
    ].join(',');

    let cmd: string;
    if (hasAudio) {
      this.logger.log(`Using real narration audio stream from: ${narrationWavPath}`);
      cmd = `"${this.ffmpegPath}" -y -f lavfi -i color=c=0x0b0f19:s=1280x720:d=${duration} -i "${narrationWavPath}" -vf "${filterGraph}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -ar 44100 -b:a 192k -shortest "${outputMp4Path}"`;
    } else {
      this.logger.warn(`No valid audio found at ${narrationWavPath}, using silent fallback audio`);
      cmd = `"${this.ffmpegPath}" -y -f lavfi -i color=c=0x0b0f19:s=1280x720:d=${duration} -f lavfi -i anullsrc=r=44100:cl=mono -vf "${filterGraph}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -shortest "${outputMp4Path}"`;
    }

    try {
      this.logger.log(`Executing FFmpeg video render pipeline...`);
      cp.execSync(cmd, { stdio: 'pipe', timeout: 120000 });

      if (fs.existsSync(outputMp4Path)) {
        const stats = fs.statSync(outputMp4Path);
        this.logger.log(`Successfully generated MP4 video (${stats.size} bytes) with audio at ${outputMp4Path}`);
        return {
          videoPath: outputMp4Path,
          durationSeconds: duration,
        };
      }
      throw new Error('Video file was not created by FFmpeg process');
    } catch (err: any) {
      const stderr = err.stderr ? err.stderr.toString() : err.message;
      this.logger.error(`FFmpeg video composition failed: ${stderr}`);
      throw new InternalServerErrorException(`Video composition failed: ${stderr}`);
    }
  }
}

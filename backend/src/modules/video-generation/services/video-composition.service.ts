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
        .replace(/[^\w\s\.,\-\/&]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const candidateName = sanitizeFfmpeg(script.candidateName || 'Candidate');
    const headline = sanitizeFfmpeg(script.headline || 'Professional').slice(0, 52);

    // Compute initials for avatar fallback (e.g. "Anil BV" -> "AB")
    const nameParts = candidateName.split(' ').filter(Boolean);
    const initials = nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : (candidateName.slice(0, 2) || 'PR').toUpperCase();

    // Detect clean modern fonts if running on Windows
    let boldFont = '';
    let regularFont = '';
    const winSegoeBold = 'C:/Windows/Fonts/segoeuib.ttf';
    const winSegoeReg = 'C:/Windows/Fonts/segoeui.ttf';
    if (fs.existsSync(winSegoeBold) && fs.existsSync(winSegoeReg)) {
      boldFont = "fontfile='C\\:/Windows/Fonts/segoeuib.ttf':";
      regularFont = "fontfile='C\\:/Windows/Fonts/segoeui.ttf':";
    }

    // LinkedIn network connections pill text
    const networkPill = sanitizeFfmpeg(
      script.connectionsCount
        ? `LinkedIn Network: ${script.connectionsCount} | Verified Talent`
        : 'LinkedIn Verified Network & Engaged Presence',
    );

    // Past companies string (casual - no years/dates)
    let companiesStr = 'Proven Industry Experience Across Leading Tech Teams';
    if (script.companies && script.companies.length > 0) {
      const sanitizedComps = script.companies.map(c => sanitizeFfmpeg(c)).filter(Boolean);
      if (sanitizedComps.length > 0) {
        companiesStr = sanitizedComps.slice(0, 4).join('  -  ');
      }
    }

    // Skills preview from scene 3 or default
    const skillsScene = script.scenes.find((s) => s.visual.tag === 'SKILLS');
    const skillsList = skillsScene?.visual.bullets?.map(b => sanitizeFfmpeg(b)).slice(0, 5) || [
      'Full-Stack Architecture',
      'Modern JavaScript/TypeScript',
      'Cloud & APIs',
    ];
    const skillsStr = skillsList.join('  -  ');

    // Spoken narration caption summary (casual)
    const captionText = sanitizeFfmpeg(
      `Meet ${candidateName} - Active on LinkedIn with verified experience.`,
    ).slice(0, 72);

    this.logger.log(`Rendering LinkedIn-styled Profile Reel video for ${candidateName} (hasAudio=${hasAudio}, Duration: ${duration}s)...`);

    // Attempt to download candidate's profile picture if valid URL exists
    let avatarLocalPath: string | null = null;
    if (script.profilePictureUrl && script.profilePictureUrl.trim()) {
      try {
        const rawPic = script.profilePictureUrl.trim();
        const avatarFile = path.join(outputDir, `avatar_${script.candidateId || 'cand'}.png`);
        if (rawPic.startsWith('data:image')) {
          const base64Data = rawPic.split(';base64,').pop();
          if (base64Data) {
            fs.writeFileSync(avatarFile, Buffer.from(base64Data, 'base64'));
            avatarLocalPath = avatarFile;
          }
        } else if (rawPic.startsWith('http://') || rawPic.startsWith('https://')) {
          const res = await fetch(rawPic);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            fs.writeFileSync(avatarFile, Buffer.from(buf));
            avatarLocalPath = avatarFile;
            this.logger.log(`Downloaded candidate profile picture to: ${avatarFile}`);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not download profile picture, using stylish avatar box: ${err.message}`);
      }
    }

    let cmd: string;

    if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
      // Composition WITH Profile Picture overlay
      const filterComplex = [
        '[0:v]drawbox=x=60:y=60:w=1160:h=600:color=0x151e32@0.98:t=fill,drawbox=x=60:y=60:w=1160:h=8:color=0x0a66c2@1.0:t=fill[card]',
        '[1:v]scale=120:120:force_original_aspect_ratio=increase,crop=120:120,format=rgba[avatar]',
        '[card][avatar]overlay=100:110[v1]',
        [
          `[v1]drawbox=x=98:y=108:w=124:h=124:color=0x0a66c2@1.0:t=2`,
          `drawtext=${boldFont}text='LINKEDIN VERIFIED CANDIDATE REEL':fontcolor=0x38bdf8:fontsize=16:x=246:y=112`,
          `drawtext=${boldFont}text='${candidateName}':fontcolor=white:fontsize=36:x=246:y=138`,
          `drawtext=${regularFont}text='${headline}':fontcolor=0x94a3b8:fontsize=18:x=246:y=184`,
          `drawbox=x=246:y=214:w=440:h=28:color=0x0a66c2@0.25:t=fill`,
          `drawbox=x=246:y=214:w=440:h=28:color=0x0a66c2@0.7:t=1`,
          `drawtext=${regularFont}text='${networkPill}':fontcolor=0x93c5fd:fontsize=13:x=258:y=221`,
          `drawbox=x=100:y=265:w=1080:h=2:color=0x334155@0.8:t=fill`,
          `drawtext=${boldFont}text='PAST COMPANIES & CAREER HIGHLIGHTS':fontcolor=0x38bdf8:fontsize=18:x=100:y=285`,
          `drawtext=${regularFont}text='${companiesStr}':fontcolor=white:fontsize=22:x=100:y=316`,
          `drawtext=${boldFont}text='KEY VERIFIED SKILLS':fontcolor=0xa78bfa:fontsize=18:x=100:y=365`,
          `drawtext=${regularFont}text='${skillsStr}':fontcolor=0xe2e8f0:fontsize=20:x=100:y=395`,
          `drawbox=x=100:y=485:w=1080:h=135:color=0x0f172a@0.95:t=fill`,
          `drawbox=x=100:y=485:w=6:h=135:color=0x0a66c2@1.0:t=fill`,
          `drawtext=${boldFont}text='AI AGENT SPOKEN NARRATION':fontcolor=0x38bdf8:fontsize=15:x=130:y=505`,
          `drawtext=${regularFont}text='${captionText}':fontcolor=0xf1f5f9:fontsize=20:x=130:y=538`,
          `drawtext=${regularFont}text='One Profile. One AI. One Powerful Story.':fontcolor=0x94a3b8:fontsize=15:x=130:y=575[outv]`,
        ].join(','),
      ].join(';');

      const audioInput = hasAudio
        ? `-i "${narrationWavPath}"`
        : `-f lavfi -i anullsrc=r=44100:cl=mono`;

      cmd = `"${this.ffmpegPath}" -y -f lavfi -i color=c=0x0b0f19:s=1280x720:d=${duration} -i "${avatarLocalPath}" ${audioInput} -filter_complex "${filterComplex}" -map "[outv]" -map 2:a -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -shortest "${outputMp4Path}"`;
    } else {
      // Composition with stylish LinkedIn Avatar initials box
      const filterGraph = [
        'drawbox=x=60:y=60:w=1160:h=600:color=0x151e32@0.98:t=fill',
        'drawbox=x=60:y=60:w=1160:h=8:color=0x0a66c2@1.0:t=fill',
        'drawbox=x=96:y=106:w=120:h=120:color=0x1e293b@1.0:t=fill',
        'drawbox=x=96:y=106:w=120:h=120:color=0x0a66c2@1.0:t=2',
        `drawtext=${boldFont}text='${initials}':fontcolor=white:fontsize=44:x=125:y=140`,
        `drawtext=${boldFont}text='LINKEDIN VERIFIED CANDIDATE REEL':fontcolor=0x38bdf8:fontsize=16:x=246:y=112`,
        `drawtext=${boldFont}text='${candidateName}':fontcolor=white:fontsize=36:x=246:y=138`,
        `drawtext=${regularFont}text='${headline}':fontcolor=0x94a3b8:fontsize=18:x=246:y=184`,
        'drawbox=x=246:y=214:w=440:h=28:color=0x0a66c2@0.25:t=fill',
        'drawbox=x=246:y=214:w=440:h=28:color=0x0a66c2@0.7:t=1',
        `drawtext=${regularFont}text='${networkPill}':fontcolor=0x93c5fd:fontsize=13:x=258:y=221`,
        'drawbox=x=100:y=265:w=1080:h=2:color=0x334155@0.8:t=fill',
        `drawtext=${boldFont}text='PAST COMPANIES & CAREER HIGHLIGHTS':fontcolor=0x38bdf8:fontsize=18:x=100:y=285`,
        `drawtext=${regularFont}text='${companiesStr}':fontcolor=white:fontsize=22:x=100:y=316`,
        `drawtext=${boldFont}text='KEY VERIFIED SKILLS':fontcolor=0xa78bfa:fontsize=18:x=100:y=365`,
        `drawtext=${regularFont}text='${skillsStr}':fontcolor=0xe2e8f0:fontsize=20:x=100:y=395`,
        'drawbox=x=100:y=485:w=1080:h=135:color=0x0f172a@0.95:t=fill',
        'drawbox=x=100:y=485:w=6:h=135:color=0x0a66c2@1.0:t=fill',
        `drawtext=${boldFont}text='AI AGENT SPOKEN NARRATION':fontcolor=0x38bdf8:fontsize=15:x=130:y=505`,
        `drawtext=${regularFont}text='${captionText}':fontcolor=0xf1f5f9:fontsize=20:x=130:y=538`,
        `drawtext=${regularFont}text='One Profile. One AI. One Powerful Story.':fontcolor=0x94a3b8:fontsize=15:x=130:y=575`,
      ].join(',');

      if (hasAudio) {
        this.logger.log(`Using real narration audio stream from: ${narrationWavPath}`);
        cmd = `"${this.ffmpegPath}" -y -f lavfi -i color=c=0x0b0f19:s=1280x720:d=${duration} -i "${narrationWavPath}" -vf "${filterGraph}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -ar 44100 -b:a 192k -shortest "${outputMp4Path}"`;
      } else {
        this.logger.warn(`No valid audio found at ${narrationWavPath}, using silent fallback audio`);
        cmd = `"${this.ffmpegPath}" -y -f lavfi -i color=c=0x0b0f19:s=1280x720:d=${duration} -f lavfi -i anullsrc=r=44100:cl=mono -vf "${filterGraph}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -shortest "${outputMp4Path}"`;
      }
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
    } finally {
      // Clean up temporary downloaded avatar
      if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
        try {
          fs.unlinkSync(avatarLocalPath);
        } catch {}
      }
    }
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { GeneratedVideo, VideoStatus } from './entities/generated-video.entity';
import { Candidate, RetrievalStatus } from '../candidates/entities/candidate.entity';
import { JobsService } from '../jobs/jobs.service';
import { JobStage, JobStatus } from '../jobs/entities/generation-job.entity';
import { ScriptGenerationService } from '../script-generation/script-generation.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { TextToSpeechService } from './services/text-to-speech.service';
import { VideoCompositionService } from './services/video-composition.service';

export interface VideoGenerationResult {
  videoId: string;
  candidateId: string;
  jobId: string;
  status: VideoStatus;
  script: string;
  durationSeconds: number;
  videoUrl: string;
  downloadUrl: string;
  message: string;
}

@Injectable()
export class VideoGenerationService {
  private readonly logger = new Logger(VideoGenerationService.name);

  constructor(
    @InjectRepository(GeneratedVideo)
    private readonly videoRepo: Repository<GeneratedVideo>,
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    private readonly jobsService: JobsService,
    private readonly scriptService: ScriptGenerationService,
    private readonly ttsService: TextToSpeechService,
    private readonly compositionService: VideoCompositionService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  /**
   * Generates a complete AI Video Reel for a verified candidate:
   * 1. Validates candidate & facts
   * 2. Synthesizes grounded narration script
   * 3. Generates voice narration audio
   * 4. Renders animated scenes and compiles MP4 with FFmpeg
   * 5. Saves video metadata & updates job lifecycle
   */
  async generateVideoForCandidate(
    candidateId: string,
  ): Promise<VideoGenerationResult> {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
      relations: ['facts'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    if (
      candidate.retrievalStatus !== RetrievalStatus.SUCCESS ||
      !candidate.facts ||
      candidate.facts.length === 0
    ) {
      throw new BadRequestException(
        `Cannot generate video: Candidate profile data is unavailable or insufficient. (Current status: ${candidate.retrievalStatus})`,
      );
    }

    // 1. Create a GenerationJob
    const job = await this.jobsService.createJob(candidate.id);
    await this.jobsService.updateJobStage(
      job.id,
      JobStage.SCRIPT_GENERATION,
      JobStatus.PROCESSING,
    );

    // 2. Synthesize Grounded Script
    this.logger.log(`Synthesizing script for candidate ${candidate.displayName || candidate.id}`);
    const script = this.scriptService.generateScriptFromFacts(candidate);

    // 3. Setup Video Record
    let video = this.videoRepo.create({
      candidateId: candidate.id,
      generationJobId: job.id,
      script: script.fullNarration,
      status: VideoStatus.PROCESSING,
    });
    video = await this.videoRepo.save(video);

    try {
      // 4. Voice Narration Audio
      await this.jobsService.updateJobStage(
        job.id,
        JobStage.AUDIO_GENERATION,
        JobStatus.PROCESSING,
      );

      const storageDir = path.resolve(process.cwd(), 'storage', 'videos');
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      const narrationWavPath = path.join(
        storageDir,
        `narration_${candidate.id}_${video.id}.wav`,
      );
      const ttsResult = await this.ttsService.generateSpeech(
        script.fullNarration,
        narrationWavPath,
      );

      // 5. Visual Composition & FFmpeg Video Export
      await this.jobsService.updateJobStage(
        job.id,
        JobStage.VIDEO_COMPOSITION,
        JobStatus.PROCESSING,
      );

      const outputMp4Path = path.join(
        storageDir,
        `reel_${candidate.id}_${video.id}.mp4`,
      );
      const compositionResult = await this.compositionService.composeReelVideo(
        script,
        ttsResult.audioPath,
        outputMp4Path,
        ttsResult.durationSeconds,
      );

      // Upload to Supabase Storage for persistent cloud CDN hosting (survives Render restarts)
      let finalStoragePath = compositionResult.videoPath;
      try {
        if (fs.existsSync(compositionResult.videoPath)) {
          const videoBuf = fs.readFileSync(compositionResult.videoPath);
          const cloudUrl = await this.supabaseStorage.uploadVideo(
            `reel_${candidate.id}_${video.id}.mp4`,
            videoBuf,
          );
          if (cloudUrl) {
            finalStoragePath = cloudUrl;
            this.logger.log(`Video reel uploaded to Supabase Storage: ${cloudUrl}`);
          }
        }
      } catch (uploadErr: any) {
        this.logger.warn(`Could not upload video to Supabase Storage: ${uploadErr.message}`);
      }

      // 6. Update Video Record
      video.videoStoragePath = finalStoragePath;
      video.durationSeconds = compositionResult.durationSeconds;
      video.status = VideoStatus.READY;
      await this.videoRepo.save(video);

      // 7. Complete Job
      await this.jobsService.updateJobStage(
        job.id,
        JobStage.COMPLETED,
        JobStatus.COMPLETED,
      );

      return {
        videoId: video.id,
        candidateId: candidate.id,
        jobId: job.id,
        status: VideoStatus.READY,
        script: video.script,
        durationSeconds: video.durationSeconds,
        videoUrl: `/api/videos/${video.id}/stream`,
        downloadUrl: `/api/videos/${video.id}/download`,
        message: 'AI Profile Reel generated successfully!',
      };
    } catch (err: any) {
      this.logger.error(`Failed to generate video for candidate ${candidate.id}:`, err);
      video.status = VideoStatus.FAILED;
      await this.videoRepo.save(video);

      await this.jobsService.updateJobStage(
        job.id,
        JobStage.FAILED,
        JobStatus.FAILED,
        {
          code: 'VIDEO_GENERATION_FAILED',
          message: err.message,
        },
      );

      throw err;
    }
  }

  async getVideoById(videoId: string): Promise<GeneratedVideo> {
    const video = await this.videoRepo.findOne({ where: { id: videoId } });
    if (!video) {
      throw new NotFoundException(`Video with ID ${videoId} not found`);
    }
    return video;
  }

  async getLatestVideoForCandidate(candidateId: string): Promise<GeneratedVideo | null> {
    const videos = await this.videoRepo.find({
      where: { candidateId, status: VideoStatus.READY },
      order: { createdAt: 'DESC' },
      take: 5,
    });
    for (const v of videos) {
      if (v.videoStoragePath) {
        if (v.videoStoragePath.startsWith('http://') || v.videoStoragePath.startsWith('https://')) {
          return v;
        }
        if (fs.existsSync(v.videoStoragePath)) {
          return v;
        }
      }
    }
    return null;
  }
}

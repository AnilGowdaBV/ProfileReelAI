import {
  Controller,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
  Res,
  NotFoundException,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { VideoGenerationService } from './video-generation.service';

@ApiTags('Videos')
@Controller()
export class VideoGenerationController {
  constructor(private readonly videoService: VideoGenerationService) {}

  @Post('candidates/:candidateId/generate-video')
  @ApiOperation({ summary: 'Generate an AI narrated video reel for a candidate' })
  @ApiParam({ name: 'candidateId', description: 'Candidate UUID' })
  async generateVideo(
    @Param('candidateId', new ParseUUIDPipe()) candidateId: string,
  ) {
    return this.videoService.generateVideoForCandidate(candidateId);
  }

  @Get('videos/:id')
  @ApiOperation({ summary: 'Get generated video metadata by ID' })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  async getVideo(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.videoService.getVideoById(id);
  }

  @Get('videos/candidate/:candidateId')
  @ApiOperation({ summary: 'Get latest generated video for a candidate' })
  @ApiParam({ name: 'candidateId', description: 'Candidate UUID' })
  async getVideoByCandidate(
    @Param('candidateId', new ParseUUIDPipe()) candidateId: string,
  ) {
    return this.videoService.getLatestVideoForCandidate(candidateId);
  }

  @Get('videos/:id/stream')
  @ApiOperation({ summary: 'Stream MP4 video for HTML5 player' })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  async streamVideo(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
    @Headers('range') range?: string,
  ) {
    const video = await this.videoService.getVideoById(id);
    if (!video.videoStoragePath || !fs.existsSync(video.videoStoragePath)) {
      throw new NotFoundException('Video media file not found on storage');
    }

    const videoPath = video.videoStoragePath;
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;

    if (range) {
      let start = 0;
      let end = fileSize - 1;

      // RFC 7233 Range parser: supports closed ("bytes=0-1000"), prefix ("bytes=1000-"), and suffix ("bytes=-1000")
      const match = range.match(/bytes=(\d*)-(\d*)/);
      if (match) {
        if (match[1] === '' && match[2] !== '') {
          // Suffix range: bytes=-1000 (last 1000 bytes)
          const suffixLength = parseInt(match[2], 10);
          start = Math.max(0, fileSize - suffixLength);
          end = fileSize - 1;
        } else if (match[1] !== '' && match[2] === '') {
          // Prefix range: bytes=1000-
          start = parseInt(match[1], 10);
          end = fileSize - 1;
        } else if (match[1] !== '' && match[2] !== '') {
          // Closed range: bytes=0-1000
          start = parseInt(match[1], 10);
          end = Math.min(parseInt(match[2], 10), fileSize - 1);
        }
      }

      // Check bounds validity
      if (isNaN(start) || isNaN(end) || start > end || start >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  }

  @Get('videos/:id/download')
  @ApiOperation({ summary: 'Download completed MP4 video reel' })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  async downloadVideo(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ) {
    const video = await this.videoService.getVideoById(id);
    if (!video.videoStoragePath || !fs.existsSync(video.videoStoragePath)) {
      throw new NotFoundException('Video media file not found on storage');
    }

    res.download(video.videoStoragePath, `ProfileReel_${video.id.slice(0, 8)}.mp4`);
  }
}

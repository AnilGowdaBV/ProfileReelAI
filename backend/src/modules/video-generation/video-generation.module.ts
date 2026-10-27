import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedVideo } from './entities/generated-video.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { JobsModule } from '../jobs/jobs.module';
import { ScriptGenerationModule } from '../script-generation/script-generation.module';
import { TextToSpeechService } from './services/text-to-speech.service';
import { VideoCompositionService } from './services/video-composition.service';
import { VideoGenerationService } from './video-generation.service';
import { VideoGenerationController } from './video-generation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneratedVideo, Candidate]),
    JobsModule,
    ScriptGenerationModule,
  ],
  controllers: [VideoGenerationController],
  providers: [
    TextToSpeechService,
    VideoCompositionService,
    VideoGenerationService,
  ],
  exports: [VideoGenerationService],
})
export class VideoGenerationModule {}

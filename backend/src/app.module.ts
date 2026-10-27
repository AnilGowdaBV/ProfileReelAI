import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { ProfileRetrievalModule } from './modules/profile-retrieval/profile-retrieval.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ScriptGenerationModule } from './modules/script-generation/script-generation.module';
import { VideoGenerationModule } from './modules/video-generation/video-generation.module';
import { ProfileScoringModule } from './modules/profile-scoring/profile-scoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    CandidatesModule,
    ProfileRetrievalModule,
    JobsModule,
    ScriptGenerationModule,
    VideoGenerationModule,
    ProfileScoringModule,
  ],
})
export class AppModule {}

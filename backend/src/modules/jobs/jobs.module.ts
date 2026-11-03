import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationJob } from './entities/generation-job.entity';
import { JobApplication } from './entities/job-application.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { CourseRecommendationsService } from './course-recommendations.service';

@Module({
  imports: [TypeOrmModule.forFeature([GenerationJob, JobApplication])],
  controllers: [JobsController],
  providers: [JobsService, CourseRecommendationsService],
  exports: [JobsService],
})
export class JobsModule {}

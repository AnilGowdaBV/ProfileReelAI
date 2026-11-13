import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationJob } from './entities/generation-job.entity';
import { JobApplication } from './entities/job-application.entity';
import { MockTestResult } from './entities/mock-test-result.entity';
import { CodeRunnerService } from './code-runner.service';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { CourseRecommendationsService } from './course-recommendations.service';

@Module({
  imports: [TypeOrmModule.forFeature([GenerationJob, JobApplication, MockTestResult]), AdminModule],
  controllers: [JobsController],
  providers: [JobsService, CourseRecommendationsService, CodeRunnerService],
  exports: [JobsService],
})
export class JobsModule {}

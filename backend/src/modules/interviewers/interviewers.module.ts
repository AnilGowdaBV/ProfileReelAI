import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { User } from '../auth/entities/user.entity';
import { ProfileRetrievalModule } from '../profile-retrieval/profile-retrieval.module';
import { JobApplication } from '../jobs/entities/job-application.entity';
import { InterviewRequest } from './interview-request.entity';
import { InterviewerApplication } from './interviewer-application.entity';
import { GoogleMeetService } from './google-meet.service';
import { InterviewMailService } from './interview-mail.service';
import { InterviewersController } from './interviewers.controller';
import { InterviewersService } from './interviewers.service';

@Module({
  imports: [TypeOrmModule.forFeature([InterviewerApplication, InterviewRequest, JobApplication, User]), ProfileRetrievalModule, AdminModule],
  controllers: [InterviewersController],
  providers: [InterviewersService, GoogleMeetService, InterviewMailService],
})
export class InterviewersModule {}

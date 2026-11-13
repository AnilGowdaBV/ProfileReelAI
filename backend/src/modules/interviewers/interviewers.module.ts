import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { ProfileRetrievalModule } from '../profile-retrieval/profile-retrieval.module';
import { InterviewerApplication } from './interviewer-application.entity';
import { InterviewersController } from './interviewers.controller';
import { InterviewersService } from './interviewers.service';

@Module({
  imports: [TypeOrmModule.forFeature([InterviewerApplication]), ProfileRetrievalModule, AdminModule],
  controllers: [InterviewersController],
  providers: [InterviewersService],
})
export class InterviewersModule {}

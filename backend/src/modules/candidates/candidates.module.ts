import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './entities/candidate.entity';
import { CandidateFact } from './entities/candidate-fact.entity';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { JobsModule } from '../jobs/jobs.module';
import { ProfileRetrievalModule } from '../profile-retrieval/profile-retrieval.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, CandidateFact]),
    JobsModule,
    ProfileRetrievalModule,
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}

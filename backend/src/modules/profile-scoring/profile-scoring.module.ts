import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from '../candidates/entities/candidate.entity';
import { CandidateFact } from '../candidates/entities/candidate-fact.entity';
import { CandidateScore } from './entities/candidate-score.entity';
import { ProfileScoringService } from './profile-scoring.service';
import { ProfileScoringController } from './profile-scoring.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateScore, Candidate, CandidateFact]),
  ],
  controllers: [ProfileScoringController],
  providers: [ProfileScoringService],
  exports: [ProfileScoringService],
})
export class ProfileScoringModule {}

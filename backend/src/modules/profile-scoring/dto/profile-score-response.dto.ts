import { ScoreTier } from '../entities/candidate-score.entity';

export class ScoreBreakdownDto {
  experience: {
    score: number;
    max: number;
    description: string;
  };
  skills: {
    score: number;
    max: number;
    description: string;
  };
  education: {
    score: number;
    max: number;
    description: string;
  };
  activeness: {
    score: number;
    max: number;
    description: string;
  };
  impact?: {
    score: number;
    max: number;
    description: string;
  };
}

export class ProfileScoreResponseDto {
  id: string;
  candidateId: string;
  candidateName: string;
  overallScore: number;
  tier: ScoreTier;
  tierLabel: string;
  breakdown: ScoreBreakdownDto;
  keyStrengths: string[];
  growthAreas: string[];
  recommendedRoles: string[];
  evaluatedAt: Date;
}

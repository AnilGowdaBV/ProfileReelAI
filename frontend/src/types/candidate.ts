export type RetrievalStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'PROFILE_DATA_UNAVAILABLE'
  | 'FAILED';

export type FactCategory =
  | 'headline'
  | 'summary'
  | 'experience'
  | 'skills'
  | 'education'
  | 'certification';

export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'INSUFFICIENT';

export interface CandidateFact {
  id: string;
  category: FactCategory;
  factText: string;
  sourceType: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface Candidate {
  id: string;
  submittedProfileUrl: string;
  normalizedProfileUrl: string;
  displayName?: string;
  profilePictureUrl?: string;
  retrievalStatus: RetrievalStatus;
  facts: CandidateFact[];
  latestJobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionResponse {
  candidateId: string;
  jobId: string;
  retrievalStatus: RetrievalStatus;
  normalizedProfileUrl: string;
  displayName?: string;
  profilePictureUrl?: string;
  message: string;
  errorReason?: string;
}

export interface JobDetails {
  id: string;
  candidateId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  currentStage: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedVideoResponse {
  videoId: string;
  candidateId: string;
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  script: string;
  durationSeconds: number;
  videoUrl: string;
  downloadUrl: string;
  message: string;
}

export interface VideoMetadata {
  id: string;
  candidateId: string;
  generationJobId?: string;
  script?: string;
  videoStoragePath?: string;
  durationSeconds?: number;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  createdAt: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  database: {
    connected: boolean;
    provider: string;
  };
  features: {
    profileRetrievalProvider: string;
    videoPipelineStage: string;
  };
}

export type ScoreTier = 'EXCEPTIONAL' | 'STRONG' | 'PROFICIENT' | 'DEVELOPING';

export interface ScoreDimension {
  score: number;
  max: number;
  description: string;
}

export interface CandidateScore {
  id: string;
  candidateId: string;
  candidateName: string;
  overallScore: number;
  tier: ScoreTier;
  tierLabel: string;
  breakdown: {
    experience: ScoreDimension;
    skills: ScoreDimension;
    education: ScoreDimension;
    activeness: ScoreDimension;
    impact?: ScoreDimension;
  };
  keyStrengths: string[];
  growthAreas: string[];
  recommendedRoles: string[];
  evaluatedAt: string;
}

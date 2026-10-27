import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProfileScoringService } from './profile-scoring.service';
import { CandidateScore, ScoreTier } from './entities/candidate-score.entity';
import { Candidate, RetrievalStatus } from '../candidates/entities/candidate.entity';
import {
  CandidateFact,
  FactCategory,
  VerificationStatus,
} from '../candidates/entities/candidate-fact.entity';

describe('ProfileScoringService', () => {
  let service: ProfileScoringService;

  const mockCandidate: Partial<Candidate> = {
    id: 'cand-123',
    displayName: 'Alex Chen',
    retrievalStatus: RetrievalStatus.SUCCESS,
    facts: [
      {
        id: 'f-1',
        candidateId: 'cand-123',
        category: FactCategory.HEADLINE,
        factText: 'Staff Full-Stack Architect | Distributed Systems',
        sourceType: 'MOCK_FIXTURE',
        verificationStatus: VerificationStatus.VERIFIED,
        createdAt: new Date(),
      } as CandidateFact,
      {
        id: 'f-2',
        candidateId: 'cand-123',
        category: FactCategory.EXPERIENCE,
        factText:
          'Staff Architect at Apex Cloud Systems (2022 – Present): Reduced end-to-end latency by 45% and scaled telemetry platform to 40M daily requests.',
        sourceType: 'MOCK_FIXTURE',
        verificationStatus: VerificationStatus.VERIFIED,
        createdAt: new Date(),
      } as CandidateFact,
      {
        id: 'f-3',
        candidateId: 'cand-123',
        category: FactCategory.SKILLS,
        factText: 'TypeScript',
        sourceType: 'MOCK_FIXTURE',
        verificationStatus: VerificationStatus.VERIFIED,
        createdAt: new Date(),
      } as CandidateFact,
      {
        id: 'f-4',
        candidateId: 'cand-123',
        category: FactCategory.SKILLS,
        factText: 'NestJS',
        sourceType: 'MOCK_FIXTURE',
        verificationStatus: VerificationStatus.VERIFIED,
        createdAt: new Date(),
      } as CandidateFact,
      {
        id: 'f-5',
        candidateId: 'cand-123',
        category: FactCategory.SKILLS,
        factText: 'React',
        sourceType: 'MOCK_FIXTURE',
        verificationStatus: VerificationStatus.VERIFIED,
        createdAt: new Date(),
      } as CandidateFact,
      {
        id: 'f-6',
        candidateId: 'cand-123',
        category: FactCategory.SKILLS,
        factText: 'Docker',
        sourceType: 'MOCK_FIXTURE',
        verificationStatus: VerificationStatus.VERIFIED,
        createdAt: new Date(),
      } as CandidateFact,
      {
        id: 'f-7',
        candidateId: 'cand-123',
        category: FactCategory.EDUCATION,
        factText: 'Bachelor of Science in Computer Science from UC Berkeley',
        sourceType: 'MOCK_FIXTURE',
        verificationStatus: VerificationStatus.VERIFIED,
        createdAt: new Date(),
      } as CandidateFact,
      {
        id: 'f-8',
        candidateId: 'cand-123',
        category: FactCategory.CERTIFICATION,
        factText: 'AWS Certified Solutions Architect – Professional',
        sourceType: 'MOCK_FIXTURE',
        verificationStatus: VerificationStatus.VERIFIED,
        createdAt: new Date(),
      } as CandidateFact,
    ],
  };

  const mockScoreRepo = {
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ id: 'score-123', ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'score-123', ...entity })),
  };

  const mockCandidateRepo = {
    findOne: jest.fn().mockResolvedValue(mockCandidate),
  };

  const mockFactRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileScoringService,
        {
          provide: getRepositoryToken(CandidateScore),
          useValue: mockScoreRepo,
        },
        {
          provide: getRepositoryToken(Candidate),
          useValue: mockCandidateRepo,
        },
        {
          provide: getRepositoryToken(CandidateFact),
          useValue: mockFactRepo,
        },
      ],
    }).compile();

    service = module.get<ProfileScoringService>(ProfileScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should score a candidate profile with verified facts and return structured score', async () => {
    const result = await service.scoreCandidate('cand-123');

    expect(result).toBeDefined();
    expect(result.candidateId).toBe('cand-123');
    expect(result.overallScore).toBeGreaterThanOrEqual(5.0);
    expect(result.overallScore).toBeLessThanOrEqual(10.0);
    expect(result.breakdown.experience.score).toBeGreaterThan(0);
    expect(result.breakdown.skills.score).toBeGreaterThan(0);
    expect(result.breakdown.education.score).toBeGreaterThan(0);
    expect(result.breakdown.activeness.score).toBeGreaterThan(0);
    expect(result.keyStrengths.length).toBeGreaterThan(0);
    expect(result.recommendedRoles.length).toBeGreaterThan(0);
    expect(mockScoreRepo.save).toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CandidatesService } from './candidates.service';
import { Candidate, RetrievalStatus } from './entities/candidate.entity';
import { CandidateFact } from './entities/candidate-fact.entity';
import { JobsService } from '../jobs/jobs.service';
import { ProfileRetrievalService } from '../profile-retrieval/profile-retrieval.service';
import { JobStage, JobStatus } from '../jobs/entities/generation-job.entity';

describe('CandidatesService', () => {
  let service: CandidatesService;
  let mockCandidateRepo: any;
  let mockFactRepo: any;
  let mockJobsService: any;
  let mockRetrievalService: any;

  beforeEach(async () => {
    mockCandidateRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ id: 'cand-123', ...dto })),
      save: jest.fn().mockImplementation((cand) => Promise.resolve(cand)),
      find: jest.fn(),
    };

    mockFactRepo = {
      delete: jest.fn().mockResolvedValue(true),
      create: jest.fn().mockImplementation((fact) => fact),
      save: jest.fn().mockResolvedValue([]),
    };

    mockJobsService = {
      createJob: jest.fn().mockResolvedValue({
        id: 'job-123',
        candidateId: 'cand-123',
        status: JobStatus.PROCESSING,
        currentStage: JobStage.SUBMITTED,
      }),
      updateJobStage: jest.fn().mockResolvedValue({}),
    };

    mockRetrievalService = {
      retrieveAndExtract: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        {
          provide: getRepositoryToken(Candidate),
          useValue: mockCandidateRepo,
        },
        {
          provide: getRepositoryToken(CandidateFact),
          useValue: mockFactRepo,
        },
        {
          provide: JobsService,
          useValue: mockJobsService,
        },
        {
          provide: ProfileRetrievalService,
          useValue: mockRetrievalService,
        },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  it('should successfully submit and process candidate with authorized profile fixture', async () => {
    mockCandidateRepo.findOne.mockResolvedValue(null);
    mockRetrievalService.retrieveAndExtract.mockResolvedValue({
      retrievalResult: {
        status: 'SUCCESS',
        isMock: true,
      },
      extractedFacts: [
        {
          category: 'headline',
          factText: 'Staff Full-Stack Architect',
          sourceType: 'MOCK_FIXTURE',
          verificationStatus: 'VERIFIED',
        },
      ],
      displayName: 'Alex Chen',
    });

    const response = await service.submitCandidate({
      profileUrl: 'https://www.linkedin.com/in/alex-chen-senior-fullstack',
    });

    expect(response.candidateId).toBe('cand-123');
    expect(response.jobId).toBe('job-123');
    expect(response.retrievalStatus).toBe(RetrievalStatus.SUCCESS);
    expect(response.displayName).toBe('Alex Chen');
    expect(mockJobsService.updateJobStage).toHaveBeenCalledWith(
      'job-123',
      JobStage.READY_FOR_SCRIPT,
      JobStatus.COMPLETED,
    );
  });

  it('should handle PROFILE_DATA_UNAVAILABLE without creating fake data', async () => {
    mockCandidateRepo.findOne.mockResolvedValue(null);
    mockRetrievalService.retrieveAndExtract.mockResolvedValue({
      retrievalResult: {
        status: 'PROFILE_DATA_UNAVAILABLE',
        errorReason: 'Candidate profile is private',
        isMock: true,
      },
      extractedFacts: [],
      displayName: undefined,
    });

    const response = await service.submitCandidate({
      profileUrl: 'https://www.linkedin.com/in/private-profile',
    });

    expect(response.retrievalStatus).toBe(
      RetrievalStatus.PROFILE_DATA_UNAVAILABLE,
    );
    expect(response.errorReason).toContain('Candidate profile is private');
    expect(mockFactRepo.save).not.toHaveBeenCalled();
    expect(mockJobsService.updateJobStage).toHaveBeenCalledWith(
      'job-123',
      JobStage.FAILED,
      JobStatus.FAILED,
      expect.objectContaining({ code: 'PROFILE_DATA_UNAVAILABLE' }),
    );
  });
});

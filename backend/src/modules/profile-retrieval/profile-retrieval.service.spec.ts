import { Test, TestingModule } from '@nestjs/testing';
import { ProfileRetrievalService } from './profile-retrieval.service';
import { MockProfileDataProvider } from './providers/mock-profile-data.provider';
import { PROFILE_DATA_PROVIDER } from './interfaces/profile-data-provider.interface';
import { FactCategory } from '../candidates/entities/candidate-fact.entity';

describe('ProfileRetrievalService', () => {
  let service: ProfileRetrievalService;
  let mockProvider: MockProfileDataProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileRetrievalService,
        MockProfileDataProvider,
        {
          provide: PROFILE_DATA_PROVIDER,
          useExisting: MockProfileDataProvider,
        },
      ],
    }).compile();

    service = module.get<ProfileRetrievalService>(ProfileRetrievalService);
    mockProvider = module.get<MockProfileDataProvider>(MockProfileDataProvider);
  });

  it('should retrieve a known mock candidate profile and extract facts correctly', async () => {
    const result = await service.retrieveAndExtract(
      'https://www.linkedin.com/in/alex-chen-senior-fullstack',
      'alex-chen-senior-fullstack',
    );

    expect(result.retrievalResult.status).toBe('SUCCESS');
    expect(result.displayName).toBe('Alex Chen');
    expect(result.extractedFacts.length).toBeGreaterThan(5);

    const categories = result.extractedFacts.map((f) => f.category);
    expect(categories).toContain(FactCategory.HEADLINE);
    expect(categories).toContain(FactCategory.SUMMARY);
    expect(categories).toContain(FactCategory.EXPERIENCE);
    expect(categories).toContain(FactCategory.SKILLS);
    expect(categories).toContain(FactCategory.EDUCATION);
    expect(categories).toContain(FactCategory.CERTIFICATION);

    // Verify factual accuracy (zero hallucinated data)
    const headlineFact = result.extractedFacts.find(
      (f) => f.category === FactCategory.HEADLINE,
    );
    expect(headlineFact?.factText).toContain('Staff Full-Stack Architect');
  });

  it('should return PROFILE_DATA_UNAVAILABLE for private profile fixture', async () => {
    const result = await service.retrieveAndExtract(
      'https://www.linkedin.com/in/private-profile',
      'private-profile',
    );

    expect(result.retrievalResult.status).toBe('PROFILE_DATA_UNAVAILABLE');
    expect(result.retrievalResult.errorReason).toContain('privacy');
    expect(result.extractedFacts).toHaveLength(0);
    expect(result.displayName).toBeUndefined();
  });

  it('should return PROFILE_DATA_UNAVAILABLE for unknown profile without inventing data', async () => {
    const result = await service.retrieveAndExtract(
      'https://www.linkedin.com/in/unauthorized-unknown-user',
      'unauthorized-unknown-user',
    );

    expect(result.retrievalResult.status).toBe('PROFILE_DATA_UNAVAILABLE');
    expect(result.extractedFacts).toHaveLength(0);
    expect(result.displayName).toBeUndefined();
  });
});

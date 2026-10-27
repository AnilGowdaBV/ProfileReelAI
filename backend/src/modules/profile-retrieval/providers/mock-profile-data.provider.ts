import { Injectable, Logger } from '@nestjs/common';
import { IProfileDataProvider } from '../interfaces/profile-data-provider.interface';
import { ProfileRetrievalResult } from '../interfaces/raw-profile-data.interface';
import { MOCK_PROFILES } from '../fixtures/mock-profiles.fixture';

@Injectable()
export class MockProfileDataProvider implements IProfileDataProvider {
  private readonly logger = new Logger(MockProfileDataProvider.name);
  readonly providerName = 'MOCK_FIXTURE_PROVIDER';
  readonly isMock = true;

  async fetchProfile(
    normalizedUrl: string,
    slug: string,
  ): Promise<ProfileRetrievalResult> {
    this.logger.log(`Evaluating mock profile retrieval for slug: "${slug}"`);

    // Simulated network delay (50ms) to model real async behavior
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Explicit test fixture for private profile
    if (slug === 'private-profile') {
      return {
        status: 'PROFILE_DATA_UNAVAILABLE',
        errorReason:
          'Candidate profile has strict privacy controls enabled or third-party visibility is restricted. No authorized professional data could be retrieved.',
        sourceProvider: this.providerName,
        isMock: this.isMock,
        metadata: {
          retrievedAt: new Date().toISOString(),
          fixtureId: slug,
        },
      };
    }

    // Explicit test fixture for profile not found
    if (slug === 'not-found') {
      return {
        status: 'PROFILE_DATA_UNAVAILABLE',
        errorReason:
          'Profile identifier does not exist or has been removed from the professional directory.',
        sourceProvider: this.providerName,
        isMock: this.isMock,
        metadata: {
          retrievedAt: new Date().toISOString(),
          fixtureId: slug,
        },
      };
    }

    // Check for known fixture
    const fixture = MOCK_PROFILES[slug];
    if (fixture) {
      return {
        status: 'SUCCESS',
        data: fixture,
        sourceProvider: this.providerName,
        isMock: this.isMock,
        metadata: {
          retrievedAt: new Date().toISOString(),
          fixtureId: slug,
          authorizedScope: 'MOCK_DEMO_FIXTURE',
        },
      };
    }

    // Fallback for any unknown profile slug:
    // Strictly return PROFILE_DATA_UNAVAILABLE. Do NOT invent candidate data.
    return {
      status: 'PROFILE_DATA_UNAVAILABLE',
      errorReason:
        `Real-world profile retrieval for "${normalizedUrl}" is pending approved external API credentials. ` +
        `In Phase 1, only pre-configured fixtures or authorized test accounts are accessible to guarantee compliance.`,
      sourceProvider: this.providerName,
      isMock: this.isMock,
      metadata: {
        retrievedAt: new Date().toISOString(),
      },
    };
  }
}

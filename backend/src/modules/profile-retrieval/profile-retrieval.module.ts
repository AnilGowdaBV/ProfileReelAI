import { Module } from '@nestjs/common';
import { ProfileRetrievalService } from './profile-retrieval.service';
import { MockProfileDataProvider } from './providers/mock-profile-data.provider';
import { PdlProfileDataProvider } from './providers/pdl-profile-data.provider';
import { ApifyProfileDataProvider } from './providers/apify-profile-data.provider';
import {
  IProfileDataProvider,
  PROFILE_DATA_PROVIDER,
} from './interfaces/profile-data-provider.interface';
import { ProfileRetrievalResult } from './interfaces/raw-profile-data.interface';

class SmartHybridProfileDataProvider implements IProfileDataProvider {
  readonly providerName = 'SMART_HYBRID_PROVIDER';
  readonly isMock = false;

  constructor(
    private readonly apifyProvider: ApifyProfileDataProvider,
    private readonly pdlProvider: PdlProfileDataProvider,
    private readonly mockProvider: MockProfileDataProvider,
  ) {}

  async fetchProfile(
    normalizedUrl: string,
    slug: string,
  ): Promise<ProfileRetrievalResult> {
    const hasApifyKey = !!process.env.APIFY_TOKEN;
    const hasPdlKey = !!process.env.PDL_API_KEY;

    // 1. Apify LinkedIn Scraper Actor takes top priority for real live scraping
    if (hasApifyKey) {
      const liveResult = await this.apifyProvider.fetchProfile(normalizedUrl, slug);
      if (liveResult.status === 'SUCCESS') {
        return liveResult;
      }
      // If Apify was unable to extract or profile is private, check if it's a fixture
      const fixtureResult = await this.mockProvider.fetchProfile(normalizedUrl, slug);
      if (fixtureResult.status === 'SUCCESS') {
        return fixtureResult;
      }
      return liveResult;
    }

    // 2. If PDL API key is provided, attempt live People Data Labs enrichment
    if (hasPdlKey) {
      const liveResult = await this.pdlProvider.fetchProfile(normalizedUrl, slug);
      if (liveResult.status === 'SUCCESS') {
        return liveResult;
      }
      const fixtureResult = await this.mockProvider.fetchProfile(normalizedUrl, slug);
      if (fixtureResult.status === 'SUCCESS') {
        return fixtureResult;
      }
      return liveResult;
    }

    // 3. Default: Mock fixtures for development & test profiles
    return this.mockProvider.fetchProfile(normalizedUrl, slug);
  }
}

@Module({
  providers: [
    MockProfileDataProvider,
    PdlProfileDataProvider,
    ApifyProfileDataProvider,
    {
      provide: PROFILE_DATA_PROVIDER,
      useFactory: (
        mockProvider: MockProfileDataProvider,
        pdlProvider: PdlProfileDataProvider,
        apifyProvider: ApifyProfileDataProvider,
      ) => {
        return new SmartHybridProfileDataProvider(
          apifyProvider,
          pdlProvider,
          mockProvider,
        );
      },
      inject: [
        MockProfileDataProvider,
        PdlProfileDataProvider,
        ApifyProfileDataProvider,
      ],
    },
    ProfileRetrievalService,
  ],
  exports: [ProfileRetrievalService, PROFILE_DATA_PROVIDER],
})
export class ProfileRetrievalModule {}

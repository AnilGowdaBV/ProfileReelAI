import { ProfileRetrievalResult } from './raw-profile-data.interface';

export const PROFILE_DATA_PROVIDER = 'PROFILE_DATA_PROVIDER';

export interface IProfileDataProvider {
  readonly providerName: string;
  readonly isMock: boolean;

  /**
   * Fetches profile data for a validated and normalized LinkedIn URL.
   * If profile data cannot be retrieved through authorized access,
   * returns a structured result with status = 'PROFILE_DATA_UNAVAILABLE'.
   */
  fetchProfile(
    normalizedUrl: string,
    slug: string,
  ): Promise<ProfileRetrievalResult>;
}

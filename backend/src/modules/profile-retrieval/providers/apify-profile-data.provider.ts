import { Injectable, Logger } from '@nestjs/common';
import { IProfileDataProvider } from '../interfaces/profile-data-provider.interface';
import {
  ProfileRetrievalResult,
  RawCandidateProfile,
  RawEducationItem,
  RawExperienceItem,
} from '../interfaces/raw-profile-data.interface';

@Injectable()
export class ApifyProfileDataProvider implements IProfileDataProvider {
  private readonly logger = new Logger(ApifyProfileDataProvider.name);
  readonly providerName = 'APIFY_LINKEDIN_SCRAPER';
  readonly isMock = false;

  private getApiKey(): string | null {
    return process.env.APIFY_TOKEN || null;
  }

  private getActorId(): string {
    return process.env.APIFY_ACTOR_ID || 'calm_builder~linkedin-profile-scraper';
  }

  async fetchProfile(
    normalizedUrl: string,
    slug: string,
  ): Promise<ProfileRetrievalResult> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      this.logger.warn('APIFY_TOKEN is not configured in environment.');
      return {
        status: 'PROFILE_DATA_UNAVAILABLE',
        errorReason:
          'Apify API token is not configured. Set APIFY_TOKEN in your environment to fetch live LinkedIn profiles.',
        sourceProvider: this.providerName,
        isMock: this.isMock,
        metadata: {
          retrievedAt: new Date().toISOString(),
        },
      };
    }

    const actorId = this.getActorId();
    const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apiKey}`;

    this.logger.log(
      `Triggering Apify LinkedIn Scraper (${actorId}) for URL: "${normalizedUrl}"`,
    );

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          profiles: [normalizedUrl],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Apify HTTP Error ${response.status}: ${errorText}`);
        return {
          status: 'FAILED',
          errorReason: `Apify error HTTP ${response.status}: ${errorText.substring(0, 200)}`,
          sourceProvider: this.providerName,
          isMock: this.isMock,
          metadata: {
            retrievedAt: new Date().toISOString(),
          },
        };
      }

      const items = (await response.json()) as any;

      if (!Array.isArray(items) || items.length === 0) {
        this.logger.warn(`Apify returned empty dataset for: ${normalizedUrl}`);
        return {
          status: 'PROFILE_DATA_UNAVAILABLE',
          errorReason: `Profile could not be found or extracted via Apify actor.`,
          sourceProvider: this.providerName,
          isMock: this.isMock,
          metadata: {
            retrievedAt: new Date().toISOString(),
          },
        };
      }

      const raw = items[0];

      if (raw.success === false && !raw.fullName) {
        return {
          status: 'PROFILE_DATA_UNAVAILABLE',
          errorReason:
            raw.error ||
            `Profile at "${normalizedUrl}" is private or does not exist on LinkedIn.`,
          sourceProvider: this.providerName,
          isMock: this.isMock,
          metadata: {
            retrievedAt: new Date().toISOString(),
          },
        };
      }

      const profile = this.mapApifyItemToCandidateProfile(raw, slug);

      this.logger.log(
        `Successfully retrieved Apify data for "${profile.fullName}" (${profile.experiences.length} exps, ${profile.skills.length} skills, ${profile.postsCount || 0} posts)`,
      );

      return {
        status: 'SUCCESS',
        data: profile,
        sourceProvider: this.providerName,
        isMock: this.isMock,
        metadata: {
          retrievedAt: new Date().toISOString(),
          authorizedScope: 'APIFY_ACTOR_' + actorId,
        },
      };
    } catch (err: any) {
      this.logger.error(`Network error calling Apify: ${err.message}`);
      return {
        status: 'FAILED',
        errorReason: `Network error connecting to Apify: ${err.message}`,
        sourceProvider: this.providerName,
        isMock: this.isMock,
        metadata: {
          retrievedAt: new Date().toISOString(),
        },
      };
    }
  }

  private mapApifyItemToCandidateProfile(
    item: any,
    slug: string,
  ): RawCandidateProfile {
    const fullName = item.fullName || slug;
    const headline = item.headline || item.currentCompany?.name || '';
    const location = item.location || '';
    const summary = item.summary || item.about || '';
    const profilePictureUrl = item.profilePictureUrl || undefined;
    const connections = item.connections || undefined;
    const followers = item.followersText || undefined;
    const postsCount = Array.isArray(item.posts) ? item.posts.length : 0;

    const experiences: RawExperienceItem[] = (item.experience || [])
      .slice(0, 6)
      .map((exp: any) => ({
        company: exp.company || exp.companyName || 'Company',
        title: exp.title || 'Role',
        startDate: exp.startDate || undefined,
        endDate: exp.current ? 'Present' : exp.dateRange || exp.endDate || undefined,
        isCurrentRole: !!exp.current,
        description: exp.description || undefined,
      }));

    const educations: RawEducationItem[] = (item.education || [])
      .slice(0, 3)
      .map((edu: any) => ({
        institution: edu.school || edu.schoolName || 'University',
        degree: edu.degree || undefined,
        fieldOfStudy: edu.fieldOfStudy || undefined,
        year: edu.endDate || edu.dateRange || undefined,
      }));

    const skills: string[] = (item.skills || [])
      .slice(0, 20)
      .map((s: any) => (typeof s === 'string' ? s : s?.name || s?.title))
      .filter((s: any): s is string => typeof s === 'string' && s.length > 0);

    const certifications: string[] = (item.certifications || [])
      .slice(0, 6)
      .map((c: any) => (typeof c === 'string' ? c : c?.name || c?.title))
      .filter((c: any): c is string => typeof c === 'string' && c.length > 0);

    return {
      slug,
      fullName,
      headline,
      location,
      summary,
      experiences,
      educations,
      skills,
      certifications,
      profilePictureUrl,
      connections,
      followers,
      postsCount,
    };
  }
}

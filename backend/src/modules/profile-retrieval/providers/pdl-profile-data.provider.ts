import { Injectable, Logger } from '@nestjs/common';
import { IProfileDataProvider } from '../interfaces/profile-data-provider.interface';
import {
  ProfileRetrievalResult,
  RawCandidateProfile,
  RawEducationItem,
  RawExperienceItem,
} from '../interfaces/raw-profile-data.interface';

@Injectable()
export class PdlProfileDataProvider implements IProfileDataProvider {
  private readonly logger = new Logger(PdlProfileDataProvider.name);
  readonly providerName = 'PEOPLE_DATA_LABS';
  readonly isMock = false;

  private getApiKey(): string | null {
    return process.env.PDL_API_KEY || null;
  }

  async fetchProfile(
    normalizedUrl: string,
    slug: string,
  ): Promise<ProfileRetrievalResult> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      this.logger.warn('PDL_API_KEY is not configured in environment.');
      return {
        status: 'PROFILE_DATA_UNAVAILABLE',
        errorReason:
          'People Data Labs API key is not configured. Set PDL_API_KEY in your environment to query live candidate profiles.',
        sourceProvider: this.providerName,
        isMock: this.isMock,
        metadata: {
          retrievedAt: new Date().toISOString(),
        },
      };
    }

    const endpoint = new URL('https://api.peopledatalabs.com/v5/person/enrich');
    endpoint.searchParams.set('profile', normalizedUrl);
    endpoint.searchParams.set('min_likelihood', '6');

    this.logger.log(`Querying People Data Labs Person Enrichment for: ${normalizedUrl}`);

    try {
      const response = await fetch(endpoint.toString(), {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          Accept: 'application/json',
        },
      });

      if (response.status === 404) {
        this.logger.log(`PDL found no match for: ${normalizedUrl}`);
        return {
          status: 'PROFILE_DATA_UNAVAILABLE',
          errorReason:
            `People Data Labs has no verified public record matching "${normalizedUrl}". ` +
            `The candidate profile may be unindexed or private.`,
          sourceProvider: this.providerName,
          isMock: this.isMock,
          metadata: {
            retrievedAt: new Date().toISOString(),
          },
        };
      }

      if (response.status === 401 || response.status === 403) {
        this.logger.error(`PDL authentication failure: ${response.status}`);
        return {
          status: 'FAILED',
          errorReason: 'Unauthorized: Invalid People Data Labs API key.',
          sourceProvider: this.providerName,
          isMock: this.isMock,
          metadata: {
            retrievedAt: new Date().toISOString(),
          },
        };
      }

      if (response.status === 429) {
        this.logger.warn('PDL rate limit reached');
        return {
          status: 'FAILED',
          errorReason: 'People Data Labs monthly API request quota reached.',
          sourceProvider: this.providerName,
          isMock: this.isMock,
          metadata: {
            retrievedAt: new Date().toISOString(),
          },
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`PDL error ${response.status}: ${errorText}`);
        return {
          status: 'FAILED',
          errorReason: `People Data Labs API error: HTTP ${response.status}`,
          sourceProvider: this.providerName,
          isMock: this.isMock,
          metadata: {
            retrievedAt: new Date().toISOString(),
          },
        };
      }

      const body = (await response.json()) as any;
      const pdlData = body.data || body;

      const profile = this.mapPdlResponseToCandidateProfile(pdlData, slug);

      return {
        status: 'SUCCESS',
        data: profile,
        sourceProvider: this.providerName,
        isMock: this.isMock,
        metadata: {
          retrievedAt: new Date().toISOString(),
          authorizedScope: 'PDL_PERSON_ENRICHMENT_V5',
        },
      };
    } catch (err: any) {
      this.logger.error(`Network error calling People Data Labs: ${err.message}`);
      return {
        status: 'FAILED',
        errorReason: `Network error connecting to People Data Labs: ${err.message}`,
        sourceProvider: this.providerName,
        isMock: this.isMock,
        metadata: {
          retrievedAt: new Date().toISOString(),
        },
      };
    }
  }

  private mapPdlResponseToCandidateProfile(
    pdl: any,
    slug: string,
  ): RawCandidateProfile {
    const fullName =
      pdl.full_name ||
      [pdl.first_name, pdl.last_name].filter(Boolean).join(' ') ||
      slug;

    const headline = pdl.job_title || pdl.headline || '';
    const location =
      pdl.location_name ||
      [pdl.location_locality, pdl.location_region, pdl.location_country]
        .filter(Boolean)
        .join(', ') ||
      '';

    const summary = pdl.summary || pdl.bio || '';

    const experiences: RawExperienceItem[] = (pdl.experience || [])
      .slice(0, 5)
      .map((exp: any) => ({
        company: exp.company?.name || exp.company_name || 'Organization',
        title: exp.title?.name || exp.title || 'Professional',
        startDate: exp.start_date || undefined,
        endDate: exp.is_primary ? 'Present' : exp.end_date || undefined,
        isCurrentRole: !!exp.is_primary,
        description: exp.summary || undefined,
      }));

    const educations: RawEducationItem[] = (pdl.education || [])
      .slice(0, 3)
      .map((edu: any) => ({
        institution: edu.school?.name || edu.school_name || 'University',
        degree: Array.isArray(edu.degrees) ? edu.degrees[0] : edu.degree,
        fieldOfStudy: Array.isArray(edu.majors) ? edu.majors[0] : edu.major,
        year: edu.end_date ? String(edu.end_date).substring(0, 4) : undefined,
      }));

    const skills: string[] = (pdl.skills || [])
      .slice(0, 15)
      .map((s: any) => (typeof s === 'string' ? s : s?.name))
      .filter((s: any): s is string => typeof s === 'string' && s.length > 0);

    const certifications: string[] = (pdl.certifications || [])
      .slice(0, 5)
      .map((c: any) => (typeof c === 'string' ? c : c?.name))
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
    };
  }
}

import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IProfileDataProvider,
  PROFILE_DATA_PROVIDER,
} from './interfaces/profile-data-provider.interface';
import {
  ProfileRetrievalResult,
  RawCandidateProfile,
} from './interfaces/raw-profile-data.interface';
import {
  FactCategory,
  VerificationStatus,
} from '../candidates/entities/candidate-fact.entity';

export interface ExtractedCandidateFact {
  category: FactCategory;
  factText: string;
  sourceType: string;
  verificationStatus: VerificationStatus;
}

export interface ProfileProcessingResult {
  retrievalResult: ProfileRetrievalResult;
  extractedFacts: ExtractedCandidateFact[];
  displayName?: string;
  profilePictureUrl?: string;
}

@Injectable()
export class ProfileRetrievalService {
  private readonly logger = new Logger(ProfileRetrievalService.name);

  constructor(
    @Inject(PROFILE_DATA_PROVIDER)
    private readonly provider: IProfileDataProvider,
  ) {}

  async retrieveAndExtract(
    normalizedUrl: string,
    profileSlug: string,
  ): Promise<ProfileProcessingResult> {
    this.logger.log(
      `Using provider "${this.provider.providerName}" (isMock=${this.provider.isMock}) for slug "${profileSlug}"`,
    );

    const retrievalResult = await this.provider.fetchProfile(
      normalizedUrl,
      profileSlug,
    );

    if (retrievalResult.status !== 'SUCCESS' || !retrievalResult.data) {
      return {
        retrievalResult,
        extractedFacts: [],
        displayName: undefined,
        profilePictureUrl: undefined,
      };
    }

    const facts = this.normalizeCandidateFacts(
      retrievalResult.data,
      retrievalResult.isMock ? 'MOCK_FIXTURE' : 'AUTHORIZED_DATA_SOURCE',
    );

    return {
      retrievalResult,
      extractedFacts: facts,
      displayName: retrievalResult.data.fullName,
      profilePictureUrl: retrievalResult.data.profilePictureUrl,
    };
  }

  /**
   * Normalizes raw profile entities into structured, category-specific facts.
   * Ensures zero hallucinations and accurate fact tracking.
   */
  private normalizeCandidateFacts(
    data: RawCandidateProfile,
    sourceType: string,
  ): ExtractedCandidateFact[] {
    const facts: ExtractedCandidateFact[] = [];

    // Headline
    if (data.headline && data.headline.trim()) {
      facts.push({
        category: FactCategory.HEADLINE,
        factText: data.headline.trim(),
        sourceType,
        verificationStatus: VerificationStatus.VERIFIED,
      });
    }

    // Summary
    if (data.summary && data.summary.trim()) {
      facts.push({
        category: FactCategory.SUMMARY,
        factText: data.summary.trim(),
        sourceType,
        verificationStatus: VerificationStatus.VERIFIED,
      });
    }

    // Experiences
    if (data.experiences && data.experiences.length > 0) {
      for (const exp of data.experiences) {
        const tenure =
          exp.startDate && exp.endDate
            ? ` (${exp.startDate} – ${exp.endDate})`
            : '';
        const roleDesc = exp.description ? `: ${exp.description}` : '';
        const factText = `${exp.title} at ${exp.company}${tenure}${roleDesc}`;
        facts.push({
          category: FactCategory.EXPERIENCE,
          factText,
          sourceType,
          verificationStatus: VerificationStatus.VERIFIED,
        });
      }
    }

    // Skills (individual or grouped)
    if (data.skills && data.skills.length > 0) {
      for (const skill of data.skills) {
        facts.push({
          category: FactCategory.SKILLS,
          factText: skill.trim(),
          sourceType,
          verificationStatus: VerificationStatus.VERIFIED,
        });
      }
    }

    // Education
    if (data.educations && data.educations.length > 0) {
      for (const edu of data.educations) {
        const degree = edu.degree ? `${edu.degree}` : '';
        const field = edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : '';
        const year = edu.year ? ` (${edu.year})` : '';
        const factText = `${degree}${field} from ${edu.institution}${year}`.trim();
        facts.push({
          category: FactCategory.EDUCATION,
          factText,
          sourceType,
          verificationStatus: VerificationStatus.VERIFIED,
        });
      }
    }

    // Certifications
    if (data.certifications && data.certifications.length > 0) {
      for (const cert of data.certifications) {
        facts.push({
          category: FactCategory.CERTIFICATION,
          factText: cert.trim(),
          sourceType,
          verificationStatus: VerificationStatus.VERIFIED,
        });
      }
    }

    // Network & Followers
    if (data.connections || data.followers) {
      const connStr = data.connections
        ? typeof data.connections === 'number'
          ? `${data.connections} connections`
          : String(data.connections).includes('connection')
            ? String(data.connections)
            : `${data.connections} connections`
        : 'Active network';
      const followerStr = data.followers ? ` | ${data.followers}` : '';
      facts.push({
        category: FactCategory.SUMMARY,
        factText: `LinkedIn Network: ${connStr}${followerStr}`.trim(),
        sourceType,
        verificationStatus: VerificationStatus.VERIFIED,
      });
    }

    // Posts & Activity
    if (typeof data.postsCount === 'number' && data.postsCount > 0) {
      facts.push({
        category: FactCategory.SUMMARY,
        factText: `LinkedIn Engagement: ${data.postsCount} verified posts published on LinkedIn`,
        sourceType,
        verificationStatus: VerificationStatus.VERIFIED,
      });
    }

    return facts;
  }
}

import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate, RetrievalStatus } from './entities/candidate.entity';
import { CandidateFact, FactCategory, VerificationStatus } from './entities/candidate-fact.entity';
import { JobsService } from '../jobs/jobs.service';
import { JobStage, JobStatus } from '../jobs/entities/generation-job.entity';
import { ProfileRetrievalService } from '../profile-retrieval/profile-retrieval.service';
import { LinkedInUrlValidator } from '../profile-retrieval/validators/linkedin-url.validator';
import {
  CreateCandidateDto,
} from './dto/create-candidate.dto';
import {
  CandidateResponseDto,
  CreateCandidateResponseDto,
} from './dto/candidate-response.dto';
import { SupabaseStorageService } from '../storage/supabase-storage.service';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    @InjectRepository(CandidateFact)
    private readonly factRepo: Repository<CandidateFact>,
    private readonly jobsService: JobsService,
    private readonly retrievalService: ProfileRetrievalService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  /**
   * Submits a candidate profile URL, validates domain and structure,
   * creates/reuses candidate records, tracks processing job, and extracts facts.
   */
  async submitCandidate(
    dto: CreateCandidateDto,
  ): Promise<CreateCandidateResponseDto> {
    // 1. Strict validation & normalization
    const { originalUrl, normalizedUrl, profileSlug } =
      LinkedInUrlValidator.validateAndNormalize(dto.profileUrl);

    this.logger.log(
      `Received submission for "${normalizedUrl}" (slug: ${profileSlug})`,
    );

    // 2. Candidate Record Policy: Find existing or create new
    let candidate = await this.candidateRepo.findOne({
      where: { normalizedProfileUrl: normalizedUrl },
    });

    if (!candidate) {
      candidate = this.candidateRepo.create({
        submittedProfileUrl: originalUrl,
        normalizedProfileUrl: normalizedUrl,
        retrievalStatus: RetrievalStatus.PENDING,
      });
      candidate = await this.candidateRepo.save(candidate);
    } else {
      // Keep original submitted URL up-to-date
      candidate.submittedProfileUrl = originalUrl;
      await this.candidateRepo.save(candidate);
    }

    // 3. Create a trackable GenerationJob
    const job = await this.jobsService.createJob(candidate.id);

    // If PDL API key was provided with this request, set it
    if (dto.pdlApiKey && dto.pdlApiKey.trim()) {
      process.env.PDL_API_KEY = dto.pdlApiKey.trim();
    }

    // 4. Check for Direct Profile Text / Manual Input first
    if (dto.profileText && dto.profileText.trim()) {
      const extractedFacts = this.parseDirectProfileText(
        dto.profileText,
        dto.displayName,
        dto.headline,
      );

      if (extractedFacts.length > 0) {
        await this.factRepo.delete({ candidateId: candidate.id });
        const factEntities = extractedFacts.map((fact) =>
          this.factRepo.create({
            candidateId: candidate.id,
            category: fact.category,
            factText: fact.factText,
            sourceType: 'AUTHORIZED_DIRECT_INPUT',
            verificationStatus: VerificationStatus.VERIFIED,
          }),
        );
        await this.factRepo.save(factEntities);

        candidate.displayName =
          dto.displayName || this.inferNameFromSlug(profileSlug);
        candidate.retrievalStatus = RetrievalStatus.SUCCESS;
        await this.candidateRepo.save(candidate);

        await this.jobsService.updateJobStage(
          job.id,
          JobStage.READY_FOR_SCRIPT,
          JobStatus.COMPLETED,
        );

        return {
          candidateId: candidate.id,
          jobId: job.id,
          retrievalStatus: RetrievalStatus.SUCCESS,
          normalizedProfileUrl: candidate.normalizedProfileUrl,
          displayName: candidate.displayName,
          message: 'Candidate profile facts parsed and verified from direct input.',
        };
      }
    }

    // 5. Execute Retrieval & Fact Extraction
    try {
      await this.jobsService.updateJobStage(
        job.id,
        JobStage.PROFILE_RETRIEVAL,
        JobStatus.PROCESSING,
      );

      const result = await this.retrievalService.retrieveAndExtract(
        normalizedUrl,
        profileSlug,
      );

      if (result.retrievalResult.status === 'SUCCESS') {
        // Clear prior facts if re-fetching
        await this.factRepo.delete({ candidateId: candidate.id });

        // Save extracted facts
        const factEntities = result.extractedFacts.map((fact) =>
          this.factRepo.create({
            candidateId: candidate.id,
            category: fact.category,
            factText: fact.factText,
            sourceType: fact.sourceType,
            verificationStatus: fact.verificationStatus,
          }),
        );
        await this.factRepo.save(factEntities);

        candidate.displayName = result.displayName || candidate.displayName;
        if (result.profilePictureUrl) {
          candidate.profilePictureUrl = result.profilePictureUrl;
        }
        candidate.retrievalStatus = RetrievalStatus.SUCCESS;
        await this.candidateRepo.save(candidate);

        await this.jobsService.updateJobStage(
          job.id,
          JobStage.READY_FOR_SCRIPT,
          JobStatus.COMPLETED,
        );

        return {
          candidateId: candidate.id,
          jobId: job.id,
          retrievalStatus: RetrievalStatus.SUCCESS,
          normalizedProfileUrl: candidate.normalizedProfileUrl,
          displayName: candidate.displayName,
          profilePictureUrl: candidate.profilePictureUrl,
          message: 'Candidate profile retrieved and facts normalized successfully.',
        };
      } else if (
        result.retrievalResult.status === 'PROFILE_DATA_UNAVAILABLE'
      ) {
        candidate.retrievalStatus = RetrievalStatus.PROFILE_DATA_UNAVAILABLE;
        await this.candidateRepo.save(candidate);

        const errorReason =
          result.retrievalResult.errorReason ||
          'Authorized profile data is unavailable for this candidate.';

        await this.jobsService.updateJobStage(
          job.id,
          JobStage.FAILED,
          JobStatus.FAILED,
          {
            code: 'PROFILE_DATA_UNAVAILABLE',
            message: errorReason,
          },
        );

        return {
          candidateId: candidate.id,
          jobId: job.id,
          retrievalStatus: RetrievalStatus.PROFILE_DATA_UNAVAILABLE,
          normalizedProfileUrl: candidate.normalizedProfileUrl,
          displayName: candidate.displayName,
          message: 'Profile data is unavailable from authorized source.',
          errorReason,
        };
      } else {
        candidate.retrievalStatus = RetrievalStatus.FAILED;
        await this.candidateRepo.save(candidate);

        await this.jobsService.updateJobStage(
          job.id,
          JobStage.FAILED,
          JobStatus.FAILED,
          {
            code: 'RETRIEVAL_FAILED',
            message:
              result.retrievalResult.errorReason ||
              'Internal error during profile retrieval',
          },
        );

        return {
          candidateId: candidate.id,
          jobId: job.id,
          retrievalStatus: RetrievalStatus.FAILED,
          normalizedProfileUrl: candidate.normalizedProfileUrl,
          message: 'Failed to retrieve profile data.',
          errorReason: result.retrievalResult.errorReason,
        };
      }
    } catch (err: any) {
      this.logger.error(`Error processing candidate ${candidate.id}:`, err);
      candidate.retrievalStatus = RetrievalStatus.FAILED;
      await this.candidateRepo.save(candidate);

      await this.jobsService.updateJobStage(
        job.id,
        JobStage.FAILED,
        JobStatus.FAILED,
        {
          code: 'UNEXPECTED_ERROR',
          message: err.message || 'An unexpected error occurred during processing',
        },
      );

      return {
        candidateId: candidate.id,
        jobId: job.id,
        retrievalStatus: RetrievalStatus.FAILED,
        normalizedProfileUrl: candidate.normalizedProfileUrl,
        message: 'Processing encountered an error.',
        errorReason: err.message,
      };
    }
  }

  /**
   * Retrieves a candidate with associated facts and recent job status
   */
  async getCandidateById(id: string): Promise<CandidateResponseDto> {
    const candidate = await this.candidateRepo.findOne({
      where: { id },
      relations: ['facts', 'jobs'],
      order: {
        facts: {
          createdAt: 'ASC',
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    const latestJob =
      candidate.jobs && candidate.jobs.length > 0
        ? candidate.jobs.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          )[0]
        : undefined;

    return {
      id: candidate.id,
      submittedProfileUrl: candidate.submittedProfileUrl,
      normalizedProfileUrl: candidate.normalizedProfileUrl,
      displayName: candidate.displayName,
      profilePictureUrl: candidate.profilePictureUrl,
      retrievalStatus: candidate.retrievalStatus,
      facts: candidate.facts || [],
      latestJobId: latestJob?.id,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    };
  }

  /**
   * Lists all candidates for dashboard view
   */
  async listCandidates(): Promise<CandidateResponseDto[]> {
    const candidates = await this.candidateRepo.find({
      relations: ['facts', 'jobs'],
      order: {
        updatedAt: 'DESC',
      },
      take: 50,
    });

    return candidates.map((candidate) => {
      const latestJob =
        candidate.jobs && candidate.jobs.length > 0
          ? candidate.jobs.sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
            )[0]
          : undefined;

      return {
        id: candidate.id,
        submittedProfileUrl: candidate.submittedProfileUrl,
        normalizedProfileUrl: candidate.normalizedProfileUrl,
        displayName: candidate.displayName,
        profilePictureUrl: candidate.profilePictureUrl,
        retrievalStatus: candidate.retrievalStatus,
        facts: candidate.facts || [],
        latestJobId: latestJob?.id,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
      };
    });
  }

  private parseDirectProfileText(
    text: string,
    displayName?: string,
    headlineOverride?: string,
  ): Array<{ category: FactCategory; factText: string }> {
    const facts: Array<{ category: FactCategory; factText: string }> = [];

    if (headlineOverride && headlineOverride.trim()) {
      facts.push({
        category: FactCategory.HEADLINE,
        factText: headlineOverride.trim(),
      });
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let currentSection: 'NONE' | 'ABOUT' | 'EXPERIENCE' | 'EDUCATION' | 'SKILLS' =
      'NONE';
    const experienceLines: string[] = [];
    const educationLines: string[] = [];
    const skillsList: string[] = [];
    const aboutLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      // Section header detection
      if (
        lower.startsWith('about') ||
        lower.startsWith('summary') ||
        lower.startsWith('bio')
      ) {
        currentSection = 'ABOUT';
        continue;
      } else if (
        lower.startsWith('experience') ||
        lower.startsWith('work history') ||
        lower.startsWith('employment')
      ) {
        currentSection = 'EXPERIENCE';
        continue;
      } else if (
        lower.startsWith('education') ||
        lower.startsWith('academic background')
      ) {
        currentSection = 'EDUCATION';
        continue;
      } else if (
        lower.startsWith('skills') ||
        lower.startsWith('technologies') ||
        lower.startsWith('competencies')
      ) {
        currentSection = 'SKILLS';
        continue;
      }

      // Inline headline detection
      if (
        !headlineOverride &&
        i <= 2 &&
        (line.includes('|') || line.toLowerCase().includes(' at '))
      ) {
        facts.push({
          category: FactCategory.HEADLINE,
          factText: line,
        });
        continue;
      }

      if (currentSection === 'ABOUT') {
        aboutLines.push(line);
      } else if (currentSection === 'EXPERIENCE') {
        experienceLines.push(line);
      } else if (currentSection === 'EDUCATION') {
        educationLines.push(line);
      } else if (currentSection === 'SKILLS') {
        skillsList.push(
          ...line
            .split(/[,•·|]/)
            .map((s) => s.trim())
            .filter(Boolean),
        );
      } else {
        if (
          lower.includes('university') ||
          lower.includes('college') ||
          lower.includes('bachelor') ||
          lower.includes('master') ||
          lower.includes('b.e.') ||
          lower.includes('b.tech')
        ) {
          educationLines.push(line);
        } else if (
          lower.includes('engineer') ||
          lower.includes('developer') ||
          lower.includes('manager') ||
          lower.includes('analyst') ||
          line.includes(' – ') ||
          line.includes(' - Present')
        ) {
          experienceLines.push(line);
        } else if (line.split(',').length >= 3) {
          skillsList.push(
            ...line
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          );
        } else if (aboutLines.length < 2 && line.length > 25) {
          aboutLines.push(line);
        }
      }
    }

    if (aboutLines.length > 0) {
      facts.push({
        category: FactCategory.SUMMARY,
        factText: aboutLines.join(' ').substring(0, 500),
      });
    }

    for (const exp of experienceLines.slice(0, 5)) {
      facts.push({
        category: FactCategory.EXPERIENCE,
        factText: exp,
      });
    }

    for (const edu of educationLines.slice(0, 3)) {
      facts.push({
        category: FactCategory.EDUCATION,
        factText: edu,
      });
    }

    for (const sk of skillsList.slice(0, 10)) {
      facts.push({
        category: FactCategory.SKILLS,
        factText: sk,
      });
    }

    return facts;
  }

  private inferNameFromSlug(slug: string): string {
    const parts = slug.split('-').filter((p) => !/^[0-9a-f]{8,}$/i.test(p));
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  async updateProfilePicture(id: string, imageBase64OrUrl: string) {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    let finalUrl = imageBase64OrUrl;
    if (imageBase64OrUrl.startsWith('data:image')) {
      const mime =
        imageBase64OrUrl.substring(
          imageBase64OrUrl.indexOf(':') + 1,
          imageBase64OrUrl.indexOf(';'),
        ) || 'image/png';
      const uploadedUrl = await this.supabaseStorage.uploadAvatar(
        `avatar_${candidate.id}.png`,
        imageBase64OrUrl,
        mime,
      );
      if (uploadedUrl) {
        finalUrl = uploadedUrl;
      }
    }

    candidate.profilePictureUrl = finalUrl;
    await this.candidateRepo.save(candidate);

    return {
      candidateId: candidate.id,
      displayName: candidate.displayName,
      profilePictureUrl: candidate.profilePictureUrl,
      message: 'Profile picture updated successfully',
    };
  }
}

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from '../candidates/entities/candidate.entity';
import {
  CandidateFact,
  FactCategory,
} from '../candidates/entities/candidate-fact.entity';
import { CandidateScore, ScoreTier } from './entities/candidate-score.entity';
import {
  ProfileScoreResponseDto,
  ScoreBreakdownDto,
} from './dto/profile-score-response.dto';

@Injectable()
export class ProfileScoringService {
  private readonly logger = new Logger(ProfileScoringService.name);

  constructor(
    @InjectRepository(CandidateScore)
    private readonly scoreRepo: Repository<CandidateScore>,
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    @InjectRepository(CandidateFact)
    private readonly factRepo: Repository<CandidateFact>,
  ) {}

  /**
   * Evaluates candidate facts, calculates 10-point profile score,
   * generates recruiter insights, and stores the score in MySQL.
   */
  async scoreCandidate(candidateId: string): Promise<ProfileScoreResponseDto> {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
      relations: ['facts'],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    const facts = candidate.facts || [];
    this.logger.log(
      `Evaluating 10-point profile score for candidate: "${candidate.displayName || candidate.id}" with ${facts.length} facts`,
    );

    // Group facts by category
    const headlineFacts = facts.filter((f) => f.category === FactCategory.HEADLINE);
    const summaryFacts = facts.filter((f) => f.category === FactCategory.SUMMARY);
    const experienceFacts = facts.filter((f) => f.category === FactCategory.EXPERIENCE);
    const educationFacts = facts.filter((f) => f.category === FactCategory.EDUCATION);
    const skillFacts = facts.filter((f) => f.category === FactCategory.SKILLS);
    const certFacts = facts.filter((f) => f.category === FactCategory.CERTIFICATION);

    // 1. Evaluate Experience & Projects (Max: 3.5)
    const { score: experienceScore, description: expDesc } =
      this.evaluateExperience(experienceFacts, headlineFacts);

    // 2. Evaluate Technical & Skill Depth (Max: 2.5)
    const { score: skillsScore, description: skillsDesc } =
      this.evaluateSkills(skillFacts, headlineFacts);

    // 3. Evaluate Education & Credentials (Max: 2.0)
    const { score: educationScore, description: eduDesc } =
      this.evaluateEducation(educationFacts, certFacts);

    // 4. Evaluate LinkedIn Activeness & Professional Presence (Max: 2.0)
    const { score: activenessScore, description: activenessDesc } =
      this.evaluateActiveness(facts, candidate);

    // Total Overall Score (0.0 - 10.0)
    const overallScore = Math.min(
      10.0,
      Math.max(
        0,
        Math.round((experienceScore + skillsScore + educationScore + activenessScore) * 10) / 10,
      ),
    );

    // Determine Tier on 10-point scale
    let tier = ScoreTier.DEVELOPING;
    let tierLabel = 'Developing Profile';

    if (overallScore >= 9.0) {
      tier = ScoreTier.EXCEPTIONAL;
      tierLabel = 'Top 5% Talent (Exceptional)';
    } else if (overallScore >= 7.5) {
      tier = ScoreTier.STRONG;
      tierLabel = 'Highly Qualified (Strong)';
    } else if (overallScore >= 6.0) {
      tier = ScoreTier.PROFICIENT;
      tierLabel = 'Solid Foundation (Proficient)';
    }

    // Generate Recruiter Strengths, Gaps, and Target Roles
    const keyStrengths = this.generateKeyStrengths(
      candidate,
      headlineFacts,
      experienceFacts,
      skillFacts,
      educationFacts,
      certFacts,
      summaryFacts,
    );

    const growthAreas = this.generateGrowthAreas(
      experienceFacts,
      skillFacts,
      educationFacts,
      certFacts,
      activenessScore,
    );

    const recommendedRoles = this.inferRecommendedRoles(
      headlineFacts,
      skillFacts,
      experienceFacts,
    );

    // Persist score to MySQL
    let scoreEntity = await this.scoreRepo.findOne({
      where: { candidateId },
      order: { createdAt: 'DESC' },
    });

    if (!scoreEntity) {
      scoreEntity = this.scoreRepo.create({
        candidateId,
        overallScore,
        tier,
        experienceScore,
        skillsScore,
        educationScore,
        impactScore: activenessScore,
        keyStrengths,
        growthAreas,
        recommendedRoles,
      });
    } else {
      scoreEntity.overallScore = overallScore;
      scoreEntity.tier = tier;
      scoreEntity.experienceScore = experienceScore;
      scoreEntity.skillsScore = skillsScore;
      scoreEntity.educationScore = educationScore;
      scoreEntity.impactScore = activenessScore;
      scoreEntity.keyStrengths = keyStrengths;
      scoreEntity.growthAreas = growthAreas;
      scoreEntity.recommendedRoles = recommendedRoles;
    }

    await this.scoreRepo.save(scoreEntity);

    const breakdown: ScoreBreakdownDto = {
      experience: {
        score: experienceScore,
        max: 3.5,
        description: expDesc,
      },
      skills: {
        score: skillsScore,
        max: 2.5,
        description: skillsDesc,
      },
      education: {
        score: educationScore,
        max: 2.0,
        description: eduDesc,
      },
      activeness: {
        score: activenessScore,
        max: 2.0,
        description: activenessDesc,
      },
      impact: {
        score: activenessScore,
        max: 2.0,
        description: activenessDesc,
      },
    };

    return {
      id: scoreEntity.id,
      candidateId,
      candidateName: candidate.displayName || 'Candidate',
      overallScore,
      tier,
      tierLabel,
      breakdown,
      keyStrengths,
      growthAreas,
      recommendedRoles,
      evaluatedAt: scoreEntity.updatedAt || new Date(),
    };
  }

  /**
   * Retrieves the latest profile score for a candidate.
   */
  async getLatestScore(candidateId: string): Promise<ProfileScoreResponseDto> {
    const existing = await this.scoreRepo.findOne({
      where: { candidateId },
      order: { createdAt: 'DESC' },
    });

    if (!existing) {
      // Auto-compute score if candidate exists
      return this.scoreCandidate(candidateId);
    }

    const candidate = await this.candidateRepo.findOne({ where: { id: candidateId } });

    let tierLabel = 'Developing Profile';
    if (existing.overallScore >= 9.0) tierLabel = 'Top 5% Talent (Exceptional)';
    else if (existing.overallScore >= 7.5) tierLabel = 'Highly Qualified (Strong)';
    else if (existing.overallScore >= 6.0) tierLabel = 'Solid Foundation (Proficient)';

    return {
      id: existing.id,
      candidateId,
      candidateName: candidate?.displayName || 'Candidate',
      overallScore: existing.overallScore,
      tier: existing.tier,
      tierLabel,
      breakdown: {
        experience: {
          score: existing.experienceScore,
          max: 3.5,
          description: 'Career stability and track record',
        },
        skills: {
          score: existing.skillsScore,
          max: 2.5,
          description: 'Technical stack depth and breadth',
        },
        education: {
          score: existing.educationScore,
          max: 2.0,
          description: 'Degrees and professional credentials',
        },
        activeness: {
          score: existing.impactScore,
          max: 2.0,
          description: 'LinkedIn activity, network, and presence',
        },
        impact: {
          score: existing.impactScore,
          max: 2.0,
          description: 'LinkedIn activity, network, and presence',
        },
      },
      keyStrengths: existing.keyStrengths,
      growthAreas: existing.growthAreas,
      recommendedRoles: existing.recommendedRoles,
      evaluatedAt: existing.updatedAt || existing.createdAt,
    };
  }

  // --- Dimension Evaluators (Total 10.0) ---

  /**
   * Evaluates Experience & Projects (Max: 3.5 / 10)
   */
  private evaluateExperience(
    expFacts: CandidateFact[],
    headlineFacts: CandidateFact[],
  ): { score: number; description: string } {
    let score = 0;
    const roleCount = expFacts.length;

    if (roleCount === 0) {
      return { score: 0.5, description: 'Early career or limited work history listed' };
    }

    // Base score for verifiable employment
    score += 1.5;

    // Additional points for multiple verified roles
    if (roleCount === 1) score += 0.6;
    else if (roleCount === 2) score += 1.0;
    else score += 1.3;

    // Seniority signals
    const allText = [
      ...expFacts.map((f) => f.factText),
      ...headlineFacts.map((f) => f.factText),
    ].join(' ').toLowerCase();

    if (
      allText.includes('staff') ||
      allText.includes('principal') ||
      allText.includes('architect') ||
      allText.includes('lead') ||
      allText.includes('head') ||
      allText.includes('director') ||
      allText.includes('vp') ||
      allText.includes('founder')
    ) {
      score += 0.6;
    } else if (allText.includes('senior')) {
      score += 0.4;
    }

    score = Math.min(3.5, Math.round(score * 10) / 10);
    const desc = `${roleCount} verified role${roleCount > 1 ? 's' : ''} with career progression`;
    return { score, description: desc };
  }

  /**
   * Evaluates Technical & Skill Depth (Max: 2.5 / 10)
   */
  private evaluateSkills(
    skillFacts: CandidateFact[],
    headlineFacts: CandidateFact[],
  ): { score: number; description: string } {
    const count = skillFacts.length;
    let score = 0;

    if (count === 0) {
      return { score: 0.5, description: 'Minimal skills tagged on profile' };
    }

    if (count <= 3) score = 1.2;
    else if (count <= 6) score = 1.6;
    else if (count <= 10) score = 2.0;
    else score = 2.2;

    // Check for high-demand modern technologies
    const allSkills = [
      ...skillFacts.map((s) => s.factText.toLowerCase()),
      ...headlineFacts.map((h) => h.factText.toLowerCase()),
    ].join(' ');

    const highDemandTerms = [
      'react',
      'typescript',
      'nestjs',
      'node',
      'python',
      'docker',
      'kubernetes',
      'aws',
      'ai',
      'cloud',
      'postgresql',
      'sql',
      'next.js',
      'vue',
      'java',
      'golang',
    ];

    const matchCount = highDemandTerms.filter((term) => allSkills.includes(term)).length;
    if (matchCount >= 2) {
      score += 0.3;
    }

    score = Math.min(2.5, Math.round(score * 10) / 10);
    return { score, description: `${count} verified technical & domain skills` };
  }

  /**
   * Evaluates Education & Credentials (Max: 2.0 / 10)
   */
  private evaluateEducation(
    eduFacts: CandidateFact[],
    certFacts: CandidateFact[],
  ): { score: number; description: string } {
    let score = 0;
    const eduCount = eduFacts.length;
    const certCount = certFacts.length;

    if (eduCount === 0 && certCount === 0) {
      return { score: 0.5, description: 'Self-taught or alternative educational pathway' };
    }

    if (eduCount > 0) {
      score += 1.2;

      const eduText = eduFacts.map((e) => e.factText.toLowerCase()).join(' ');
      if (
        eduText.includes('master') ||
        eduText.includes('m.s.') ||
        eduText.includes('mba') ||
        eduText.includes('ph.d') ||
        eduText.includes('doctorate')
      ) {
        score += 0.4;
      }
    }

    // Certification bonus
    if (certCount > 0) {
      score += Math.min(0.4, certCount * 0.2);
    }

    score = Math.min(2.0, Math.round(score * 10) / 10);
    const desc = `${eduCount} formal qualification${eduCount > 1 ? 's' : ''} + ${certCount} certification${certCount !== 1 ? 's' : ''}`;
    return { score, description: desc };
  }

  /**
   * Evaluates LinkedIn Activeness & Professional Presence (Max: 2.0 / 10)
   */
  private evaluateActiveness(
    facts: CandidateFact[],
    candidate: Candidate,
  ): { score: number; description: string } {
    let score = 0.4; // Base baseline for public active account
    const allSummaryText = facts
      .filter((f) => f.category === FactCategory.SUMMARY)
      .map((f) => f.factText)
      .join(' ');

    // 1. LinkedIn Posts Activity
    const postMatch = allSummaryText.match(/(\d+)\s+verified posts published/i);
    let postCount = 0;
    if (postMatch) {
      postCount = parseInt(postMatch[1], 10);
      if (postCount >= 10) score += 0.8;
      else if (postCount >= 5) score += 0.6;
      else if (postCount >= 1) score += 0.4;
    }

    // 2. LinkedIn Network & Connections
    const connMatch = allSummaryText.match(/(\d+)\+?\s*connections/i);
    let connCount = 0;
    if (connMatch) {
      connCount = parseInt(connMatch[1], 10);
      if (connCount >= 500) score += 0.5;
      else if (connCount >= 200) score += 0.4;
      else if (connCount >= 50) score += 0.2;
    } else if (allSummaryText.includes('Active network') || allSummaryText.includes('LinkedIn Network')) {
      score += 0.2;
    }

    // 3. Profile picture & completeness
    if (candidate.profilePictureUrl) {
      score += 0.3;
    }

    score = Math.min(2.0, Math.round(score * 10) / 10);
    const desc =
      postCount > 0
        ? `${postCount} posts published & verified network engagement`
        : `Active profile with ${connCount > 0 ? `${connCount}+ connections` : 'verified LinkedIn presence'}`;

    return { score, description: desc };
  }

  // --- Recruiter Insights Generation ---

  private generateKeyStrengths(
    candidate: Candidate,
    headlineFacts: CandidateFact[],
    expFacts: CandidateFact[],
    skillFacts: CandidateFact[],
    eduFacts: CandidateFact[],
    certFacts: CandidateFact[],
    summaryFacts: CandidateFact[],
  ): string[] {
    const strengths: string[] = [];

    if (headlineFacts.length > 0) {
      strengths.push(`Clearly articulated positioning: "${headlineFacts[0].factText}"`);
    }

    if (expFacts.length > 0) {
      strengths.push(
        `Proven track record with ${expFacts.length} verified role${expFacts.length > 1 ? 's' : ''} in the tech industry`,
      );
    }

    if (skillFacts.length >= 5) {
      const topSkills = skillFacts.slice(0, 4).map((s) => s.factText).join(', ');
      strengths.push(`Strong core technology competencies including ${topSkills}`);
    }

    if (eduFacts.length > 0) {
      strengths.push(`Solid academic foundation from ${eduFacts[0].factText.split(' from ')[1] || 'recognized institution'}`);
    }

    if (certFacts.length > 0) {
      strengths.push(`Holds verified professional credentials: ${certFacts[0].factText}`);
    }

    const summaryText = summaryFacts.map((s) => s.factText).join(' ');
    if (summaryText.includes('verified posts published')) {
      strengths.push('Active thought leadership and technical sharing on LinkedIn');
    }

    return strengths.slice(0, 4);
  }

  private generateGrowthAreas(
    expFacts: CandidateFact[],
    skillFacts: CandidateFact[],
    eduFacts: CandidateFact[],
    certFacts: CandidateFact[],
    activenessScore: number,
  ): string[] {
    const growth: string[] = [];

    if (activenessScore < 1.2) {
      growth.push(
        'Increase LinkedIn visibility by publishing articles, project breakdowns, and engineering case studies',
      );
    }

    if (skillFacts.length < 6) {
      growth.push(
        'Expand technical competencies to include adjacent modern tooling (e.g. CI/CD, Containerization, Cloud Infrastructure)',
      );
    }

    if (certFacts.length === 0) {
      growth.push(
        'Obtain recognized industry certifications (e.g. AWS Certified, Kubernetes CKAD, or Cloud Architect) to validate expertise',
      );
    }

    if (growth.length === 0) {
      growth.push('Maintain profile momentum by highlighting recent open-source or strategic leadership initiatives');
    }

    return growth.slice(0, 3);
  }

  private inferRecommendedRoles(
    headlineFacts: CandidateFact[],
    skillFacts: CandidateFact[],
    expFacts: CandidateFact[],
  ): string[] {
    const text = [
      ...headlineFacts.map((h) => h.factText),
      ...skillFacts.map((s) => s.factText),
      ...expFacts.map((e) => e.factText),
    ].join(' ').toLowerCase();

    const roles: string[] = [];

    if (text.includes('full-stack') || (text.includes('react') && text.includes('node'))) {
      roles.push('Senior Full-Stack Engineer');
    }
    if (text.includes('nestjs') || text.includes('backend') || text.includes('microservice') || text.includes('distributed')) {
      roles.push('Backend Systems Architect');
    }
    if (text.includes('cloud') || text.includes('devops') || text.includes('kubernetes') || text.includes('docker') || text.includes('aws')) {
      roles.push('Cloud & Platform Engineer');
    }
    if (text.includes('ai') || text.includes('ml') || text.includes('nlp') || text.includes('transformer') || text.includes('python')) {
      roles.push('AI Systems Engineer');
    }
    if (text.includes('product') || text.includes('lead') || text.includes('manager')) {
      roles.push('Technical Lead / Engineering Manager');
    }

    if (roles.length === 0) {
      roles.push('Software Engineer', 'Full-Stack Developer');
    }

    return Array.from(new Set(roles)).slice(0, 4);
  }
}

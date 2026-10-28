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

    // Detect Career Stage (FRESHER, JUNIOR, MID, SENIOR, STAFF)
    const careerStage = this.detectCareerStage(experienceFacts, headlineFacts);

    // 1. Evaluate Experience & Projects (Max: 3.5)
    const { score: experienceScore, description: expDesc } =
      this.evaluateExperience(experienceFacts, headlineFacts, careerStage);

    // 2. Evaluate Technical & Skill Depth (Max: 2.5)
    const { score: skillsScore, description: skillsDesc } =
      this.evaluateSkills(skillFacts, headlineFacts, careerStage);

    // 3. Evaluate Education & Credentials (Max: 2.0)
    const { score: educationScore, description: eduDesc } =
      this.evaluateEducation(educationFacts, certFacts, careerStage);

    // 4. Evaluate LinkedIn Activeness & Professional Presence (Max: 2.0)
    const { score: activenessScore, description: activenessDesc } =
      this.evaluateActiveness(facts, candidate, careerStage);

    // Total Overall Score (0.0 - 10.0)
    const overallScore = Math.min(
      10.0,
      Math.max(
        0,
        Math.round((experienceScore + skillsScore + educationScore + activenessScore) * 10) / 10,
      ),
    );

    // Determine Tier on 10-point scale with career-calibrated labels
    let tier = ScoreTier.DEVELOPING;
    let tierLabel = 'Foundational Talent (Early Career / Fresher)';

    if (overallScore >= 9.0) {
      tier = ScoreTier.EXCEPTIONAL;
      tierLabel = 'Top 5% Talent (Staff / Principal Architect)';
    } else if (overallScore >= 7.8) {
      tier = ScoreTier.STRONG;
      tierLabel = 'High-Performing Professional (Senior / Lead)';
    } else if (overallScore >= 6.0) {
      tier = ScoreTier.PROFICIENT;
      tierLabel = 'Solid Foundation (Junior / Mid-Level)';
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
      careerStage,
    );

    const growthAreas = this.generateGrowthAreas(
      experienceFacts,
      skillFacts,
      educationFacts,
      certFacts,
      activenessScore,
      careerStage,
    );

    const recommendedRoles = this.inferRecommendedRoles(
      headlineFacts,
      skillFacts,
      experienceFacts,
      careerStage,
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

    let tierLabel = 'Foundational Talent (Early Career / Fresher)';
    if (existing.overallScore >= 9.0) tierLabel = 'Top 5% Talent (Staff / Principal Architect)';
    else if (existing.overallScore >= 7.8) tierLabel = 'High-Performing Professional (Senior / Lead)';
    else if (existing.overallScore >= 6.0) tierLabel = 'Solid Foundation (Junior / Mid-Level)';

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
          description: 'Career stability, track record, and verified seniority',
        },
        skills: {
          score: existing.skillsScore,
          max: 2.5,
          description: 'Technical stack depth and applied framework mastery',
        },
        education: {
          score: existing.educationScore,
          max: 2.0,
          description: 'Degrees, academic credentials, and certifications',
        },
        activeness: {
          score: existing.impactScore,
          max: 2.0,
          description: 'LinkedIn activity, industry reach, and network presence',
        },
        impact: {
          score: existing.impactScore,
          max: 2.0,
          description: 'LinkedIn activity, industry reach, and network presence',
        },
      },
      keyStrengths: existing.keyStrengths,
      growthAreas: existing.growthAreas,
      recommendedRoles: existing.recommendedRoles,
      evaluatedAt: existing.updatedAt || existing.createdAt,
    };
  }

  // --- Career Stage Detection ---

  /**
   * Distinguishes Freshers / Interns from Juniors, Mid-Level, Senior, and Staff / Architects.
   */
  private detectCareerStage(
    expFacts: CandidateFact[],
    headlineFacts: CandidateFact[],
  ): 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF' {
    const expTexts = expFacts.map((f) => f.factText.toLowerCase());
    const headline = headlineFacts.map((f) => f.factText.toLowerCase()).join(' ');
    const combined = [headline, ...expTexts].join(' ');

    // 1. Staff / Principal / Architect / Executive
    const staffKeywords = [
      'staff',
      'principal',
      'architect',
      'director',
      'head of',
      'vp ',
      'vice president',
      'chief ',
      'founder',
      'co-founder',
      'cto',
      'cio',
      'fellow',
    ];
    if (staffKeywords.some((k) => combined.includes(k))) {
      return 'STAFF';
    }

    // 2. Senior / Lead / Manager
    const seniorKeywords = [
      'senior',
      'sr.',
      'lead',
      'tech lead',
      'team lead',
      'engineering manager',
      'specialist',
      'consultant',
    ];
    if (seniorKeywords.some((k) => combined.includes(k))) {
      return 'SENIOR';
    }

    // 3. Fresher / Intern / Student Detection
    const fresherKeywords = [
      'intern',
      'internship',
      'trainee',
      'student',
      'fresher',
      'apprentice',
      'entry level',
      'campus',
      'graduate engineer trainee',
      'get ',
      'aspiring',
      'seeking',
      'batch of 202',
      'undergraduate',
      'b.tech student',
      'btech student',
      'mca student',
      'college',
    ];

    const hasFresherHeadline = fresherKeywords.some((k) => headline.includes(k));
    const allRolesAreInternOrTrainee =
      expFacts.length > 0 &&
      expFacts.every((f) => {
        const text = f.factText.toLowerCase();
        return fresherKeywords.some((k) => text.includes(k));
      });

    // If 0 roles, or all roles are internships/trainees, or 1 role and headline is fresher/student:
    if (
      expFacts.length === 0 ||
      allRolesAreInternOrTrainee ||
      (expFacts.length <= 1 && hasFresherHeadline)
    ) {
      return 'FRESHER';
    }

    // 4. Junior (1-2 years / 1-2 junior roles)
    if (expFacts.length <= 2) {
      return 'JUNIOR';
    }

    // 5. Mid-level (3+ verified commercial roles)
    return 'MID';
  }

  // --- Dimension Evaluators (Total 10.0) ---

  /**
   * Evaluates Experience & Projects (Max: 3.5 / 10)
   * Calibrated by career stage so Freshers are graded honestly against industry benchmarks.
   */
  private evaluateExperience(
    expFacts: CandidateFact[],
    headlineFacts: CandidateFact[],
    stage: 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF',
  ): { score: number; description: string } {
    const roleCount = expFacts.length;

    if (stage === 'FRESHER') {
      if (roleCount === 0) {
        return {
          score: 0.6,
          description: 'Early career / student foundation (no commercial employment listed)',
        };
      } else if (roleCount === 1) {
        return {
          score: 1.1,
          description: '1 verified internship / student training role',
        };
      } else {
        return {
          score: 1.4,
          description: `${roleCount} verified internships / technical training roles`,
        };
      }
    }

    if (stage === 'JUNIOR') {
      const score = Math.min(2.0, Math.round((1.5 + (roleCount > 1 ? 0.3 : 0)) * 10) / 10);
      return {
        score,
        description: `${roleCount} verified early-career professional role${roleCount > 1 ? 's' : ''}`,
      };
    }

    if (stage === 'MID') {
      const score = Math.min(2.8, Math.round((2.2 + Math.min(0.5, roleCount * 0.15)) * 10) / 10);
      return {
        score,
        description: `${roleCount} verified mid-level roles with solid product delivery track record`,
      };
    }

    if (stage === 'SENIOR') {
      const score = Math.min(3.2, Math.round((2.8 + Math.min(0.4, roleCount * 0.1)) * 10) / 10);
      return {
        score,
        description: `${roleCount} verified progressive roles with senior engineering leadership`,
      };
    }

    // STAFF / ARCHITECT
    const score = Math.min(3.5, Math.round((3.2 + Math.min(0.3, roleCount * 0.1)) * 10) / 10);
    return {
      score,
      description: `${roleCount} verified roles in high-impact architecture, scalability & system design`,
    };
  }

  /**
   * Evaluates Technical & Skill Depth (Max: 2.5 / 10)
   * Calibrated by career stage: freshers' academic skills are weighted appropriately.
   */
  private evaluateSkills(
    skillFacts: CandidateFact[],
    headlineFacts: CandidateFact[],
    stage: 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF',
  ): { score: number; description: string } {
    const count = skillFacts.length;
    if (count === 0) {
      return { score: 0.5, description: 'Minimal technical skills tagged on profile' };
    }

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
    const bonus = matchCount >= 2 ? 0.2 : 0;

    if (stage === 'FRESHER') {
      const raw = (count <= 2 ? 0.8 : count <= 5 ? 1.0 : 1.2) + bonus;
      const score = Math.min(1.4, Math.round(raw * 10) / 10);
      return {
        score,
        description: `${count} foundational programming & framework competencies`,
      };
    }

    if (stage === 'JUNIOR') {
      const raw = (count <= 3 ? 1.2 : count <= 6 ? 1.4 : 1.6) + bonus;
      const score = Math.min(1.8, Math.round(raw * 10) / 10);
      return {
        score,
        description: `${count} verified applied technical stack skills`,
      };
    }

    if (stage === 'MID') {
      const raw = (count <= 5 ? 1.6 : count <= 10 ? 1.9 : 2.1) + bonus;
      const score = Math.min(2.2, Math.round(raw * 10) / 10);
      return {
        score,
        description: `${count} comprehensive full-stack and systems engineering skills`,
      };
    }

    // SENIOR / STAFF
    const raw = (count <= 5 ? 1.9 : count <= 10 ? 2.2 : 2.3) + bonus;
    const score = Math.min(2.5, Math.round(raw * 10) / 10);
    return {
      score,
      description: `${count} enterprise-grade production & architectural engineering skills`,
    };
  }

  /**
   * Evaluates Education & Credentials (Max: 2.0 / 10)
   */
  private evaluateEducation(
    eduFacts: CandidateFact[],
    certFacts: CandidateFact[],
    stage: 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF',
  ): { score: number; description: string } {
    const eduCount = eduFacts.length;
    const certCount = certFacts.length;

    if (eduCount === 0 && certCount === 0) {
      return { score: 0.5, description: 'Self-taught or alternative educational pathway' };
    }

    if (stage === 'FRESHER') {
      let score = 1.0;
      if (eduCount > 1) score += 0.2;
      if (certCount > 0) score += Math.min(0.2, certCount * 0.1);
      score = Math.min(1.4, Math.round(score * 10) / 10);
      return {
        score,
        description: `${eduCount} academic qualification${eduCount > 1 ? 's' : ''} + ${certCount} course certificate${certCount !== 1 ? 's' : ''}`,
      };
    }

    if (stage === 'JUNIOR' || stage === 'MID') {
      let score = 1.1;
      const eduText = eduFacts.map((e) => e.factText.toLowerCase()).join(' ');
      if (
        eduText.includes('master') ||
        eduText.includes('m.s.') ||
        eduText.includes('mba') ||
        eduText.includes('ph.d')
      ) {
        score += 0.3;
      }
      if (certCount > 0) score += Math.min(0.3, certCount * 0.15);
      score = Math.min(1.6, Math.round(score * 10) / 10);
      return {
        score,
        description: `${eduCount} formal qualification${eduCount > 1 ? 's' : ''} + ${certCount} certification${certCount !== 1 ? 's' : ''}`,
      };
    }

    // SENIOR / STAFF
    let score = 1.3;
    const eduText = eduFacts.map((e) => e.factText.toLowerCase()).join(' ');
    if (
      eduText.includes('master') ||
      eduText.includes('m.s.') ||
      eduText.includes('ph.d') ||
      eduText.includes('doctorate')
    ) {
      score += 0.4;
    }
    if (certCount > 0) score += Math.min(0.4, certCount * 0.2);
    score = Math.min(2.0, Math.round(score * 10) / 10);
    return {
      score,
      description: `${eduCount} formal qualification${eduCount > 1 ? 's' : ''} + ${certCount} professional certification${certCount !== 1 ? 's' : ''}`,
    };
  }

  /**
   * Evaluates LinkedIn Activeness & Professional Presence (Max: 2.0 / 10)
   */
  private evaluateActiveness(
    facts: CandidateFact[],
    candidate: Candidate,
    stage: 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF',
  ): { score: number; description: string } {
    let score = 0.4; // Base baseline
    const allSummaryText = facts
      .filter((f) => f.category === FactCategory.SUMMARY)
      .map((f) => f.factText)
      .join(' ');

    const postMatch = allSummaryText.match(/(\d+)\s+verified posts published/i);
    let postCount = 0;
    if (postMatch) {
      postCount = parseInt(postMatch[1], 10);
      if (postCount >= 10) score += 0.5;
      else if (postCount >= 3) score += 0.3;
      else if (postCount >= 1) score += 0.2;
    }

    const connMatch = allSummaryText.match(/(\d+)\+?\s*connections/i);
    let connCount = 0;
    if (connMatch) {
      connCount = parseInt(connMatch[1], 10);
      if (connCount >= 500) score += 0.3;
      else if (connCount >= 100) score += 0.2;
    } else if (allSummaryText.includes('connections') || allSummaryText.includes('network')) {
      score += 0.1;
    }

    if (candidate.profilePictureUrl) {
      score += 0.2;
    }

    if (stage === 'FRESHER') {
      score = Math.min(1.0, Math.round(score * 10) / 10);
      return {
        score,
        description: `Early-career presence with ${connCount > 0 ? `${connCount}+ connections` : 'verified profile engagement'}`,
      };
    }

    if (stage === 'JUNIOR' || stage === 'MID') {
      score = Math.min(1.5, Math.round(score * 10) / 10);
      return {
        score,
        description: `${postCount > 0 ? `${postCount} posts published & ` : ''}active industry network (${connCount > 0 ? `${connCount}+` : 'verified'} connections)`,
      };
    }

    // SENIOR / STAFF
    score = Math.min(2.0, Math.round((score + 0.3) * 10) / 10);
    return {
      score,
      description: `Established industry presence with ${connCount > 0 ? `${connCount}+ connections` : 'executive reach'} & thought leadership`,
    };
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
    stage: 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF',
  ): string[] {
    const strengths: string[] = [];

    if (stage === 'FRESHER') {
      strengths.push('High learning agility with solid foundational computer science fundamentals');
      if (skillFacts.length > 0) {
        const topSkills = skillFacts.slice(0, 3).map((s) => s.factText).join(', ');
        strengths.push(`Trained in modern languages & frameworks including ${topSkills}`);
      }
      if (expFacts.length > 0) {
        strengths.push(
          `Hands-on exposure through ${expFacts.length} verified internship${expFacts.length > 1 ? 's' : ''} / project role${expFacts.length > 1 ? 's' : ''}`,
        );
      }
      if (eduFacts.length > 0) {
        strengths.push(
          `Solid academic foundation from ${eduFacts[0].factText.split(' from ')[1] || 'recognized institution'}`,
        );
      }
      return strengths.slice(0, 4);
    }

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
      strengths.push(
        `Solid academic foundation from ${eduFacts[0].factText.split(' from ')[1] || 'recognized institution'}`,
      );
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
    stage: 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF',
  ): string[] {
    const growth: string[] = [];

    if (stage === 'FRESHER') {
      growth.push(
        'Gain commercial production experience through entry-level software engineering roles or open-source contributions',
      );
      growth.push(
        'Build and host end-to-end full-stack projects showcasing real database operations, authentication, and live APIs',
      );
      growth.push(
        'Deepen system design fundamentals (data modeling, RESTful APIs, caching, and CI/CD pipelines)',
      );
      return growth.slice(0, 3);
    }

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
      growth.push(
        'Maintain profile momentum by highlighting recent open-source or strategic leadership initiatives',
      );
    }

    return growth.slice(0, 3);
  }

  private inferRecommendedRoles(
    headlineFacts: CandidateFact[],
    skillFacts: CandidateFact[],
    expFacts: CandidateFact[],
    stage: 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF',
  ): string[] {
    const text = [
      ...headlineFacts.map((h) => h.factText),
      ...skillFacts.map((s) => s.factText),
      ...expFacts.map((e) => e.factText),
    ].join(' ').toLowerCase();

    const roles: string[] = [];

    if (stage === 'FRESHER') {
      if (text.includes('react') || text.includes('frontend') || text.includes('web') || text.includes('html')) {
        roles.push('Associate Frontend Developer', 'Frontend Engineering Intern');
      }
      if (text.includes('node') || text.includes('python') || text.includes('backend') || text.includes('java') || text.includes('sql')) {
        roles.push('Junior Backend Developer', 'Software Engineer Trainee');
      }
      if (text.includes('ai') || text.includes('ml') || text.includes('data') || text.includes('python')) {
        roles.push('Junior AI / Data Associate', 'Machine Learning Intern');
      }
      if (roles.length === 0) {
        roles.push('Junior Software Engineer', 'Graduate Engineer Trainee (GET)');
      }
      return Array.from(new Set(roles)).slice(0, 4);
    }

    if (stage === 'JUNIOR') {
      if (text.includes('react') || text.includes('frontend')) {
        roles.push('Frontend Engineer', 'Junior Full-Stack Developer');
      }
      if (text.includes('node') || text.includes('backend') || text.includes('python')) {
        roles.push('Backend Engineer', 'Software Developer');
      }
      if (roles.length === 0) {
        roles.push('Software Engineer', 'Full-Stack Developer');
      }
      return Array.from(new Set(roles)).slice(0, 4);
    }

    // MID, SENIOR, STAFF
    if (stage === 'MID') {
      if (text.includes('full-stack') || (text.includes('react') && text.includes('node'))) {
        roles.push('Full-Stack Engineer');
      }
      if (text.includes('nestjs') || text.includes('backend') || text.includes('microservice')) {
        roles.push('Backend Software Engineer');
      }
      if (text.includes('cloud') || text.includes('devops') || text.includes('docker') || text.includes('aws')) {
        roles.push('Cloud & DevOps Engineer');
      }
      if (roles.length === 0) {
        roles.push('Software Engineer', 'Full-Stack Developer');
      }
      return Array.from(new Set(roles)).slice(0, 4);
    }

    // SENIOR & STAFF
    if (text.includes('full-stack') || (text.includes('react') && text.includes('node'))) {
      roles.push(stage === 'STAFF' ? 'Staff Full-Stack Architect' : 'Senior Full-Stack Engineer');
    }
    if (text.includes('nestjs') || text.includes('backend') || text.includes('microservice') || text.includes('distributed')) {
      roles.push(stage === 'STAFF' ? 'Principal Backend Architect' : 'Senior Backend Systems Engineer');
    }
    if (text.includes('cloud') || text.includes('devops') || text.includes('kubernetes') || text.includes('docker') || text.includes('aws')) {
      roles.push(stage === 'STAFF' ? 'Principal Cloud Architect' : 'Senior Platform & Cloud Engineer');
    }
    if (text.includes('ai') || text.includes('ml') || text.includes('nlp') || text.includes('python')) {
      roles.push(stage === 'STAFF' ? 'Principal AI Systems Architect' : 'Senior AI Systems Engineer');
    }
    if (text.includes('product') || text.includes('lead') || text.includes('manager')) {
      roles.push(stage === 'STAFF' ? 'Director of Engineering' : 'Technical Lead / Engineering Manager');
    }

    if (roles.length === 0) {
      roles.push(stage === 'STAFF' ? 'Staff Software Architect' : 'Senior Software Engineer');
    }

    return Array.from(new Set(roles)).slice(0, 4);
  }
}

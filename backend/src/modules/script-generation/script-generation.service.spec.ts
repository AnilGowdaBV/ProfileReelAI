import { ScriptGenerationService } from './script-generation.service';
import { Candidate, RetrievalStatus } from '../candidates/entities/candidate.entity';
import { FactCategory, VerificationStatus } from '../candidates/entities/candidate-fact.entity';

describe('ScriptGenerationService', () => {
  let service: ScriptGenerationService;

  beforeEach(() => {
    service = new ScriptGenerationService();
  });

  it('should generate structured scenes from verified candidate facts', () => {
    const mockCandidate: Candidate = {
      id: 'cand-anil',
      submittedProfileUrl: 'https://www.linkedin.com/in/anil-bv-2704a8351/',
      normalizedProfileUrl: 'https://www.linkedin.com/in/anil-bv-2704a8351',
      displayName: 'Anil BV',
      retrievalStatus: RetrievalStatus.SUCCESS,
      facts: [
        {
          id: 'f1',
          candidateId: 'cand-anil',
          category: FactCategory.HEADLINE,
          factText: 'Software Engineer | AI Agents & Intelligent Automation',
          sourceType: 'AUTHORIZED_SOURCE',
          verificationStatus: VerificationStatus.VERIFIED,
          createdAt: new Date(),
          candidate: null as any,
        },
        {
          id: 'f2',
          candidateId: 'cand-anil',
          category: FactCategory.EXPERIENCE,
          factText: 'Software Engineer at Thinkify Labs (2024 - Present): Designing intelligent AI agents.',
          sourceType: 'AUTHORIZED_SOURCE',
          verificationStatus: VerificationStatus.VERIFIED,
          createdAt: new Date(),
          candidate: null as any,
        },
        {
          id: 'f3',
          candidateId: 'cand-anil',
          category: FactCategory.EDUCATION,
          factText: 'Bachelor of Engineering in Computer Science from Sri Venkateshwara College of Engineering',
          sourceType: 'AUTHORIZED_SOURCE',
          verificationStatus: VerificationStatus.VERIFIED,
          createdAt: new Date(),
          candidate: null as any,
        },
        {
          id: 'f4',
          candidateId: 'cand-anil',
          category: FactCategory.SKILLS,
          factText: 'AI Agents',
          sourceType: 'AUTHORIZED_SOURCE',
          verificationStatus: VerificationStatus.VERIFIED,
          createdAt: new Date(),
          candidate: null as any,
        },
      ],
      jobs: [],
      videos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const script = service.generateScriptFromFacts(mockCandidate);

    expect(script.candidateName).toBe('Anil BV');
    expect(script.scenes.length).toBeGreaterThanOrEqual(4);
    expect(script.fullNarration).toContain('Meet Anil BV');
    expect(script.fullNarration).toContain('Thinkify Labs');
    expect(script.fullNarration).toContain('Sri Venkateshwara College of Engineering');
    expect(script.estimatedDurationSeconds).toBeGreaterThan(20);
  });
});

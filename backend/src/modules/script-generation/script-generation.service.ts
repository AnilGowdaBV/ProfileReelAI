import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Candidate } from '../candidates/entities/candidate.entity';
import {
  CandidateFact,
  FactCategory,
} from '../candidates/entities/candidate-fact.entity';
import {
  GeneratedScript,
  ScriptScene,
} from './interfaces/script.interface';

@Injectable()
export class ScriptGenerationService {
  private readonly logger = new Logger(ScriptGenerationService.name);

  /**
   * Generates a grounded, verified narration script structured into 4-5 visual scenes.
   * Strictly avoids inferring or inventing missing career facts.
   */
  generateScriptFromFacts(candidate: Candidate): GeneratedScript {
    if (!candidate.facts || candidate.facts.length === 0) {
      throw new BadRequestException(
        'Cannot generate script: Candidate has no verified facts available.',
      );
    }

    const facts = candidate.facts;
    const name = candidate.displayName || 'The candidate';

    // Group facts by category
    const headlineFacts = facts.filter(
      (f) => f.category === FactCategory.HEADLINE,
    );
    const summaryFacts = facts.filter(
      (f) => f.category === FactCategory.SUMMARY,
    );
    const experienceFacts = facts.filter(
      (f) => f.category === FactCategory.EXPERIENCE,
    );
    const skillFacts = facts.filter((f) => f.category === FactCategory.SKILLS);
    const educationFacts = facts.filter(
      (f) => f.category === FactCategory.EDUCATION,
    );
    const certFacts = facts.filter(
      (f) => f.category === FactCategory.CERTIFICATION,
    );

    const headlineText =
      headlineFacts.length > 0 ? headlineFacts[0].factText : 'Professional';

    const scenes: ScriptScene[] = [];
    let sceneIndex = 1;

    // --- Scene 1: Introduction & Headline ---
    const s1Narration = `Meet ${name}, ${headlineText}. Here is a concise look into their professional journey and impact.`;
    scenes.push({
      sceneIndex: sceneIndex++,
      title: 'Profile Introduction',
      narration: s1Narration,
      durationSeconds: 7,
      visual: {
        headline: name,
        subheadline: headlineText,
        tag: 'VERIFIED CANDIDATE',
      },
      supportingFacts: headlineFacts.map((f) => f.id),
    });

    // --- Scene 2: Career Experience & Current Role ---
    if (experienceFacts.length > 0) {
      const topRole = experienceFacts[0].factText;
      const s2Narration = `In their career, they have demonstrated proven expertise: ${topRole}.`;
      scenes.push({
        sceneIndex: sceneIndex++,
        title: 'Career Milestones',
        narration: s2Narration,
        durationSeconds: 9,
        visual: {
          headline: 'Career Experience',
          subheadline: topRole.slice(0, 80),
          tag: 'EXPERIENCE',
          bullets: experienceFacts.slice(0, 3).map((e) => e.factText.slice(0, 65)),
        },
        supportingFacts: experienceFacts.slice(0, 3).map((f) => f.id),
      });
    }

    // --- Scene 3: Education & Academic Foundation ---
    if (educationFacts.length > 0) {
      const topEdu = educationFacts[0].factText;
      const s3Narration = `Their academic foundation includes ${topEdu}.`;
      scenes.push({
        sceneIndex: sceneIndex++,
        title: 'Education & Foundation',
        narration: s3Narration,
        durationSeconds: 6,
        visual: {
          headline: 'Academic Background',
          subheadline: topEdu,
          tag: 'EDUCATION',
        },
        supportingFacts: educationFacts.map((f) => f.id),
      });
    }

    // --- Scene 4: Core Technical & Leadership Skills ---
    if (skillFacts.length > 0) {
      const topSkills = skillFacts.slice(0, 5).map((s) => s.factText);
      const skillsJoined = topSkills.join(', ');
      const s4Narration = `Key verified technical and professional competencies include ${skillsJoined}.`;
      scenes.push({
        sceneIndex: sceneIndex++,
        title: 'Core Competencies',
        narration: s4Narration,
        durationSeconds: 7,
        visual: {
          headline: 'Core Competencies',
          subheadline: `${skillFacts.length} verified technical competencies`,
          tag: 'SKILLS',
          bullets: topSkills,
        },
        supportingFacts: skillFacts.slice(0, 5).map((f) => f.id),
      });
    }

    // --- Scene 5: Closing Outro ---
    const s5Narration = `That is the verified story of ${name}. One profile. One AI. One powerful story on ProfileReel AI.`;
    scenes.push({
      sceneIndex: sceneIndex++,
      title: 'Profile Story Summary',
      narration: s5Narration,
      durationSeconds: 6,
      visual: {
        headline: name,
        subheadline: 'One profile. One AI. One powerful story.',
        tag: 'PROFILEREEL AI',
      },
      supportingFacts: [],
    });

    const fullNarration = scenes.map((s) => s.narration).join(' ');
    const totalDuration = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);

    return {
      candidateId: candidate.id,
      candidateName: name,
      headline: headlineText,
      fullNarration,
      estimatedDurationSeconds: totalDuration,
      scenes,
      generatedAt: new Date().toISOString(),
      isTemplateFallback: true,
    };
  }
}

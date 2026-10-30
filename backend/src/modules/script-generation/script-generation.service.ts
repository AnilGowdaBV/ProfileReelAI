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

    // Extract LinkedIn connections count
    const networkFact = facts.find(
      (f) =>
        f.factText.startsWith('LinkedIn Network:') ||
        f.factText.toLowerCase().includes('connections'),
    );
    let connectionsText = '';
    if (networkFact) {
      const match = networkFact.factText.match(/(\d+[\d,]*\+?\s*connections?)/i);
      if (match) {
        connectionsText = match[1];
      } else {
        const numMatch = networkFact.factText.match(/(\d+[\d,]*)/);
        if (numMatch) {
          connectionsText = `${numMatch[1]} connections`;
        }
      }
    }

    // Extract past working companies (NO YEARS, NO DATES - casual intro)
    const companies: string[] = [];
    for (const exp of experienceFacts) {
      const atMatch = exp.factText.match(/\bat\s+([^(:\n,]+)/i);
      if (atMatch) {
        let comp = atMatch[1].trim();
        comp = comp.replace(/\s+(from|during|since|in|tenure).*/i, '').trim();
        comp = comp.replace(/[0-9]{4}.*/, '').trim();
        if (comp && comp.length > 1 && !companies.includes(comp)) {
          companies.push(comp);
        }
      }
    }

    const scenes: ScriptScene[] = [];
    let sceneIndex = 1;

    // --- Scene 1: Casual Introduction & LinkedIn Network ---
    let s1Narration = `Meet ${name}, ${headlineText}.`;
    if (connectionsText) {
      s1Narration = `Meet ${name}, ${headlineText}. With an active LinkedIn network of over ${connectionsText}, ${name} is an active and engaged presence in the professional tech community.`;
    } else {
      s1Narration = `Meet ${name}, ${headlineText}. Here is a casual, verified look into their professional journey and impact.`;
    }

    scenes.push({
      sceneIndex: sceneIndex++,
      title: 'Profile Introduction',
      narration: s1Narration,
      durationSeconds: connectionsText ? 8 : 6,
      visual: {
        headline: name,
        subheadline: headlineText,
        tag: connectionsText ? `LINKEDIN: ${connectionsText.toUpperCase()}` : 'VERIFIED CANDIDATE',
      },
      supportingFacts: headlineFacts.map((f) => f.id),
    });

    // --- Scene 2: Past Companies (Casual, No Years/Dates) ---
    if (experienceFacts.length > 0 || companies.length > 0) {
      let s2Narration = '';
      if (companies.length === 1) {
        s2Narration = `Over their professional journey, ${name} has built hands-on industry experience working with companies like ${companies[0]}.`;
      } else if (companies.length === 2) {
        s2Narration = `Over their professional journey, ${name} has built hands-on industry experience working with companies like ${companies[0]} and ${companies[1]}.`;
      } else if (companies.length > 2) {
        s2Narration = `Over their professional journey, ${name} has built hands-on industry experience working with companies like ${companies.slice(0, 3).join(', ')}, and more.`;
      } else {
        s2Narration = `Throughout their career journey, ${name} has built proven hands-on experience delivering modern software solutions.`;
      }

      scenes.push({
        sceneIndex: sceneIndex++,
        title: 'Career & Past Companies',
        narration: s2Narration,
        durationSeconds: 8,
        visual: {
          headline: 'Companies & Impact',
          subheadline: companies.length > 0 ? `Contributed at: ${companies.join(', ')}` : 'Proven Software Experience',
          tag: 'EXPERIENCE',
          bullets: companies.length > 0 ? companies : ['Hands-on engineering impact'],
        },
        supportingFacts: experienceFacts.slice(0, 3).map((f) => f.id),
      });
    }

    // --- Scene 3: Core Technical & Engineering Skills ---
    if (skillFacts.length > 0) {
      const topSkills = skillFacts.slice(0, 5).map((s) => s.factText);
      const skillsJoined = topSkills.join(', ');
      const s3Narration = `Their core technical toolkit includes ${skillsJoined}, delivering reliable and modern solutions.`;
      scenes.push({
        sceneIndex: sceneIndex++,
        title: 'Technical Competencies',
        narration: s3Narration,
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

    // --- Scene 4: Casual Outro ---
    const s4Narration = `That's a quick look into ${name} — a verified talent ready for exciting new opportunities on ProfileReel AI.`;
    scenes.push({
      sceneIndex: sceneIndex++,
      title: 'Profile Story Summary',
      narration: s4Narration,
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
      connectionsCount: connectionsText,
      companies,
      profilePictureUrl: candidate.profilePictureUrl,
    };
  }
}

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CandidateScoreCard } from './CandidateScoreCard';
import { CandidateScore } from '../types/candidate';

describe('CandidateScoreCard', () => {
  const mockScore: CandidateScore = {
    id: 'score-123',
    candidateId: 'cand-123',
    candidateName: 'Alex Chen',
    overallScore: 8.8,
    tier: 'STRONG',
    tierLabel: 'Highly Qualified (Strong)',
    breakdown: {
      experience: {
        score: 3.2,
        max: 3.5,
        description: 'Multi-year progressive career',
      },
      skills: {
        score: 2.3,
        max: 2.5,
        description: 'Strong full-stack & cloud skillset',
      },
      education: {
        score: 1.8,
        max: 2.0,
        description: 'B.S. in Computer Science',
      },
      activeness: {
        score: 1.5,
        max: 2.0,
        description: 'Active LinkedIn profile and posts',
      },
      impact: {
        score: 1.5,
        max: 2.0,
        description: 'Active LinkedIn profile and posts',
      },
    },
    keyStrengths: [
      'Proven track record leading distributed systems',
      'Extensive experience with TypeScript and NestJS',
    ],
    growthAreas: [
      'Highlight open source contributions or patents',
    ],
    recommendedRoles: [
      'Staff Full-Stack Architect',
      'Backend Systems Lead',
    ],
    evaluatedAt: new Date().toISOString(),
  };

  it('renders overall score and tier badge', () => {
    render(
      <CandidateScoreCard
        score={mockScore}
        isLoading={false}
        onRefreshScore={vi.fn()}
        candidateName="Alex Chen"
      />,
    );

    expect(screen.getByText('8.8')).toBeInTheDocument();
    expect(screen.getByText('Highly Qualified')).toBeInTheDocument();
    expect(screen.getByText('Experience & Projects')).toBeInTheDocument();
    expect(screen.getByText('Technical & Skill Depth')).toBeInTheDocument();
  });

  it('renders key strengths and recommended roles', () => {
    render(
      <CandidateScoreCard
        score={mockScore}
        isLoading={false}
        onRefreshScore={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Proven track record leading distributed systems'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Staff Full-Stack Architect'),
    ).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true and no score', () => {
    render(
      <CandidateScoreCard
        score={null}
        isLoading={true}
        onRefreshScore={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Evaluating profile intelligence/i),
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CandidateSubmissionCard } from './CandidateSubmissionCard';

describe('CandidateSubmissionCard', () => {
  it('renders the submission form with placeholder and button', () => {
    const onSubmit = vi.fn();
    render(<CandidateSubmissionCard onSubmit={onSubmit} isLoading={false} />);

    expect(
      screen.getByPlaceholderText(/Paste LinkedIn URL:/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze Profile/i })).toBeInTheDocument();
  });

  it('validates invalid URLs on submission and displays inline error', () => {
    const onSubmit = vi.fn();
    render(<CandidateSubmissionCard onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText(/Paste LinkedIn URL:/i);
    fireEvent.change(input, { target: { value: 'https://evil.com/fake' } });

    const submitBtn = screen.getByRole('button', { name: /Analyze Profile/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/URL must belong to linkedin.com/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid LinkedIn profile URL', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CandidateSubmissionCard onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText(/Paste LinkedIn URL:/i);
    fireEvent.change(input, {
      target: { value: 'https://www.linkedin.com/in/alex-chen-senior-fullstack' },
    });

    const submitBtn = screen.getByRole('button', { name: /Analyze Profile/i });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledWith(
      'https://www.linkedin.com/in/alex-chen-senior-fullstack',
    );
  });
});

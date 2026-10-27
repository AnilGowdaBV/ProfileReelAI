import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders Verified badge for SUCCESS status', () => {
    render(<StatusBadge status="SUCCESS" />);
    expect(screen.getByText('Data Verified')).toBeInTheDocument();
  });

  it('renders Data Unavailable badge for PROFILE_DATA_UNAVAILABLE status', () => {
    render(<StatusBadge status="PROFILE_DATA_UNAVAILABLE" />);
    expect(screen.getByText('Data Unavailable')).toBeInTheDocument();
  });

  it('renders Retrieval Failed badge for FAILED status', () => {
    render(<StatusBadge status="FAILED" />);
    expect(screen.getByText('Retrieval Failed')).toBeInTheDocument();
  });
});

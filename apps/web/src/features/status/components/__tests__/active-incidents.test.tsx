import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ActiveIncidents } from '../active-incidents';
import { PublicIncident } from '../../types/public-status';

describe('ActiveIncidents', () => {
  it('renders active incidents correctly', () => {
    const incidents: PublicIncident[] = [
      {
        id: '1',
        status: 'active',
        startedAt: '2024-01-15T10:30:00Z',
        duration: 3600,
      },
    ];

    render(<ActiveIncidents incidents={incidents} />);

    expect(screen.getByText('Active Incidents')).toBeInTheDocument();
    expect(screen.getByText(/Incident #/)).toBeInTheDocument();
    expect(screen.getByText('Status: Investigating')).toBeInTheDocument();
  });

  it('renders nothing when there are no active incidents', () => {
    const incidents: PublicIncident[] = [
      {
        id: '1',
        status: 'resolved',
        startedAt: '2024-01-15T10:30:00Z',
        resolvedAt: '2024-01-15T11:30:00Z',
        duration: 3600,
      },
    ];

    const { container } = render(<ActiveIncidents incidents={incidents} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when incidents array is empty', () => {
    const { container } = render(<ActiveIncidents incidents={[]} />);
    
    expect(container.firstChild).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { IncidentHistory } from '../incident-history';
import { PublicIncident } from '../../types/public-status';

describe('IncidentHistory', () => {
  it('renders resolved incidents correctly', () => {
    const incidents: PublicIncident[] = [
      {
        id: '1',
        status: 'resolved',
        startedAt: '2024-01-15T10:30:00Z',
        resolvedAt: '2024-01-15T11:30:00Z',
        duration: 3600,
      },
    ];

    render(<IncidentHistory incidents={incidents} />);

    expect(screen.getByText('Incident History')).toBeInTheDocument();
    expect(screen.getByText(/Incident #/)).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('does not show active incidents in history', () => {
    const incidents: PublicIncident[] = [
      {
        id: '1',
        status: 'active',
        startedAt: '2024-01-15T10:30:00Z',
      },
    ];

    const { container } = render(<IncidentHistory incidents={incidents} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when incidents array is empty', () => {
    const { container } = render(<IncidentHistory incidents={[]} />);
    
    expect(container.firstChild).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { OverallStatusBanner } from '../overall-status-banner';
import { OverallStatus } from '../../types/public-status';

describe('OverallStatusBanner', () => {
  it('renders operational status correctly', () => {
    render(<OverallStatusBanner status={OverallStatus.OPERATIONAL} />);
    
    expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
    expect(screen.getByText('Everything is running normally.')).toBeInTheDocument();
  });

  it('renders degraded status correctly', () => {
    render(<OverallStatusBanner status={OverallStatus.DEGRADED} />);
    
    expect(screen.getByText('Some Systems Experiencing Issues')).toBeInTheDocument();
    expect(screen.getByText('Some services are currently degraded.')).toBeInTheDocument();
  });

  it('renders major outage status correctly', () => {
    render(<OverallStatusBanner status={OverallStatus.MAJOR_OUTAGE} />);
    
    expect(screen.getByText('Major Service Disruption')).toBeInTheDocument();
    expect(screen.getByText('Multiple services are currently unavailable.')).toBeInTheDocument();
  });
});

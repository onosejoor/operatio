import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { UptimeDisplay } from '../uptime-display';
import { PublicMonitor, MonitorPerformanceStatus } from '../../types/public-status';

describe('UptimeDisplay', () => {
  it('renders uptime percentages correctly', () => {
    const monitors: PublicMonitor[] = [
      { name: 'API', status: MonitorPerformanceStatus.UP, uptime: 99.99 },
      { name: 'Web App', status: MonitorPerformanceStatus.UP, uptime: 99.98 },
    ];

    render(<UptimeDisplay monitors={monitors} />);

    expect(screen.getByText('Uptime (30 days)')).toBeInTheDocument();
    expect(screen.getByText('99.99%')).toBeInTheDocument();
    expect(screen.getByText('99.98%')).toBeInTheDocument();
  });

  it('defaults to 100% when uptime is undefined', () => {
    const monitors: PublicMonitor[] = [
      { name: 'API', status: MonitorPerformanceStatus.UP },
    ];

    render(<UptimeDisplay monitors={monitors} />);

    expect(screen.getByText('100.00%')).toBeInTheDocument();
  });

  it('renders nothing when monitors array is empty', () => {
    const { container } = render(<UptimeDisplay monitors={[]} />);
    
    expect(container.firstChild).toBeNull();
  });
});

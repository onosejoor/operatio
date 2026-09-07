import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ServiceStatusList } from '../service-status-list';
import { PublicMonitor, MonitorPerformanceStatus } from '../../types/public-status';

describe('ServiceStatusList', () => {
  it('renders monitors correctly', () => {
    const monitors: PublicMonitor[] = [
      { name: 'API', status: MonitorPerformanceStatus.UP, uptime: 99.99 },
      { name: 'Web App', status: MonitorPerformanceStatus.UP, uptime: 99.98 },
    ];

    render(<ServiceStatusList monitors={monitors} />);

    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.getByText('Web App')).toBeInTheDocument();
    expect(screen.getAllByText('Operational')).toHaveLength(2);
  });

  it('renders different status labels correctly', () => {
    const monitors: PublicMonitor[] = [
      { name: 'API', status: MonitorPerformanceStatus.UP },
      { name: 'Database', status: MonitorPerformanceStatus.DOWN },
      { name: 'Cache', status: MonitorPerformanceStatus.SLOW },
      { name: 'New Service', status: MonitorPerformanceStatus.PENDING },
    ];

    render(<ServiceStatusList monitors={monitors} />);

    expect(screen.getByText('Operational')).toBeInTheDocument();
    expect(screen.getByText('Down')).toBeInTheDocument();
    expect(screen.getByText('Degraded')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders nothing when monitors array is empty', () => {
    const { container } = render(<ServiceStatusList monitors={[]} />);
    
    expect(container.firstChild).toBeNull();
  });
});

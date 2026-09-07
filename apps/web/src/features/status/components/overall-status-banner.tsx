import { OverallStatus } from '../types/public-status';
import { cn } from '@operatio/ui/lib/utils';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface OverallStatusBannerProps {
  status: OverallStatus;
}

const statusConfig = {
  [OverallStatus.OPERATIONAL]: {
    label: 'All Systems Operational',
    description: 'Everything is running normally.',
    bgColor: 'bg-status-operational',
    textColor: 'text-status-operational-foreground',
    icon: CheckCircle,
  },
  [OverallStatus.DEGRADED]: {
    label: 'Some Systems Experiencing Issues',
    description: 'Some services are currently degraded.',
    bgColor: 'bg-status-degraded',
    textColor: 'text-status-degraded-foreground',
    icon: AlertTriangle,
  },
  [OverallStatus.MAJOR_OUTAGE]: {
    label: 'Major Service Disruption',
    description: 'Multiple services are currently unavailable.',
    bgColor: 'bg-status-outage',
    textColor: 'text-status-outage-foreground',
    icon: XCircle,
  },
};

export function OverallStatusBanner({ status }: OverallStatusBannerProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(config.bgColor, config.textColor, 'rounded-lg p-6 mb-8')}>
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold">{config.label}</h2>
          <p className="text-sm opacity-90">{config.description}</p>
        </div>
      </div>
    </div>
  );
}

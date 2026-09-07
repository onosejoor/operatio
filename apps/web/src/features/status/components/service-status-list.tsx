import { PublicMonitor, MonitorPerformanceStatus } from '../types/public-status';
import { Card } from '@operatio/ui/components/ui/card';
import { Badge } from '@operatio/ui/components/ui/badge';
import { cn } from '@operatio/ui/lib/utils';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface ServiceStatusListProps {
  monitors: PublicMonitor[];
}

const statusConfig = {
  [MonitorPerformanceStatus.UP]: {
    label: 'Operational',
    badgeVariant: 'operational' as const,
    icon: CheckCircle,
    iconColor: 'text-status-operational',
  },
  [MonitorPerformanceStatus.DOWN]: {
    label: 'Down',
    badgeVariant: 'outage' as const,
    icon: XCircle,
    iconColor: 'text-status-outage',
  },
  [MonitorPerformanceStatus.SLOW]: {
    label: 'Degraded',
    badgeVariant: 'degraded' as const,
    icon: AlertTriangle,
    iconColor: 'text-status-degraded',
  },
  [MonitorPerformanceStatus.PENDING]: {
    label: 'Pending',
    badgeVariant: 'secondary' as const,
    icon: Clock,
    iconColor: 'text-muted-foreground',
  },
};

export function ServiceStatusList({ monitors }: ServiceStatusListProps) {
  if (monitors.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Services</h3>
      <Card>
        {monitors.map((monitor, index) => {
          const config = statusConfig[monitor.status];
          const Icon = config.icon;
          return (
            <div
              key={`${monitor.name}-${index}`}
              className={cn(
                'flex items-center justify-between p-4',
                index !== monitors.length - 1 && 'border-b border-border'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('w-4 h-4', config.iconColor)} aria-hidden="true" />
                <span className="font-medium text-foreground">{monitor.name}</span>
              </div>
              <Badge variant={config.badgeVariant}>{config.label}</Badge>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

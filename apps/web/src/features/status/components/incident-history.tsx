import { PublicIncident } from '../types/public-status';
import { Card } from '@operatio/ui/components/ui/card';
import { Badge } from '@operatio/ui/components/ui/badge';
import { cn } from '@operatio/ui/lib/utils';
import { CheckCircle } from 'lucide-react';

interface IncidentHistoryProps {
  incidents: PublicIncident[];
}

export function IncidentHistory({ incidents }: IncidentHistoryProps) {
  const resolvedIncidents = incidents.filter((incident) => incident.status === 'resolved');

  if (resolvedIncidents.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return ` (${hours}h ${minutes}m)`;
    }
    return ` (${minutes}m)`;
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Incident History</h3>
      <Card>
        {resolvedIncidents.slice(0, 10).map((incident, index) => (
          <div
            key={incident.id}
            className={cn(
              'flex items-center justify-between p-4',
              index !== resolvedIncidents.slice(0, 10).length - 1 && 'border-b border-border'
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-status-operational" aria-hidden="true" />
              <div>
                <h4 className="font-medium text-foreground">Incident #{incident.id.slice(0, 8)}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatDate(incident.startedAt)}
                  {formatDuration(incident.duration)}
                </p>
              </div>
            </div>
            <Badge variant="operational">Resolved</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

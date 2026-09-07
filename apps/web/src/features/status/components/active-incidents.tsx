import { PublicIncident } from '../types/public-status';
import { Card } from '@operatio/ui/components/ui/card';
import { Badge } from '@operatio/ui/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface ActiveIncidentsProps {
  incidents: PublicIncident[];
}

export function ActiveIncidents({ incidents }: ActiveIncidentsProps) {
  const activeIncidents = incidents.filter((incident) => incident.status === 'active');

  if (activeIncidents.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'ongoing';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Active Incidents</h3>
      <div className="space-y-4">
        {activeIncidents.map((incident) => (
          <Card key={incident.id} className="p-4 border-l-4 border-l-status-outage">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-outage" aria-hidden="true" />
                <h4 className="font-semibold text-foreground">Incident #{incident.id.slice(0, 8)}</h4>
              </div>
              <span className="text-sm text-muted-foreground">{formatDuration(incident.duration)}</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Started: {formatDate(incident.startedAt)}</p>
              <Badge variant="outage">Investigating</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

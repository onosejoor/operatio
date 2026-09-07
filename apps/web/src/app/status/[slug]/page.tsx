import { Metadata } from "next";
import { OverallStatusBanner } from "@app/features/status/components/overall-status-banner";
import { ServiceStatusList } from "@app/features/status/components/service-status-list";
import { UptimeDisplay } from "@app/features/status/components/uptime-display";
import { ActiveIncidents } from "@app/features/status/components/active-incidents";
import { IncidentHistory } from "@app/features/status/components/incident-history";
import { getPublicStatus } from "@app/features/status/api/public-status";
import type { PublicStatusResponse } from "@app/features/status/types/public-status";
import { ErrorDisplay } from "@operatio/ui/components/error-display";

interface StatusPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: StatusPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await getPublicStatus(slug);
    return {
      title: `${data.statusPage.name} - Status`,
      description:
        data.statusPage.description ||
        `Current operational status of ${data.statusPage.name}`,
    };
  } catch {
    return {
      title: "Status Page Not Found",
    };
  }
}

async function getStatusData(
  slug: string,
): Promise<PublicStatusResponse | null> {
  try {
    return await getPublicStatus(slug);
  } catch (error) {
    if (error instanceof Error && error.message === "Status page not found") {
      return null;
    }
    throw error;
  }
}

export default async function StatusPage({ params }: StatusPageProps) {
  const { slug } = await params;
  const data = await getStatusData(slug);

  if (!data) {
    return (
      <ErrorDisplay
        message="Status not found"
        url="/"
        urlLabel="Go back home"
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {data.statusPage.logo && (
              <img
                src={data.statusPage.logo}
                alt={`${data.statusPage.name} logo`}
                className="w-12 h-12 rounded-lg object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {data.statusPage.name}
              </h1>
              {data.statusPage.description && (
                <p className="text-muted-foreground mt-1">
                  {data.statusPage.description}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Overall Status */}
        <OverallStatusBanner status={data.status} />

        {/* Active Incidents */}
        <ActiveIncidents incidents={data.incidents} />

        {/* Services */}
        <ServiceStatusList monitors={data.monitors} />

        {/* Uptime */}
        <UptimeDisplay monitors={data.monitors} />

        {/* Incident History */}
        <IncidentHistory incidents={data.incidents} />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <a
              href="https://operatio.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Operatio
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

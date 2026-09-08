import {
  getPublicStatus,
  getPublicStatusMetrics,
} from "@app/features/status/api/public-status";
import { StatusPageView } from "@app/features/status/components/status-page-view";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { notFound } from "next/navigation";

interface StatusPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: StatusPageProps) {
  const { slug } = await params;

  try {
    const statusPage = await getPublicStatus(slug);

    if (!statusPage) {
      notFound();
    }

    return {
      title: `${statusPage.statusPage.name} Status`,
      description:
        statusPage.statusPage.description ||
        "Real-time status updates for our services.",
      logo: statusPage.statusPage.logo || undefined,
    };
  } catch {
    notFound();
  }
}

export default async function StatusPage({ params }: StatusPageProps) {
  const { slug } = await params;

  try {
    const [initialData, initialMetrics] = await Promise.all([
      getPublicStatus(slug),
      getPublicStatusMetrics(slug).catch(() => undefined),
    ]);

    return (
      <StatusPageView
        slug={slug}
        initialData={initialData}
        initialMetrics={initialMetrics}
      />
    );
  } catch {
    return (
      <ErrorDisplay
        message="Status Page Not Found"
        url="/"
        urlLabel="Return to Upwatch"
        fullScreen
      />
    );
  }
}

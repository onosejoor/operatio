import { getPublicStatus } from "@app/features/status/api/public-status";
import { IncidentsPageView } from "@app/features/status/components/incidents-page-view";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { notFound } from "next/navigation";

interface IncidentsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: IncidentsPageProps) {
  const { slug } = await params;

  try {
    const statusPage = await getPublicStatus(slug);

    if (!statusPage) {
      notFound();
    }

    return {
      title: `${statusPage.statusPage.name} Incidents`,
      description:
        statusPage.statusPage.description ||
        "Incident history and updates for our services.",
      logo: statusPage.statusPage.logo || undefined,
    };
  } catch {
    notFound();
  }
}

export default async function IncidentsPage({ params }: IncidentsPageProps) {
  const { slug } = await params;

  try {
    const initialData = await getPublicStatus(slug);

    return <IncidentsPageView slug={slug} initialData={initialData} />;
  } catch (error) {
    return (
      <ErrorDisplay
        message="Status Page Not Found"
        url="/"
        urlLabel="Return to Operatio"
        fullScreen
      />
    );
  }
}

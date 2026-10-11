import { getPublicStatus } from "@app/features/status/api/public-status";
import { UnsubscribeView } from "@app/features/status/components/unsubscribe-view";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { notFound } from "next/navigation";

interface UnsubscribePageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    email?: string;
  }>;
}

export async function generateMetadata({ params }: UnsubscribePageProps) {
  const { slug } = await params;

  try {
    const statusPage = await getPublicStatus(slug);

    if (!statusPage) {
      notFound();
    }

    const logo = statusPage.statusPage.logo;

    return {
      title: `Unsubscribe - ${statusPage.statusPage.name} Status`,
      description: `Unsubscribe from ${statusPage.statusPage.name} status notifications.`,
      icons: logo
        ? {
            icon: logo,
            shortcut: logo,
            apple: logo,
          }
        : undefined,
    };
  } catch {
    notFound();
  }
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: UnsubscribePageProps) {
  const { slug } = await params;
  const { email } = await searchParams;

  try {
    const initialData = await getPublicStatus(slug);

    return (
      <UnsubscribeView
        slug={slug}
        initialData={initialData}
        initialEmail={email}
      />
    );
  } catch {
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

import { Metadata } from "next";
import { getPublicStatus } from "@app/features/status/api/public-status";

interface StatusPageLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: StatusPageLayoutProps): Promise<Metadata> {
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

export default function StatusPageLayout({ children }: StatusPageLayoutProps) {
  return <>{children}</>;
}

import { StatusPagesView } from "@app/features/status/components/status-pages-view";

export default async function OrganizationStatusPagesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return <StatusPagesView orgSlug={orgSlug} />;
}

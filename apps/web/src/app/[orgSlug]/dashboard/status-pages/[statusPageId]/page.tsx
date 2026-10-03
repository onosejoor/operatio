import { StatusPageDetailView } from "@app/features/status/components/status-page-detail-view";

export default async function OrganizationStatusPageDetail({
  params,
}: {
  params: Promise<{ orgSlug: string; statusPageId: string }>;
}) {
  const { orgSlug, statusPageId } = await params;
  return <StatusPageDetailView orgSlug={orgSlug} statusPageId={statusPageId} />;
}

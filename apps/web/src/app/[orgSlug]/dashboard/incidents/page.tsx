import { IncidentsView } from "@app/features/dashboard/components/incidents-view";

export default async function OrganizationIncidentsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return <IncidentsView orgSlug={orgSlug} />;
}

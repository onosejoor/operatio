import { MaintenanceView } from "@app/features/maintenance/components/maintenance-view";

export default async function OrganizationMaintenancePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return <MaintenanceView orgSlug={orgSlug} />;
}

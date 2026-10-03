import { MonitorListView } from "@app/features/monitors/components/monitor-list-view";

export default async function MonitorsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return <MonitorListView orgSlug={orgSlug} />;
}

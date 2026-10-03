import { MonitorDetailView } from "@app/features/monitors/components/monitor-detail-view";

export default async function MonitorPage({
  params,
}: {
  params: Promise<{ orgSlug: string; monitorId: string }>;
}) {
  const { orgSlug, monitorId } = await params;

  return <MonitorDetailView orgSlug={orgSlug} monitorId={monitorId} />;
}

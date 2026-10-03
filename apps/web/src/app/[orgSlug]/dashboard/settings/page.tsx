import { SettingsView } from "@app/features/settings/components/settings-view";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return <SettingsView orgSlug={orgSlug} />;
}

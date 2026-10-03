import { AppShell } from "@app/features/shell/components/app-shell";

export default async function OrganizationDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return <AppShell orgSlug={orgSlug}>{children}</AppShell>;
}

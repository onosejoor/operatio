import { Overview } from "@app/features/dashboard/components/overview";

export default async function OrganizationDashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return <Overview orgSlug={orgSlug} />;
}

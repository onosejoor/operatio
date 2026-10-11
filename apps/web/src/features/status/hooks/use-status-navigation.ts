"use client";

import { useParams, usePathname } from "next/navigation";

export function useStatusNavigation() {
  const pathname = usePathname();
  const { slug } = useParams<{ slug: string }>();

  // If the browser URL path starts with /status/[slug], we are on path-based routing (e.g. useoperatio.vercel.app/status/main).
  // Otherwise, we are on a custom domain / subdomain where the root path is "/" and middleware rewrote it.
  const isPathBased = Boolean(slug && pathname?.startsWith(`/status/${slug}`));
  const basePath = isPathBased ? `/status/${slug}` : "";

  const overviewHref = basePath || "/";
  const incidentsHref = `${basePath}/incidents`;
  const unsubscribeHref = `${basePath}/unsubscribe`;

  const isOverviewActive = pathname === overviewHref;
  const isIncidentsActive = pathname === incidentsHref;

  return {
    slug,
    isPathBased,
    overviewHref,
    incidentsHref,
    unsubscribeHref,
    isOverviewActive,
    isIncidentsActive,
  };
}

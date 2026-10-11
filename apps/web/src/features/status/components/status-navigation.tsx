"use client";

import Link from "next/link";
import { Home, History } from "lucide-react";
import { cn } from "@operatio/ui/lib/utils";
import { useStatusNavigation } from "../hooks/use-status-navigation";

export function StatusNavigation() {
  const { overviewHref, incidentsHref, isOverviewActive, isIncidentsActive } =
    useStatusNavigation();

  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      href: overviewHref,
      isActive: isOverviewActive,
      icon: Home,
    },
    {
      id: "incidents" as const,
      label: "Incidents",
      href: incidentsHref,
      isActive: isIncidentsActive,
      icon: History,
    },
  ];

  return (
    <nav className="hidden sm:flex items-center gap-1 rounded-full border border-border/40 bg-muted/40 p-0.5 text-xs font-medium text-muted-foreground w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "rounded-full px-3 py-1.5 transition-colors hover:text-foreground hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-1.5",
              tab.isActive && "bg-background/90 text-foreground shadow-2xs",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

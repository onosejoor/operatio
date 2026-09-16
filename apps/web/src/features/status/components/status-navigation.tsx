"use client";

import Link from "next/link";
import { Home, History, BarChart3 } from "lucide-react";
import { cn } from "@operatio/ui/lib/utils";
import { usePathname } from "next/navigation";

export function StatusNavigation() {
  const path = usePathname();

  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      href: `/`,
      icon: Home,
    },
    {
      id: "incidents" as const,
      label: "Incidents",
      href: `/incidents`,
      icon: History,
    },
    // {
    //   id: "statistics" as const,
    //   label: "Statistics",
    //   href: `/statistics`,
    //   icon: BarChart3,
    // },
  ];

  return (
    <nav className="flex items-center gap-1 rounded-full border border-border/40 bg-muted/40 p-0.5 text-xs font-medium text-muted-foreground w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = path === tab.href;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "rounded-full px-3 py-1.5 transition-colors hover:text-foreground hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-1.5",
              isActive && "bg-background/90 text-foreground shadow-2xs",
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

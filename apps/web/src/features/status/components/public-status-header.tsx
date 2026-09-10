"use client";

import { OverallStatus } from "../types/public-status";
import { overallStatusConfig } from "@app/lib/status";
import { StatusDot } from "./status-dot";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@operatio/ui/components/ui/button";
import { Badge } from "@operatio/ui/components/ui/badge";
import Image from "next/image";

interface PublicStatusHeaderProps {
  statusPage: {
    name: string;
    description?: string;
    logo?: string;
  };
  overallStatus: OverallStatus;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSubscribe: () => void;
}

export function PublicStatusHeader({
  statusPage,
  overallStatus,
  isRefreshing,
  onRefresh,
  onOpenSubscribe,
}: PublicStatusHeaderProps) {
  const config = overallStatusConfig[overallStatus];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            {statusPage.logo ? (
              <Image
                src={statusPage.logo}
                alt={`${statusPage.name} logo`}
                className="h-8 w-8 rounded-lg object-contain border border-border/40 p-0.5 bg-background shadow-2xs"
                width={32}
                height={32}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30 font-mono text-xs font-semibold text-foreground shadow-2xs">
                {statusPage.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-foreground leading-none">
                  {statusPage.name}
                </span>
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex h-4 px-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground border-border/50"
                >
                  Status
                </Badge>
              </div>
              {statusPage.description ? (
                <span className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-1">
                  {statusPage.description}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Center: In-Page Navigation */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/40 bg-muted/20 p-1 text-xs font-medium text-muted-foreground">
          <a
            href="#services"
            className="rounded-full px-3 py-1 transition-colors hover:text-foreground hover:bg-background/80"
          >
            Services
          </a>
          <a
            href="#incidents"
            className="rounded-full px-3 py-1 transition-colors hover:text-foreground hover:bg-background/80"
          >
            Incidents
          </a>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Refresh button */}
          <Button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border border-border/40 text-xs font-medium"
            title="Refresh status data"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-foreground" : "text-muted-foreground"}`}
            />
            <span className="hidden sm:inline text-[11px] text-muted-foreground">
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </span>
          </Button>

          {/* Subscribe Action */}
          <Button
            onClick={onOpenSubscribe}
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-lg border-border/80 text-xs font-medium shadow-xs"
          >
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Subscribe</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

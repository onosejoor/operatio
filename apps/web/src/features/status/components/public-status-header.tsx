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
  countdown: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSubscribe: () => void;
}

export function PublicStatusHeader({
  statusPage,
  overallStatus,
  countdown,
  isRefreshing,
  onRefresh,
  onOpenSubscribe,
}: PublicStatusHeaderProps) {
  const config = overallStatusConfig[overallStatus];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Identity & Infrastructure Indicator */}
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
              <span className="text-[10px] font-mono text-muted-foreground/80 mt-1">
                Edge Telemetry Surface
              </span>
            </div>
          </div>

          <div className="hidden sm:flex h-4 w-px bg-border/60 mx-1" />

          {/* Operational Beacon Pill */}
          {/* <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-2.5 py-1 text-xs font-medium shadow-2xs">
            <StatusDot
              className={config.dotClass}
              pulse={overallStatus === OverallStatus.MAJOR_OUTAGE}
            />
            <span className={`text-[11px] font-medium ${config.textClass}`}>
              {config.label}
            </span>
          </div> */}
        </div>

        {/* Center: In-Page Observability Jumps */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/40 bg-muted/20 p-1 text-xs font-medium text-muted-foreground">
          <a
            href="#telemetry"
            className="rounded-full px-3 py-1 transition-colors hover:text-foreground hover:bg-background/80"
          >
            Telemetry
          </a>
          <a
            href="#systems"
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
          {/* Live countdown pill */}
          <Button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="ghost"
            title="Trigger instant data re-sync"
          >
            <RefreshCw
              className={`h-3 w-3 ${isRefreshing ? "animate-spin text-foreground" : "opacity-70"}`}
            />
            <span className="hidden sm:inline text-[11px]">Sync in</span>
            <span className="tabular-nums font-semibold text-foreground text-[11px]">
              {countdown}s
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

"use client";

import { useCallback, useState } from "react";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@operatio/ui/components/ui/button";
import { Badge } from "@operatio/ui/components/ui/badge";
import Image from "next/image";
import { SubscribeDialog } from "./subscribe-dialog";
import { StatusNavigation } from "./status-navigation";
import { useQueryClient } from "@tanstack/react-query";
import { statusKeys, usePublicStatus } from "../hooks/use-public-status";
import { useParams } from "next/navigation";
import { LoaderDisplay } from "@operatio/ui/components/loader-display";
import { ErrorDisplay } from "@operatio/ui/components/error-display";
import { OverallStatus } from "../types/public-status";

export function PublicStatusHeader() {
  const [isSubscribeOpen, setIsSubscribeOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { slug } = useParams<{ slug: string }>();

  const queryClient = useQueryClient();

  const { isLoading, data, isError, error } = usePublicStatus(slug, {
    statusPage: {
      name: "Unknown",
      slug: "-",
    },
    status: OverallStatus.OPERATIONAL,
    monitors: [],
    incidents: [],
  });

  const handleRefresh = useCallback(async () => {
    if (!slug || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: statusKeys.public(slug),
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [slug, isRefreshing, queryClient]);

  if (isError) {
    return <ErrorDisplay message={error.message} />;
  }

  if (isLoading) {
    return <LoaderDisplay message="loading" />;
  }

  const { statusPage } = data;

  return (
    <>
      <header className="sticky top-3 z-50 w-full px-4 sm:px-6">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 rounded-full border border-border/60 bg-background/70 px-3.5 sm:px-4 shadow-lg shadow-black/3 backdrop-blur-md backdrop-saturate-150 transition-all dark:shadow-black/20">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            {statusPage.logo ? (
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-background p-1 shadow-2xs">
                <Image
                  src={statusPage.logo}
                  alt={`${statusPage.name} logo`}
                  className="h-full w-full object-contain"
                  width={32}
                  height={32}
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40 font-mono text-xs font-bold text-foreground shadow-2xs">
                {statusPage.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex flex-col min-w-0 justify-center">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs sm:text-sm font-semibold tracking-tight text-foreground leading-none">
                  {statusPage.name}
                </span>
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex h-3.5 px-1.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground border-border/60 bg-muted/20"
                >
                  Status
                </Badge>
              </div>
              {statusPage.description ? (
                <span className="truncate text-[11px] text-muted-foreground/80 leading-none mt-0.5">
                  {statusPage.description}
                </span>
              ) : null}
            </div>
          </div>

          {/* Center: Floating Navigation */}
          <StatusNavigation />

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Refresh Button */}
            <Button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="ghost"
              size="sm"
              aria-label="Refresh status data"
              className="h-7 sm:h-8 gap-1.5 rounded-full border border-border/50 bg-background/40 px-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all"
            >
              <RefreshCw
                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform ${
                  isRefreshing
                    ? "animate-spin text-foreground"
                    : "text-muted-foreground"
                }`}
              />
              <span className="hidden sm:inline text-muted-foreground text-[11px]">
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </span>
            </Button>

            {/* Subscribe Action */}
            <Button
              onClick={() => setIsSubscribeOpen(true)}
              size="sm"
              variant="default"
              className="h-7 sm:h-8 gap-1.5 rounded-full px-3 text-xs font-medium shadow-xs active:scale-95 transition-all"
            >
              <Bell className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="text-[11px] sm:text-xs">Subscribe</span>
            </Button>
          </div>
        </div>
      </header>

      <SubscribeDialog
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        statusPageName={statusPage.name}
      />
    </>
  );
}

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { OverallStatus } from "../types/public-status";
import { statusKeys } from "../hooks/use-public-status";
import { PublicStatusHeader } from "./public-status-header";

interface StatusPageHeaderProps {
  slug: string;
  statusPage: {
    name: string;
    description?: string;
    logo?: string;
  };
  overallStatus: OverallStatus;
  activeTab: "overview" | "statistics";
}

export function StatusPageHeader({
  slug,
  statusPage,
  overallStatus,
  activeTab,
}: StatusPageHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const queryClient = useQueryClient();

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

  return (
    <>
      {/* Header */}
      <PublicStatusHeader
        statusPage={statusPage}
        overallStatus={overallStatus}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </>
  );
}

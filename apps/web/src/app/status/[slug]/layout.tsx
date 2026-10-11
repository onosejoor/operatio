import React from "react";
import type { Metadata } from "next";
import { getPublicStatus } from "@app/features/status/api/public-status";

interface StatusPageLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const statusPage = await getPublicStatus(slug);
    const logo = statusPage?.statusPage?.logo;

    if (!logo) {
      return {};
    }

    return {
      icons: {
        icon: logo,
        shortcut: logo,
        apple: logo,
      },
    };
  } catch {
    return {};
  }
}

export default function StatusPageLayout({ children }: StatusPageLayoutProps) {
  return <>{children}</>;
}

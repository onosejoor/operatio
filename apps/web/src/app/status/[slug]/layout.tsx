import React from "react";

interface StatusPageLayoutProps {
  children: React.ReactNode;
}

export default function StatusPageLayout({ children }: StatusPageLayoutProps) {
  return <>{children}</>;
}

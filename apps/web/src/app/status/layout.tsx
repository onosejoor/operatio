import { PublicStatusFooter } from "@app/features/status/components/public-status-footer";
import { PublicStatusHeader } from "@app/features/status/components/public-status-header";
import { ReactNode } from "react";

export default function StatusLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground selection:bg-brand/20">
      <PublicStatusHeader />
      <div className="min-h-screen">{children}</div>

      <PublicStatusFooter />
    </div>
  );
}

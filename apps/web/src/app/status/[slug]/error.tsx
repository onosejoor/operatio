"use client";

import { ErrorDisplay } from "@operatio/ui/components/error-display";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="min-h-screen bg-background">
      <ErrorDisplay message={error.message} />
    </div>
  );
}

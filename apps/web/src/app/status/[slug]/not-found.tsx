import { ErrorDisplay } from "@operatio/ui/components/error-display";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <ErrorDisplay message="Page not found" fullScreen />
    </div>
  );
}

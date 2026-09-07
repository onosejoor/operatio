import { LoaderDisplay } from "@operatio/ui/components/loader-display";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <LoaderDisplay message="Page not found" />
    </div>
  );
}

import { LoaderDisplay } from "@operatio/ui/components/loader-display";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <LoaderDisplay fullScreen />
    </div>
  );
}

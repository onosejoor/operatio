export function Separator({ className }: { className?: string }) {
  return <div className={`h-px w-full border-t border-border ${className || ""}`} />;
}

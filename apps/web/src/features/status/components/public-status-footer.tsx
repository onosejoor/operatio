"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe } from "lucide-react";
import { useParams } from "next/navigation";

export function PublicStatusFooter({
  statusPageName,
}: {
  statusPageName?: string;
}) {
  const [utcTime, setUtcTime] = useState<string>("");
  const { slug } = useParams<{ slug: string }>();

  const pageName = statusPageName ?? slug;
  // if (!window) {
  //   statusPageName = window?.location.href.split(".")[0];
  // } else {
  //   statusPageName = slug;
  // }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t border-border/40 py-10 mt-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Globe className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span className="tabular-nums">
              {utcTime || "UTC Operational Time"}
            </span>
          </div>
          <span className="text-border">·</span>
          <span className="capitalize">{pageName} Status</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {slug && (
            <>
              <Link
                href={`/status/${slug}/unsubscribe`}
                className="text-muted-foreground hover:text-foreground transition-colors hover:underline"
              >
                Unsubscribe
              </Link>
              <span className="text-border">·</span>
            </>
          )}
          <p>
            Powered by{" "}
            <a
              href={
                process.env.NEXT_PUBLIC_APP_URL ||
                "https://useoperatio.vercel.app"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:underline"
            >
              Operatio
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

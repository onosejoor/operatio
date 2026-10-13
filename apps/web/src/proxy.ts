import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { API_URL } from "./lib/config/env";

const RESERVED_SUBDOMAINS = ["www", "app", "api", "docs"];

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const configuredRoot =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  const rootUrl = new URL(
    configuredRoot.includes("://")
      ? configuredRoot
      : `http://${configuredRoot}`,
  );
  const requestHost = hostname.split(":")[0].toLowerCase();
  const rootHost = rootUrl.hostname.toLowerCase();

  // The main app and its reserved subdomains use the regular application routes.
  if (
    requestHost === rootHost ||
    requestHost === `www.${rootHost}` ||
    requestHost === "localhost"
  ) {
    return NextResponse.next();
  }

  // Rewrite a single subdomain directly under the configured root domain.
  if (requestHost.endsWith(`.${rootHost}`)) {
    const subdomain = requestHost.slice(0, -(rootHost.length + 1));
    if (
      subdomain &&
      !subdomain.includes(".") &&
      !RESERVED_SUBDOMAINS.includes(subdomain)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/status/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Custom domains are resolved through the public API. This must live in proxy.ts:
  // Next.js uses the proxy convention, so middleware.ts is not the active entry point.
  try {
    const lookup = await fetch(
      `${API_URL}/public/status/domain-lookup?domain=${encodeURIComponent(requestHost)}`,
      { cache: "no-store" },
    );

    if (lookup.ok) {
      const json = (await lookup.json()) as { data?: { slug?: string } };
      const slug = json.data?.slug;
      if (slug) {
        const url = request.nextUrl.clone();
        url.pathname = `/status/${slug}${url.pathname === "/" ? "" : url.pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  } catch {
    // Leave unknown or temporarily unresolved hosts on the normal app route.
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};

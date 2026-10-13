import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "./lib/config/env";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  const host = hostname.split(":")[0];

  // Ignore localhost / root domain
  if (
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host === "localhost"
  ) {
    return NextResponse.next();
  }

  const rootHost = ROOT_DOMAIN.split(":")[0]; // strip port — host header already has port removed
  const suffix = `.${rootHost}`;

  // Subdomain routing (e.g. acme.operatio.com)
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length);

    if (!slug || slug.includes(".")) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = `/status/${slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Custom domain routing
  try {
    const lookup = await fetch(
      `${API_URL}/api/v1/public/status/domain-lookup?domain=${encodeURIComponent(host)}`,
      { next: { revalidate: 60 } } as RequestInit,
    );

    if (lookup.ok) {
      const json = (await lookup.json()) as { data?: { slug?: string } };
      const slug = json?.data?.slug;

      if (slug) {
        const url = request.nextUrl.clone();
        url.pathname = `/status/${slug}${pathname === "/" ? "" : pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  } catch {
    // Fall through on error or unreachable backend
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run for everything except Next internals and static files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export function middleware(request: NextRequest) {
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

  if (!host.endsWith(suffix)) {
    return NextResponse.next();
  }

  const slug = host.slice(0, -suffix.length);

  if (!slug || slug.includes(".")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  url.pathname = `/status/${slug}${pathname === "/" ? "" : pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Run for everything except Next internals and static files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

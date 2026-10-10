const DEFAULT_ROOT_DOMAIN = "localhost:3000";

/** Build the public status-page address from the configured root domain. */
export function getPublicStatusUrl(slug: string): string {
  const configuredRoot =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? DEFAULT_ROOT_DOMAIN;
  const rootUrl = new URL(
    configuredRoot.includes("://")
      ? configuredRoot
      : `${typeof window === "undefined" ? "https" : window.location.protocol}//${configuredRoot}`,
  );
  const protocol =
    rootUrl.hostname === "localhost" ? rootUrl.protocol : "https:";
  const encodedSlug = encodeURIComponent(slug);

  // Vercel does not support wildcard subdomains on *.vercel.app without custom domains.
  // Localhost also does not have wildcard DNS out of the box unless hosts file is configured.
  // For *.vercel.app, use path-based routing: https://useoperatio.vercel.app/status/main
  const host = rootUrl.host;
  const hostname = rootUrl.hostname;

  if (hostname.endsWith(".vercel.app") || hostname === "vercel.app") {
    return `${protocol}//${host}/status/${encodedSlug}`;
  }

  // If running on localhost:
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${host}/status/${encodedSlug}`;
  }

  // For production custom domains with wildcard DNS configured (e.g. status.useoperatio.com or company.useoperatio.com)
  return `${protocol}//${encodedSlug}.${host}`;
}

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
  return `${protocol}//${encodedSlug}.${rootUrl.host}`;
}

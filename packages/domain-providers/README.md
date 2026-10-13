# @operatio/domain-providers

Provider adapters for attaching customer-owned hostnames to the Operatio status page application. The package exposes one lifecycle contract (`create`, `get`, and `delete`) and normalized status and DNS instructions.

## Server configuration

Set `CUSTOM_DOMAIN_PROVIDER` to `cloudflare` or `vercel`.

Cloudflare requires `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, and `CLOUDFLARE_FALLBACK_ORIGIN`. This adapter uses Cloudflare for SaaS Custom Hostnames, so the zone and fallback origin must be configured in Cloudflare.

Vercel requires `VERCEL_API_TOKEN` and `VERCEL_PROJECT_ID`. Set `VERCEL_TEAM_ID` when the project belongs to a team. Vercel provisions the domain's certificate after its DNS and ownership checks pass.

Both providers can be configured at once. `CUSTOM_DOMAIN_PROVIDER` selects the provider for new domains, while saved domains keep using the provider recorded when they were created, including after changing the default.

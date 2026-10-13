export type DomainProviderName = "cloudflare" | "vercel";

export type DomainStatus = "PENDING_DNS" | "PENDING_SSL" | "ACTIVE" | "FAILED";

export interface DnsRecordInstruction {
  type: "A" | "AAAA" | "CNAME" | "TXT";
  name: string;
  value: string;
}

export interface ProvisionedDomain {
  id: string;
  status: DomainStatus;
  dnsRecords: DnsRecordInstruction[];
}

export interface DomainProvider {
  readonly name: DomainProviderName;
  create(domain: string): Promise<ProvisionedDomain>;
  get(id: string): Promise<ProvisionedDomain>;
  delete(id: string): Promise<void>;
}

export interface CloudflareProviderConfig {
  apiToken: string;
  zoneId: string;
  fallbackOrigin: string;
}

export interface VercelProviderConfig {
  apiToken: string;
  projectId: string;
  teamId?: string;
}

type CfHostname = {
  id: string;
  hostname: string;
  status?: string;
  ssl?: { status?: string };
  ownership_verification?: { type?: string; name?: string; value?: string };
  verification_records?: Array<{ txt_name?: string; txt_value?: string }>;
  validation_records?: Array<{ txt_name?: string; txt_value?: string }>;
};

type VercelDomain = {
  name: string;
  apexName?: string;
  verified?: boolean;
  verification?: Array<{ type?: string; domain?: string; value?: string }>;
  misconfigured?: boolean;
};

type VercelDomainConfig = {
  recommendedCNAME?: string | VercelDnsRecommendation[] | null;
  recommendedIPv4?: string | VercelDnsRecommendation[] | null;
};

type VercelDnsRecommendation = {
  rank?: number;
  value: string;
};

function preferredDnsValue(
  recommendation: string | VercelDnsRecommendation[] | null | undefined,
): string | undefined {
  if (typeof recommendation === "string") return recommendation;
  return recommendation
    ?.slice()
    .sort(
      (left, right) => (left.rank ?? Infinity) - (right.rank ?? Infinity),
    )[0]?.value;
}

export class DomainProviderError extends Error {
  constructor(
    readonly provider: DomainProviderName,
    readonly detail: string,
    readonly statusCode?: number,
  ) {
    super(`${provider} domain API error: ${detail}`);
    this.name = "DomainProviderError";
  }
}

async function requestJson<T>(
  provider: DomainProviderName,
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as {
    errors?: Array<{ message?: string }>;
    error?: { message?: string };
  } & T;

  if (!response.ok) {
    const detail =
      body.errors
        ?.map((error) => error.message)
        .filter(Boolean)
        .join(", ") ??
      body.error?.message ??
      response.statusText;
    throw new DomainProviderError(
      provider,
      detail || `HTTP ${response.status}`,
      response.status,
    );
  }
  return body;
}

function cfToDomain(hostname: CfHostname): ProvisionedDomain {
  const sslStatus = hostname.ssl?.status ?? "";
  const hostStatus = hostname.status ?? "";
  let status: DomainStatus = "PENDING_DNS";

  if (hostStatus === "active" && sslStatus === "active") status = "ACTIVE";
  else if (
    hostStatus === "active" &&
    ["pending_issuance", "pending_deployment", "pending_validation"].includes(
      sslStatus,
    )
  )
    status = "PENDING_SSL";
  else if (
    ["blocked", "test_failed"].includes(hostStatus) ||
    ["expired", "validation_timed_out", "issuance_timed_out"].includes(
      sslStatus,
    )
  )
    status = "FAILED";

  const records: DnsRecordInstruction[] = [];
  const verification = hostname.ownership_verification;
  if (verification?.name && verification.value) {
    records.push({
      type: "TXT",
      name: verification.name,
      value: verification.value,
    });
  }
  for (const record of [
    ...(hostname.validation_records ?? []),
    ...(hostname.verification_records ?? []),
  ]) {
    if (
      record.txt_name &&
      record.txt_value &&
      !records.some((item) => item.name === record.txt_name)
    ) {
      records.push({
        type: "TXT",
        name: record.txt_name,
        value: record.txt_value,
      });
    }
  }
  return { id: hostname.id, status, dnsRecords: records };
}

export class CloudflareDomainProvider implements DomainProvider {
  readonly name = "cloudflare" as const;
  private readonly baseUrl = "https://api.cloudflare.com/client/v4";

  constructor(private readonly config: CloudflareProviderConfig) {}

  async create(domain: string): Promise<ProvisionedDomain> {
    const result = await requestJson<{
      success: boolean;
      result: CfHostname;
      errors?: Array<{ message?: string }>;
    }>(
      this.name,
      `${this.baseUrl}/zones/${encodeURIComponent(this.config.zoneId)}/custom_hostnames`,
      this.config.apiToken,
      {
        method: "POST",
        body: JSON.stringify({
          hostname: domain,
          ssl: {
            method: "http",
            type: "dv",
            settings: { min_tls_version: "1.2", tls_1_3: "on" },
          },
          custom_origin_server: this.config.fallbackOrigin,
        }),
      },
    );
    if (!result.success)
      throw new DomainProviderError(
        this.name,
        result.errors?.map((e) => e.message).join(", ") || "Unknown error",
      );
    const mapped = cfToDomain(result.result);
    if (this.config.fallbackOrigin) {
      mapped.dnsRecords.unshift({
        type: "CNAME",
        name: domain,
        value: this.config.fallbackOrigin,
      });
    }
    return mapped;
  }

  async get(id: string): Promise<ProvisionedDomain> {
    const result = await requestJson<{
      success: boolean;
      result: CfHostname;
      errors?: Array<{ message?: string }>;
    }>(
      this.name,
      `${this.baseUrl}/zones/${encodeURIComponent(this.config.zoneId)}/custom_hostnames/${encodeURIComponent(id)}`,
      this.config.apiToken,
    );
    if (!result.success)
      throw new DomainProviderError(
        this.name,
        result.errors?.map((e) => e.message).join(", ") || "Unknown error",
      );
    const mapped = cfToDomain(result.result);
    if (this.config.fallbackOrigin) {
      mapped.dnsRecords.unshift({
        type: "CNAME",
        name: result.result.hostname,
        value: this.config.fallbackOrigin,
      });
    }
    return mapped;
  }

  async delete(id: string): Promise<void> {
    const result = await requestJson<{
      success: boolean;
      errors?: Array<{ message?: string }>;
    }>(
      this.name,
      `${this.baseUrl}/zones/${encodeURIComponent(this.config.zoneId)}/custom_hostnames/${encodeURIComponent(id)}`,
      this.config.apiToken,
      { method: "DELETE" },
    );
    if (!result.success)
      throw new DomainProviderError(
        this.name,
        result.errors?.map((e) => e.message).join(", ") || "Unknown error",
      );
  }
}

export class VercelDomainProvider implements DomainProvider {
  readonly name = "vercel" as const;
  private readonly baseUrl = "https://api.vercel.com/v9/projects";

  constructor(private readonly config: VercelProviderConfig) {}

  private get projectUrl(): string {
    return `${this.baseUrl}/${encodeURIComponent(this.config.projectId)}/domains`;
  }

  private withTeam(url: string): string {
    if (!this.config.teamId) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}teamId=${encodeURIComponent(this.config.teamId)}`;
  }

  async create(domain: string): Promise<ProvisionedDomain> {
    let response: VercelDomain;
    try {
      response = await requestJson<VercelDomain>(
        this.name,
        this.withTeam(this.projectUrl),
        this.config.apiToken,
        {
          method: "POST",
          body: JSON.stringify({ name: domain }),
        },
      );
    } catch (createError) {
      // Recover when Vercel attached the domain but persistence failed afterward.
      try {
        const existing = await requestJson<VercelDomain>(
          this.name,
          this.withTeam(`${this.projectUrl}/${encodeURIComponent(domain)}`),
          this.config.apiToken,
        );
        response = existing;
      } catch {
        throw createError;
      }
    }
    return this.toDomain(response, domain, await this.getDnsConfig(domain));
  }

  async get(domain: string): Promise<ProvisionedDomain> {
    const projectDomainUrl = `${this.projectUrl}/${encodeURIComponent(domain)}`;
    const domainUrl = this.withTeam(projectDomainUrl);
    let response: VercelDomain;
    try {
      response = await requestJson<VercelDomain>(
        this.name,
        this.withTeam(`${projectDomainUrl}/verify`),
        this.config.apiToken,
        { method: "POST" },
      );
    } catch (verificationError) {
      // Verification may fail while DNS is still propagating; keep the domain
      // pending using Vercel's latest project-domain state.
      try {
        response = await requestJson<VercelDomain>(
          this.name,
          domainUrl,
          this.config.apiToken,
        );
      } catch {
        throw verificationError;
      }
    }
    return this.toDomain(response, domain, await this.getDnsConfig(domain));
  }

  async delete(domain: string): Promise<void> {
    const url = this.withTeam(
      `${this.projectUrl}/${encodeURIComponent(domain)}`,
    );
    await requestJson<unknown>(this.name, url, this.config.apiToken, {
      method: "DELETE",
    });
  }

  private async getDnsConfig(domain: string): Promise<VercelDomainConfig> {
    const team = this.config.teamId
      ? `?teamId=${encodeURIComponent(this.config.teamId)}`
      : "";
    const url = `https://api.vercel.com/v6/domains/${encodeURIComponent(domain)}/config${team}`;
    try {
      return await requestJson<VercelDomainConfig>(
        this.name,
        url,
        this.config.apiToken,
      );
    } catch {
      // Keep setup available if DNS recommendation lookup is temporarily unavailable.
      return {};
    }
  }

  private toDomain(
    domain: VercelDomain,
    fallbackName: string,
    config: VercelDomainConfig,
  ): ProvisionedDomain {
    const records: DnsRecordInstruction[] = [];
    const name = domain.name || fallbackName;
    const isApex = domain.apexName
      ? name === domain.apexName
      : name.split(".").length === 2;
    if (!isApex) {
      records.push({
        type: "CNAME",
        name,
        value:
          preferredDnsValue(config.recommendedCNAME) || "cname.vercel-dns.com",
      });
    } else {
      records.push({
        type: "A",
        name,
        value: preferredDnsValue(config.recommendedIPv4) || "76.76.21.21",
      });
    }
    for (const record of domain.verification ?? []) {
      if (
        record.type &&
        record.domain &&
        record.value &&
        ["TXT", "CNAME"].includes(record.type)
      ) {
        records.push({
          type: record.type as "TXT" | "CNAME",
          name: record.domain,
          value: record.value,
        });
      }
    }
    return {
      id: name,
      status: domain.verified
        ? "ACTIVE"
        : domain.misconfigured
          ? "FAILED"
          : "PENDING_DNS",
      dnsRecords: records,
    };
  }
}

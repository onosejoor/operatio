import { Injectable } from '@nestjs/common';
import {
  CloudflareDomainProvider,
  VercelDomainProvider,
  type DomainProvider,
  type DomainProviderName,
} from '@operatio/domain-providers';
import { AppConfigService } from '../config/service/app-config.service';
import type { DomainProviderRegistryContract } from './domain-provider.token';

@Injectable()
export class DomainProviderRegistry implements DomainProviderRegistryContract {
  readonly active: DomainProvider;
  private readonly providers = new Map<DomainProviderName, DomainProvider>();

  constructor(config: AppConfigService) {
    const cfToken = config.get('cloudflare.apiToken');
    const cfZoneId = config.get('cloudflare.zoneId');
    if (cfToken && cfZoneId) {
      this.providers.set(
        'cloudflare',
        new CloudflareDomainProvider({
          apiToken: cfToken,
          zoneId: cfZoneId,
          fallbackOrigin: config.get('cloudflare.fallbackOrigin'),
        }),
      );
    }

    const vercelToken = config.get('vercel.apiToken');
    const vercelProjectId = config.get('vercel.projectId');
    if (vercelToken && vercelProjectId) {
      this.providers.set(
        'vercel',
        new VercelDomainProvider({
          apiToken: vercelToken,
          projectId: vercelProjectId,
          teamId: config.get('vercel.teamId'),
        }),
      );
    }

    const selectedName = config.get('customDomains.provider');
    if (selectedName !== 'cloudflare' && selectedName !== 'vercel') {
      throw new Error(`Unsupported CUSTOM_DOMAIN_PROVIDER: ${selectedName}`);
    }

    const active = this.providers.get(selectedName);
    if (!active) {
      const requiredVariables =
        selectedName === 'vercel'
          ? 'VERCEL_API_TOKEN and VERCEL_PROJECT_ID'
          : 'CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID';
      throw new Error(
        `${requiredVariables} are required for ${selectedName} domains`,
      );
    }
    this.active = active;
  }

  get(name: DomainProviderName): DomainProvider | undefined {
    return this.providers.get(name);
  }
}

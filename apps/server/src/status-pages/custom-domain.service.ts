import {
  BadRequestException,
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomDomainProvider, CustomDomainStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type {
  DomainProvider,
  DomainProviderName,
  ProvisionedDomain,
} from '@operatio/domain-providers';
import { DomainProviderError } from '@operatio/domain-providers';
import { PrismaService } from '../database/database.service';
import {
  DOMAIN_PROVIDER,
  type DomainProviderRegistryContract,
} from './domain-provider.token';
import { SetCustomDomainDto } from './dto/set-custom-domain.dto';

@Injectable()
export class CustomDomainService {
  private readonly logger = new Logger(CustomDomainService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(DOMAIN_PROVIDER)
    private readonly providers: DomainProviderRegistryContract,
  ) {}

  async setCustomDomain(
    organizationId: string,
    statusPageId: string,
    dto: SetCustomDomainDto,
  ) {
    // Normalize domain to lowercase
    const domain = dto.domain.toLowerCase().trim();

    // Verify the status page belongs to the organization
    const statusPage = await this.prisma.statusPage.findFirst({
      where: { id: statusPageId, organizationId },
      select: { id: true },
    });
    if (!statusPage) throw new NotFoundException('Status page not found');

    // Check the domain isn't already taken by another page
    const existing = await this.prisma.customDomain.findUnique({
      where: { domain },
      select: { statusPageId: true },
    });
    if (existing && existing.statusPageId !== statusPageId) {
      throw new ConflictException(
        'This domain is already connected to another status page',
      );
    }
    if (existing) {
      throw new ConflictException(
        'A custom domain is already connected to this status page',
      );
    }

    // Check this status page doesn't already have a custom domain
    const existingForPage = await this.prisma.customDomain.findUnique({
      where: { statusPageId },
      select: { id: true },
    });
    if (existingForPage) {
      throw new ConflictException(
        'This status page already has a custom domain. Remove it first.',
      );
    }

    let providerDomain: ProvisionedDomain;
    try {
      providerDomain = await this.providers.active.create(domain);
    } catch (error) {
      if (error instanceof DomainProviderError) {
        if (
          error.statusCode === 409 ||
          /already in use|already assigned|already connected|already exists/i.test(
            error.detail,
          )
        ) {
          throw new ConflictException(
            `This domain is already attached to another ${error.provider} project. Remove it from that project or select the correct project, then try again.`,
          );
        }
        throw new BadGatewayException(
          `The ${error.provider} domain service rejected the request: ${error.detail}`,
        );
      }
      throw error;
    }
    const routingRecord = providerDomain.dnsRecords.find(
      (record) => record.type !== 'TXT',
    );
    const verificationRecord = providerDomain.dnsRecords.find(
      (record) => record.type === 'TXT',
    );

    // Persist the CustomDomain record
    const customDomain = await this.prisma.customDomain.create({
      data: {
        statusPageId,
        domain,
        status: providerDomain.status as CustomDomainStatus,
        provider:
          this.providers.active.name === 'cloudflare'
            ? CustomDomainProvider.CLOUDFLARE
            : CustomDomainProvider.VERCEL,
        providerDomainId: providerDomain.id,
        dnsRecords:
          providerDomain.dnsRecords as unknown as Prisma.InputJsonValue,
        // Retain these fields for clients and records created before provider support.
        cfHostnameId:
          this.providers.active.name === 'cloudflare'
            ? providerDomain.id
            : null,
        cnameTarget: routingRecord?.value ?? null,
        cnameValue: verificationRecord?.value ?? routingRecord?.value ?? null,
      },
    });

    return customDomain;
  }

  async getCustomDomain(organizationId: string, statusPageId: string) {
    // Verify ownership
    const statusPage = await this.prisma.statusPage.findFirst({
      where: { id: statusPageId, organizationId },
      select: { id: true },
    });
    if (!statusPage) throw new NotFoundException('Status page not found');

    const customDomain = await this.prisma.customDomain.findUnique({
      where: { statusPageId },
    });
    if (!customDomain)
      throw new NotFoundException('No custom domain configured');
    return customDomain;
  }

  async refreshStatus(organizationId: string, statusPageId: string) {
    const statusPage = await this.prisma.statusPage.findFirst({
      where: { id: statusPageId, organizationId },
      select: { id: true },
    });
    if (!statusPage) throw new NotFoundException('Status page not found');

    const customDomain = await this.prisma.customDomain.findUnique({
      where: { statusPageId },
    });
    if (!customDomain) return null;

    const providerDomainId =
      customDomain.providerDomainId ?? customDomain.cfHostnameId;
    if (!providerDomainId)
      throw new BadRequestException(
        'No provider domain ID stored — cannot refresh',
      );
    const providerDomain = await this.getProvider(customDomain.provider).get(
      providerDomainId,
    );
    const newStatus = providerDomain.status as CustomDomainStatus;

    const updated = await this.prisma.customDomain.update({
      where: { id: customDomain.id },
      data: {
        status: newStatus,
        dnsRecords:
          providerDomain.dnsRecords as unknown as Prisma.InputJsonValue,
        verifiedAt:
          newStatus !== CustomDomainStatus.PENDING &&
          newStatus !== CustomDomainStatus.PENDING_DNS &&
          !customDomain.verifiedAt
            ? new Date()
            : customDomain.verifiedAt,
        sslIssuedAt:
          newStatus === CustomDomainStatus.ACTIVE && !customDomain.sslIssuedAt
            ? new Date()
            : customDomain.sslIssuedAt,
      },
    });

    return updated;
  }

  async removeCustomDomain(organizationId: string, statusPageId: string) {
    const customDomain = await this.getCustomDomain(
      organizationId,
      statusPageId,
    );

    // Delete from Cloudflare first (best-effort — don't fail if CF errors)
    const providerDomainId =
      customDomain.providerDomainId ?? customDomain.cfHostnameId;
    if (providerDomainId) {
      try {
        await this.getProvider(customDomain.provider).delete(providerDomainId);
      } catch (err) {
        this.logger.warn(
          `Failed to delete ${customDomain.provider} domain ${providerDomainId}: ${(err as Error).message}`,
        );
      }
    }

    await this.prisma.customDomain.delete({ where: { id: customDomain.id } });
  }

  /**
   * Public lookup — no auth. Used by Next.js middleware.
   * Returns only the slug; only resolves ACTIVE domains.
   */
  async findSlugByDomain(domain: string): Promise<string | null> {
    const customDomain = await this.prisma.customDomain.findUnique({
      where: { domain: domain.toLowerCase() },
      select: {
        status: true,
        statusPage: { select: { slug: true, isPublic: true } },
      },
    });

    if (
      !customDomain ||
      customDomain.status !== CustomDomainStatus.ACTIVE ||
      !customDomain.statusPage.isPublic
    ) {
      return null;
    }

    return customDomain.statusPage.slug;
  }

  /**
   * Background poller: sync provider status for all pending custom domains every 5 minutes.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async pollPendingDomains() {
    const pendingDomains = await this.prisma.customDomain.findMany({
      where: {
        status: {
          in: [
            CustomDomainStatus.PENDING,
            CustomDomainStatus.PENDING_DNS,
            CustomDomainStatus.PENDING_SSL,
          ],
        },
        OR: [
          { providerDomainId: { not: null } },
          { cfHostnameId: { not: null } },
        ],
      },
      select: {
        id: true,
        provider: true,
        providerDomainId: true,
        cfHostnameId: true,
        status: true,
        verifiedAt: true,
        sslIssuedAt: true,
      },
    });

    this.logger.log(`Polling ${pendingDomains.length} pending custom domains`);

    await Promise.all(
      pendingDomains.map(async (domain) => {
        try {
          const providerDomainId =
            domain.providerDomainId ?? domain.cfHostnameId!;
          const providerDomain = await this.getProvider(domain.provider).get(
            providerDomainId,
          );
          const newStatus = providerDomain.status as CustomDomainStatus;
          await this.prisma.customDomain.update({
            where: { id: domain.id },
            data: {
              status: newStatus,
              dnsRecords:
                providerDomain.dnsRecords as unknown as Prisma.InputJsonValue,
              verifiedAt:
                newStatus !== CustomDomainStatus.PENDING &&
                newStatus !== CustomDomainStatus.PENDING_DNS &&
                !domain.verifiedAt
                  ? new Date()
                  : domain.verifiedAt,
              sslIssuedAt:
                newStatus === CustomDomainStatus.ACTIVE && !domain.sslIssuedAt
                  ? new Date()
                  : domain.sslIssuedAt,
            },
          });
        } catch (err) {
          this.logger.error(
            `Failed to poll custom domain ${domain.id}: ${(err as Error).message}`,
          );
        }
      }),
    );
  }

  private getProvider(name: string): DomainProvider {
    const providerName = name.toLowerCase();
    if (providerName !== 'cloudflare' && providerName !== 'vercel') {
      throw new BadRequestException(
        `Domain provider "${name}" is not configured`,
      );
    }
    const provider = this.providers.get(providerName as DomainProviderName);
    if (!provider)
      throw new BadRequestException(
        `Domain provider "${name}" is not configured`,
      );
    return provider;
  }
}

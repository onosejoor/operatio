import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/database.service';

const organizationSelect = {
  id: true,
  name: true,
  slug: true,
} as const;

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    return this.prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      select: organizationSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: organizationSelect,
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, userId: string, name: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: id } },
      select: { role: true },
    });
    if (!membership) throw new NotFoundException('Organization not found');
    if (membership.role !== 'OWNER') {
      throw new ForbiddenException('Only organization owners can change workspace settings');
    }
    const trimmedName = name.trim();
    const slug = await this.generateSlug(trimmedName, id);

    return this.prisma.organization.update({
      where: { id },
      data: { name: trimmedName, slug },
      select: organizationSelect,
    });
  }

  private async generateSlug(name: string, organizationId: string) {
    const baseSlug =
      name
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'organization';

    let slug = baseSlug;
    let suffix = 2;
    while (
      await this.prisma.organization.findFirst({
        where: { slug, id: { not: organizationId } },
        select: { id: true },
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }
}

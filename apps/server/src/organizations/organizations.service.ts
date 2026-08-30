import { Injectable, NotFoundException } from '@nestjs/common';
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
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/database.service';
import { CreateStatusPageDto } from './dto/create-status-page.dto';
import { UpdateStatusPageDto } from './dto/update-status-page.dto';

@Injectable()
export class StatusPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    createStatusPageDto: CreateStatusPageDto,
  ) {
    const existingSlug = await this.prisma.statusPage.findUnique({
      where: { slug: createStatusPageDto.slug },
      select: { id: true },
    });

    if (existingSlug) {
      throw new ConflictException('Slug already taken');
    }

    return this.prisma.statusPage.create({
      data: {
        organizationId,
        ...createStatusPageDto,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.statusPage.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, statusPageId: string) {
    const statusPage = await this.prisma.statusPage.findFirst({
      where: {
        id: statusPageId,
        organizationId,
      },
    });

    if (!statusPage) {
      throw new NotFoundException('Status page not found');
    }

    return statusPage;
  }

  async update(
    organizationId: string,
    statusPageId: string,
    updateStatusPageDto: UpdateStatusPageDto,
  ) {
    if (updateStatusPageDto.slug) {
      const existingSlug = await this.prisma.statusPage.findFirst({
        where: {
          slug: updateStatusPageDto.slug,
          id: { not: statusPageId },
        },
        select: { id: true },
      });

      if (existingSlug) {
        throw new ConflictException('Slug already taken');
      }
    }

    const result = await this.prisma.statusPage.updateMany({
      where: {
        id: statusPageId,
        organizationId,
      },
      data: updateStatusPageDto,
    });

    if (result.count === 0) {
      throw new NotFoundException('Status page not found');
    }

    return this.findOne(organizationId, statusPageId);
  }

  async delete(organizationId: string, statusPageId: string) {
    const result = await this.prisma.statusPage.deleteMany({
      where: {
        id: statusPageId,
        organizationId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Status page not found');
    }
  }
}

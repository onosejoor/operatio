import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { OrganizationRequest } from '../../organizations/decorators/current-organization-id.decorator';
import { PrismaService } from '../../database/database.service';

@Injectable()
export class OrganizationMembershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<OrganizationRequest & { params: { id?: string; organizationId?: string } }>();
    const organizationId = request.params.organizationId ?? request.params.id;

    if (!organizationId || !request.user) {
      throw new ForbiddenException('Organization membership is required');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: request.user.id,
          organizationId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    request.organizationId = organizationId;
    return true;
  }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/decorators/current-user.decorator';

export interface OrganizationRequest extends AuthenticatedRequest {
  organizationId: string;
}

export const CurrentOrganizationId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<OrganizationRequest>();

    return request.organizationId;
  },
);

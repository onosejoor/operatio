import { ForbiddenException } from '@nestjs/common';
import { OrganizationMembershipGuard } from './organization-membership.guard';

describe('OrganizationMembershipGuard', () => {
  const prisma = { membership: { findUnique: jest.fn() } };
  const guard = new OrganizationMembershipGuard(prisma as never);
  const request = (params: { id?: string; organizationId?: string }) => ({
    user: { id: 'user-id' },
    params,
  });
  const context = (currentRequest: ReturnType<typeof request>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => currentRequest,
      }),
    }) as never;

  beforeEach(() => jest.clearAllMocks());

  it('authorizes membership and attaches the organization context', async () => {
    const currentRequest = request({ id: 'organization-id' });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-id' });

    await expect(guard.canActivate(context(currentRequest))).resolves.toBe(true);
    expect(currentRequest).toMatchObject({ organizationId: 'organization-id' });
    expect(prisma.membership.findUnique).toHaveBeenCalledWith({
      where: {
        userId_organizationId: {
          userId: 'user-id',
          organizationId: 'organization-id',
        },
      },
      select: { id: true },
    });
  });

  it('supports organizationId in nested organization routes', async () => {
    const currentRequest = request({ organizationId: 'organization-id' });
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-id' });

    await expect(guard.canActivate(context(currentRequest))).resolves.toBe(true);
    expect(currentRequest).toMatchObject({ organizationId: 'organization-id' });
  });

  it('rejects a user without an organization membership', async () => {
    prisma.membership.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(context(request({ id: 'organization-id' }))),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

import { ForbiddenException } from '@nestjs/common';
import { OrganizationMembershipGuard } from './organization-membership.guard';

describe('OrganizationMembershipGuard', () => {
  const prisma = { membership: { findUnique: jest.fn() } };
  const guard = new OrganizationMembershipGuard(prisma as never);
  const context = (userId = 'user-id', organizationId = 'organization-id') =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: userId }, params: { id: organizationId } }),
      }),
    }) as never;

  beforeEach(() => jest.clearAllMocks());

  it('allows a user with an organization membership', async () => {
    prisma.membership.findUnique.mockResolvedValue({ id: 'membership-id' });

    await expect(guard.canActivate(context())).resolves.toBe(true);
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

  it('rejects a user without an organization membership', async () => {
    prisma.membership.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

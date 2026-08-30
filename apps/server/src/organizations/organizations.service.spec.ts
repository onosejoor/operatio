import { NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  const prisma = {
    organization: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const service = new OrganizationsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('lists only organizations the user is a member of', async () => {
    const organizations = [{ id: 'organization-id', name: 'Acme' }];
    prisma.organization.findMany.mockResolvedValue(organizations);

    await expect(service.findAllForUser('user-id')).resolves.toEqual(organizations);
    expect(prisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { memberships: { some: { userId: 'user-id' } } },
      }),
    );
  });

  it('returns an organization by id', async () => {
    const organization = { id: 'organization-id', name: 'Acme' };
    prisma.organization.findUnique.mockResolvedValue(organization);

    await expect(service.findOne('organization-id')).resolves.toEqual(
      organization,
    );
  });

  it('throws when the organization no longer exists', async () => {
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

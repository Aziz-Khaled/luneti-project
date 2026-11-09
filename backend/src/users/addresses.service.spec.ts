import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddressesService } from './addresses.service';

describe('AddressesService', () => {
  const prisma = {
    adresse: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const service = new AddressesService(prisma as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('scopes address reads to the authenticated owner', async () => {
    prisma.adresse.findFirst.mockResolvedValue(null);

    await expect(service.find('owner-id', 'address-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.adresse.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'address-id', utilisateur_id: 'owner-id' },
      }),
    );
  });

  it('does not delete an address owned by another user', async () => {
    prisma.adresse.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      service.remove('owner-id', 'other-address-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.adresse.deleteMany).toHaveBeenCalledWith({
      where: { id: 'other-address-id', utilisateur_id: 'owner-id' },
    });
  });
});

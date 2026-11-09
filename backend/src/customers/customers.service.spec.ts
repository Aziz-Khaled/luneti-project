import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  const prisma = {
    profilClient: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const service = new CustomersService(prisma as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('updates only the authenticated user profile', async () => {
    prisma.profilClient.upsert.mockResolvedValue({ utilisateur_id: 'user-id' });

    await service.updateMe('user-id', { accepte_marketing: true });

    expect(prisma.profilClient.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { utilisateur_id: 'user-id' },
        create: expect.objectContaining({
          utilisateur: { connect: { id: 'user-id' } },
          accepte_marketing: true,
        }),
        update: { accepte_marketing: true },
      }),
    );
  });

  it('rejects empty updates', async () => {
    expect(() => service.updateMe('user-id', {})).toThrow(BadRequestException);
    expect(prisma.profilClient.upsert).not.toHaveBeenCalled();
  });
});

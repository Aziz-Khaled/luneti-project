import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrescriptionsService } from './prescriptions.service';

describe('PrescriptionsService', () => {
  it('rejects duplicate eye entries before writing prescription data', async () => {
    const prisma = {
      profilClient: {
        upsert: jest.fn().mockResolvedValue({ id: 'profile-id' }),
      },
      ordonnance: { create: jest.fn() },
    };
    const service = new PrescriptionsService(prisma as unknown as PrismaService);

    await expect(
      service.create('owner-id', {
        titre: 'Current prescription',
        yeux: [{ cote: 'GAUCHE' }, { cote: 'GAUCHE' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.ordonnance.create).not.toHaveBeenCalled();
  });
});

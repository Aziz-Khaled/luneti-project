import { ConflictException } from '@nestjs/common';
import { StatutRendezVous } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  it('rejects invalid status transitions for authorized store staff', async () => {
    const authorization = {
      requirePermission: jest.fn().mockResolvedValue({ role: undefined }),
      effectivePermissions: jest.fn().mockReturnValue(new Set<string>()),
    };
    const prisma = {
      rendezVous: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'appointment-id',
          statut: StatutRendezVous.TERMINE,
        }),
        update: jest.fn(),
      },
    };
    const service = new AppointmentsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.updateStatus(
        'staff-id',
        'store-id',
        'appointment-id',
        StatutRendezVous.CONFIRME,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.rendezVous.update).not.toHaveBeenCalled();
  });
});

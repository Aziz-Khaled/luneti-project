import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  it('does not expose payments for another user order', async () => {
    const prisma = {
      commande: { findFirst: jest.fn().mockResolvedValue(null) },
      paiement: { findMany: jest.fn() },
    };
    const service = new PaymentsService(
      prisma as unknown as PrismaService,
      {} as never,
    );

    await expect(service.listForOrder('user-id', 'order-id'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.commande.findFirst).toHaveBeenCalledWith({
      where: { id: 'order-id', utilisateur_id: 'user-id' },
      select: { id: true },
    });
    expect(prisma.paiement.findMany).not.toHaveBeenCalled();
  });
});

import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  it('records a moderation audit event in the same transaction', async () => {
    const tx = {
      avisProduit: {
        update: jest.fn().mockResolvedValue({ id: 'review-id', statut: 'PUBLIE' }),
      },
    };
    const prisma = {
      avisProduit: {
        findUnique: jest.fn().mockResolvedValue({ id: 'review-id', statut: 'PENDING' }),
      },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const audit = { record: jest.fn().mockResolvedValue({ id: 'audit-id' }) };
    const service = new AdminService(
      prisma as unknown as PrismaService,
      audit as never,
    );

    await service.moderateProductReview('admin-id', 'review-id', 'PUBLIE');

    expect(tx.avisProduit.update).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actorId: 'admin-id',
        action: 'review.moderated',
        entityType: 'product_review',
        entityId: 'review-id',
        before: { status: 'PENDING' },
        after: { status: 'PUBLIE' },
      }),
    );
  });
});

import { ConflictException, ForbiddenException } from '@nestjs/common';
import { RoleMembre, StatutCommande } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoreOrdersService } from './store-orders.service';

describe('StoreOrdersService', () => {
  it('requires membership authorization before reading store orders', async () => {
    const authorization = {
      requirePermission: jest.fn().mockRejectedValue(new ForbiddenException()),
    };
    const prisma = { commande: { findMany: jest.fn() } };
    const service = new StoreOrdersService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      {} as AuditService,
    );

    await expect(service.list('outsider-id', 'store-id', { page: 1, limit: 20 } as never, {} as never))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.commande.findMany).not.toHaveBeenCalled();
  });

  it('records an allowed order status change and its audit event atomically', async () => {
    const tx = {
      commande: {
        findFirst: jest.fn()
          .mockResolvedValueOnce({
            id: 'order-id',
            numero_commande: 'LUN-100',
            statut: StatutCommande.PAYE,
          })
          .mockResolvedValueOnce({ id: 'order-id', statut: StatutCommande.CONFIRME }),
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 'order-id',
          statut: StatutCommande.CONFIRME,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      historiqueStatutCommande: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const authorization = {
      requireActiveMembership: jest.fn().mockResolvedValue({ role: RoleMembre.GERANT }),
      requirePermission: jest.fn().mockResolvedValue({ role: RoleMembre.GERANT }),
      effectivePermissions: jest.fn().mockReturnValue(new Set<string>()),
    };
    const audit = { record: jest.fn().mockResolvedValue({}) };
    const service = new StoreOrdersService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as unknown as AuditService,
    );

    await service.updateStatus('manager-id', 'store-id', 'order-id', {
      status: StatutCommande.CONFIRME,
      note: 'Verified for fulfillment',
    });

    expect(tx.commande.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ statut: StatutCommande.PAYE }),
        data: expect.objectContaining({ statut: StatutCommande.CONFIRME }),
      }),
    );
    expect(tx.historiqueStatutCommande.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'order.status_changed',
        before: { status: StatutCommande.PAYE },
        after: { status: StatutCommande.CONFIRME },
        reason: 'Verified for fulfillment',
      }),
    );
  });

  it('rejects invalid order transitions before updating the database', async () => {
    const tx = {
      commande: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'order-id',
          numero_commande: 'LUN-100',
          statut: StatutCommande.PAYE,
        }),
        updateMany: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const authorization = {
      requireActiveMembership: jest.fn().mockResolvedValue({ role: RoleMembre.GERANT }),
      requirePermission: jest.fn().mockResolvedValue({ role: RoleMembre.GERANT }),
      effectivePermissions: jest.fn().mockReturnValue(new Set<string>()),
    };
    const service = new StoreOrdersService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      { record: jest.fn() } as never,
    );

    await expect(
      service.updateStatus('manager-id', 'store-id', 'order-id', {
        status: StatutCommande.TERMINE,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.commande.updateMany).not.toHaveBeenCalled();
  });
});

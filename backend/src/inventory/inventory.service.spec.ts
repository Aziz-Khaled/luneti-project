import { ConflictException } from '@nestjs/common';
import { RoleMembre, TypeMouvementStock } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  const authorization = {
    requireMembership: jest.fn().mockResolvedValue({ role: RoleMembre.GERANT }),
  };

  beforeEach(() => jest.clearAllMocks());

  it('reserves stock and records the movement in one transaction', async () => {
    const tx = {
      stock: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'stock-id',
          quantite_disponible: 10,
          quantite_reservee: 2,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      mouvementStock: {
        create: jest.fn().mockResolvedValue({ id: 'movement-id' }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await service.createMovement('user-id', 'store-id', 'stock-id', {
      type: TypeMouvementStock.RESERVE,
      quantite: 3,
    });

    expect(tx.stock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          quantite_reservee: { lte: 7 },
        }),
        data: { quantite_reservee: { increment: 3 } },
      }),
    );
    expect(tx.mouvementStock.create).toHaveBeenCalled();
  });

  it('rejects a sale that would consume reserved stock', async () => {
    const tx = {
      stock: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'stock-id',
          quantite_disponible: 10,
          quantite_reservee: 8,
        }),
        updateMany: jest.fn(),
      },
      mouvementStock: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.createMovement('user-id', 'store-id', 'stock-id', {
        type: TypeMouvementStock.VENTE,
        quantite: 3,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.stock.updateMany).not.toHaveBeenCalled();
    expect(tx.mouvementStock.create).not.toHaveBeenCalled();
  });
});

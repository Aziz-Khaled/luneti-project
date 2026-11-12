import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  ConceptionVerreStock,
  PublicCible,
  RoleMembre,
  TraitementVerreStock,
  TypeArticleStock,
  TypeMouvementStock,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  const authorization = {
    requirePermission: jest.fn().mockResolvedValue({ role: RoleMembre.GERANT }),
  };
  const audit = { record: jest.fn().mockResolvedValue({}) };

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
      audit as never,
    );

    await service.createMovement('user-id', 'store-id', 'stock-id', {
      type: TypeMouvementStock.RESERVE,
      quantite: 3,
    });

    expect(tx.stock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          quantite_disponible: 10,
          quantite_reservee: 2,
        }),
        data: { quantite_reservee: { increment: 3 } },
      }),
    );
    expect(tx.mouvementStock.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'inventory.reserve',
        before: { quantityOnHand: 10, quantityReserved: 2 },
        after: { quantityOnHand: 10, quantityReserved: 5 },
      }),
    );
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
      audit as never,
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

  it('creates a standalone prescription-glasses stock item', async () => {
    const stock = { id: 'stock-id', quantite_disponible: 0 };
    const tx = {
      stock: { create: jest.fn().mockResolvedValue(stock) },
      mouvementStock: { create: jest.fn() },
    };
    const prisma = {
      emplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue({ id: 'location-id' }),
      },
      varianteAnnonceMagasin: { findFirst: jest.fn() },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.create('owner-id', 'store-id', {
        emplacement_id: 'location-id',
        type_article: TypeArticleStock.VERRE_VUE,
        conception_verre: ConceptionVerreStock.SIMPLE,
        traitement_verre: TraitementVerreStock.BLEU,
        puissance_droite: -2,
        puissance_gauche: -1.5,
      }),
    ).resolves.toEqual(stock);

    expect(prisma.varianteAnnonceMagasin.findFirst).not.toHaveBeenCalled();
    expect(tx.stock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type_article: TypeArticleStock.VERRE_VUE,
          conception_verre: ConceptionVerreStock.SIMPLE,
          traitement_verre: TraitementVerreStock.BLEU,
          puissance_droite: -2,
          puissance_gauche: -1.5,
          emplacement_id: 'location-id',
        }),
      }),
    );
  });

  it('requires both eye powers for optical glass stock', async () => {
    const prisma = {
      emplacementMagasin: { findFirst: jest.fn() },
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.create('owner-id', 'store-id', {
        emplacement_id: 'location-id',
        type_article: TypeArticleStock.VERRE_SOLEIL,
        conception_verre: ConceptionVerreStock.PROGRESSIF,
        traitement_verre: TraitementVerreStock.PHOTO,
        puissance_droite: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.emplacementMagasin.findFirst).not.toHaveBeenCalled();
  });

  it('requires frame reference, audience, and size', async () => {
    const prisma = {
      emplacementMagasin: { findFirst: jest.fn() },
    };
    const service = new InventoryService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
    );

    await expect(
      service.create('owner-id', 'store-id', {
        emplacement_id: 'location-id',
        type_article: TypeArticleStock.MONTURE,
        marque_reference: 'Monture test',
        public_cible: PublicCible.ENFANT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.emplacementMagasin.findFirst).not.toHaveBeenCalled();
  });
});

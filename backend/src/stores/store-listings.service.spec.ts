import { StatutAnnonce, StatutProduit } from '@prisma/client';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoreListingsService } from './store-listings.service';

describe('StoreListingsService', () => {
  it('does not expose listings for archived products or inactive variants', async () => {
    const prisma = {
      magasin: { findFirst: jest.fn().mockResolvedValue({ id: 'store-id' }) },
      annonceMagasin: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };
    const service = new StoreListingsService(
      prisma as unknown as PrismaService,
      {} as StoreAuthorizationService,
      { record: jest.fn() } as never,
    );

    await service.listPublic('store-id', {
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(prisma.annonceMagasin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          statut: StatutAnnonce.ACTIVE,
          produit: {
            is: { statut: StatutProduit.ACTIVE, supprime_le: null },
          },
        }),
        select: expect.objectContaining({
          variantes: expect.objectContaining({
            where: {
              est_disponible: true,
              variante: { is: { est_actif: true } },
            },
          }),
        }),
      }),
    );
  });
});

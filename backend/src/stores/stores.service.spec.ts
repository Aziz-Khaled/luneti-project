import { RoleMembre, StatutAdhesion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { StoresService } from './stores.service';

describe('StoresService', () => {
  it('creates the store and owner membership atomically', async () => {
    const store = { id: 'store-id', nom: 'Optique', slug: 'optique' };
    const tx = {
      magasin: { create: jest.fn().mockResolvedValue(store) },
      membreMagasin: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const authorization = {} as StoreAuthorizationService;
    const service = new StoresService(
      prisma as unknown as PrismaService,
      authorization,
    );

    await expect(
      service.create('owner-id', {
        nom: 'Optique',
        slug: 'optique',
      }),
    ).resolves.toEqual(store);

    expect(tx.membreMagasin.create).toHaveBeenCalledWith({
      data: {
        magasin_id: 'store-id',
        utilisateur_id: 'owner-id',
        role: RoleMembre.PROPRIETAIRE,
        statut: StatutAdhesion.ACTIVE,
        rejoint_le: expect.any(Date),
      },
    });
  });
});

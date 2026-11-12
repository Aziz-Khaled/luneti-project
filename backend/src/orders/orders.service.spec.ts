import { BadRequestException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  it('rejects a cart containing listings from multiple stores', async () => {
    const listing = (storeId: string) => ({
      id: `listing-${storeId}`,
      prix: { toString: () => '10.00', mul: jest.fn(), },
      devise: 'TND',
      est_disponible: true,
      reference_magasin: null,
      annonce: {
        magasin_id: storeId,
        statut: 'ACTIVE',
        supprime_le: null,
        magasin: { nom: 'Store', statut: 'ACTIVE', supprime_le: null },
        produit: { nom: 'Product', statut: 'ACTIVE', supprime_le: null },
      },
      variante: {
        id: 'variant-id',
        variantName: 'Standard',
        couleur: null,
        taille: null,
        reference_globale: null,
        est_actif: true,
      },
    });
    const prisma = {
      panier: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'cart-id',
          articles: [
            { quantite: 1, variante_annonce: listing('store-one') },
            { quantite: 1, variante_annonce: listing('store-two') },
          ],
        }),
      },
    };
    const service = new OrdersService(
      prisma as unknown as PrismaService,
      {} as AuditService,
    );

    await expect(service.createOrder('owner-id', {}))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.panier.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ utilisateur_id: 'owner-id' }),
      }),
    );
  });
});

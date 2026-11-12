import { PrismaService } from '../prisma/prisma.service';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  it('derives verified-purchase status from a completed order', async () => {
    const prisma = {
      produit: {
        findFirst: jest.fn().mockResolvedValue({ id: 'product-id' }),
      },
      articleCommande: {
        findFirst: jest.fn().mockResolvedValue({ id: 'order-item-id' }),
      },
      avisProduit: {
        create: jest.fn().mockResolvedValue({ id: 'review-id', achat_verifie: true }),
      },
    };
    const service = new ReviewsService(prisma as unknown as PrismaService);

    await service.createProduct('user-id', 'product-id', {
      note: 5,
      titre: 'Excellent',
    });

    expect(prisma.avisProduit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          utilisateur_id: 'user-id',
          produit_id: 'product-id',
          achat_verifie: true,
        }),
      }),
    );
  });

  it('does not trust client input to claim a verified purchase', async () => {
    const prisma = {
      produit: {
        findFirst: jest.fn().mockResolvedValue({ id: 'product-id' }),
      },
      articleCommande: { findFirst: jest.fn().mockResolvedValue(null) },
      avisProduit: {
        create: jest.fn().mockResolvedValue({ id: 'review-id', achat_verifie: false }),
      },
    };
    const service = new ReviewsService(prisma as unknown as PrismaService);

    await service.createProduct('user-id', 'product-id', {
      note: 5,
      titre: 'Good',
    });

    expect(prisma.avisProduit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ achat_verifie: false }),
      }),
    );
  });
});

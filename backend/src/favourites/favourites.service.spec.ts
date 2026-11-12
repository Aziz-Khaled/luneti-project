import { PrismaService } from '../prisma/prisma.service';
import { FavouritesService } from './favourites.service';

describe('FavouritesService', () => {
  it('scopes favorite removal to the authenticated user', async () => {
    const prisma = {
      produitFavori: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const service = new FavouritesService(prisma as unknown as PrismaService);

    await service.removeProduct('owner-id', 'product-id');

    expect(prisma.produitFavori.deleteMany).toHaveBeenCalledWith({
      where: { utilisateur_id: 'owner-id', produit_id: 'product-id' },
    });
  });
});

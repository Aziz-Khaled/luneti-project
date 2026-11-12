import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatutMagasin, StatutProduit } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';

@Injectable()
export class FavouritesService {
  constructor(private readonly prisma: PrismaService) {}

  async products(userId: string, pagination: PaginationDto) {
    const where = {
      utilisateur_id: userId,
      produit: { statut: StatutProduit.ACTIVE, supprime_le: null },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.produitFavori.findMany({
        where,
        select: {
          id: true,
          cree_le: true,
          produit: {
            select: { id: true, nom: true, slug: true, marque: true, type: true },
          },
        },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.produitFavori.count({ where }),
    ]);
    return paginated(items, total, pagination.page, pagination.limit);
  }

  async addProduct(userId: string, productId: string) {
    const product = await this.prisma.produit.findFirst({
      where: { id: productId, statut: StatutProduit.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Active product not found');
    try {
      return await this.prisma.produitFavori.create({
        data: { utilisateur_id: userId, produit_id: productId },
        select: { id: true, produit_id: true, cree_le: true },
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Product is already in favorites');
      }
      throw error;
    }
  }

  async removeProduct(userId: string, productId: string) {
    const result = await this.prisma.produitFavori.deleteMany({
      where: { utilisateur_id: userId, produit_id: productId },
    });
    if (!result.count) throw new NotFoundException('Favorite product not found');
    return { success: true };
  }

  async stores(userId: string, pagination: PaginationDto) {
    const where = {
      utilisateur_id: userId,
      magasin: { statut: StatutMagasin.ACTIVE, supprime_le: null },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.magasinFavori.findMany({
        where,
        select: {
          id: true,
          cree_le: true,
          magasin: {
            select: { id: true, nom: true, slug: true, url_logo: true, telephone: true },
          },
        },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.magasinFavori.count({ where }),
    ]);
    return paginated(items, total, pagination.page, pagination.limit);
  }

  async addStore(userId: string, storeId: string) {
    const store = await this.prisma.magasin.findFirst({
      where: { id: storeId, statut: StatutMagasin.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Active store not found');
    try {
      return await this.prisma.magasinFavori.create({
        data: { utilisateur_id: userId, magasin_id: storeId },
        select: { id: true, magasin_id: true, cree_le: true },
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Store is already in favorites');
      }
      throw error;
    }
  }

  async removeStore(userId: string, storeId: string) {
    const result = await this.prisma.magasinFavori.deleteMany({
      where: { utilisateur_id: userId, magasin_id: storeId },
    });
    if (!result.count) throw new NotFoundException('Favorite store not found');
    return { success: true };
  }
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

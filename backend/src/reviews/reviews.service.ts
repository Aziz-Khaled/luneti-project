import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatutAvis, StatutCommande, StatutMagasin, StatutProduit } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

const reviewSelect = {
  id: true,
  note: true,
  titre: true,
  contenu: true,
  statut: true,
  achat_verifie: true,
  cree_le: true,
  utilisateur: {
    select: { id: true, prenom: true, nom: true, nom_utilisateur: true },
  },
} satisfies Prisma.AvisProduitSelect;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProduct(productId: string, pagination: PaginationDto) {
    const product = await this.prisma.produit.findFirst({
      where: { id: productId, statut: StatutProduit.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Active product not found');
    const where = {
      produit_id: productId,
      statut: StatutAvis.PUBLIE,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.avisProduit.findMany({
        where,
        select: reviewSelect,
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.avisProduit.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async listStore(storeId: string, pagination: PaginationDto) {
    const store = await this.prisma.magasin.findFirst({
      where: { id: storeId, statut: StatutMagasin.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Active store not found');
    const where = { magasin_id: storeId, statut: StatutAvis.PUBLIE };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.avisMagasin.findMany({
        where,
        select: {
          id: true,
          note: true,
          titre: true,
          contenu: true,
          statut: true,
          cree_le: true,
          utilisateur: {
            select: { id: true, prenom: true, nom: true, nom_utilisateur: true },
          },
        },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.avisMagasin.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async createProduct(userId: string, productId: string, input: CreateReviewDto) {
    const product = await this.prisma.produit.findFirst({
      where: { id: productId, statut: StatutProduit.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Active product not found');
    const completedPurchase = await this.prisma.articleCommande.findFirst({
      where: {
        order: { utilisateur_id: userId, statut: StatutCommande.TERMINE },
        variante_annonce: { annonce: { produit_id: productId } },
      },
      select: { id: true },
    });
    return this.prisma.avisProduit.create({
      data: {
        produit_id: productId,
        utilisateur_id: userId,
        note: input.note,
        titre: input.titre,
        contenu: input.contenu,
        achat_verifie: Boolean(completedPurchase),
      },
      select: reviewSelect,
    });
  }

  async createStore(userId: string, storeId: string, input: CreateReviewDto) {
    const store = await this.prisma.magasin.findFirst({
      where: { id: storeId, statut: StatutMagasin.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Active store not found');
    if (input.commande_id) {
      const completedOrder = await this.prisma.commande.findFirst({
        where: {
          id: input.commande_id,
          utilisateur_id: userId,
          magasin_id: storeId,
          statut: StatutCommande.TERMINE,
        },
        select: { id: true },
      });
      if (!completedOrder) {
        throw new NotFoundException('Completed order for this store was not found');
      }
    }
    try {
      return await this.prisma.avisMagasin.create({
        data: {
          magasin_id: storeId,
          utilisateur_id: userId,
          commande_id: input.commande_id,
          note: input.note,
          titre: input.titre,
          contenu: input.contenu,
        },
        select: {
          id: true,
          note: true,
          titre: true,
          contenu: true,
          statut: true,
          cree_le: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This order already has a store review');
      }
      throw error;
    }
  }

  async update(userId: string, reviewId: string, input: UpdateReviewDto) {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one review field is required');
    }
    const productReview = await this.prisma.avisProduit.findFirst({
      where: { id: reviewId, utilisateur_id: userId },
      select: { id: true },
    });
    if (productReview) {
      await this.prisma.avisProduit.update({
        where: { id: reviewId },
        data: {
          ...(input.note !== undefined ? { note: input.note } : {}),
          ...(input.titre !== undefined ? { titre: input.titre } : {}),
          ...(input.contenu !== undefined ? { contenu: input.contenu } : {}),
          statut: StatutAvis.PENDING,
        },
      });
      return this.prisma.avisProduit.findUniqueOrThrow({
        where: { id: reviewId },
        select: reviewSelect,
      });
    }
    const storeReview = await this.prisma.avisMagasin.findFirst({
      where: { id: reviewId, utilisateur_id: userId },
      select: { id: true },
    });
    if (!storeReview) throw new NotFoundException('Review not found');
    return this.prisma.avisMagasin.update({
      where: { id: reviewId },
      data: {
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.titre !== undefined ? { titre: input.titre } : {}),
        ...(input.contenu !== undefined ? { contenu: input.contenu } : {}),
        statut: StatutAvis.PENDING,
      },
      select: {
        id: true,
        note: true,
        titre: true,
        contenu: true,
        statut: true,
        cree_le: true,
      },
    });
  }

  async remove(userId: string, reviewId: string) {
    const product = await this.prisma.avisProduit.deleteMany({
      where: { id: reviewId, utilisateur_id: userId },
    });
    if (product.count) return { success: true };
    const store = await this.prisma.avisMagasin.deleteMany({
      where: { id: reviewId, utilisateur_id: userId },
    });
    if (!store.count) throw new NotFoundException('Review not found');
    return { success: true };
  }
}

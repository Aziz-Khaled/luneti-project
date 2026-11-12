import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatutAnnonce, StatutMagasin, StatutProduit } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateStoreListingDto } from './dto/create-store-listing.dto';
import { UpdateStoreListingDto } from './dto/update-store-listing.dto';
import { CreateListingVariantDto } from './dto/create-listing-variant.dto';
import { UpdateListingVariantDto } from './dto/update-listing-variant.dto';

const listingSelect = {
  id: true,
  magasin_id: true,
  produit_id: true,
  titre_personnalise: true,
  description_personnalisee: true,
  statut: true,
  publie_le: true,
  cree_le: true,
  produit: { select: { id: true, nom: true, slug: true, type: true } },
  variantes: {
    where: {
      est_disponible: true,
      variante: { is: { est_actif: true } },
    },
    select: {
      id: true,
      variante_id: true,
      prix: true,
      prix_compare: true,
      devise: true,
      est_disponible: true,
      variante: {
        select: {
          id: true,
          variantName: true,
          couleur: true,
          taille: true,
          url_image: true,
        },
      },
    },
  },
} satisfies Prisma.AnnonceMagasinSelect;

@Injectable()
export class StoreListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
    private readonly audit: AuditService,
  ) {}

  async listPublic(storeId: string, pagination: PaginationDto) {
    await this.requireActiveStore(storeId);
    const where: Prisma.AnnonceMagasinWhereInput = {
      magasin_id: storeId,
      statut: StatutAnnonce.ACTIVE,
      supprime_le: null,
      produit: {
        is: { statut: StatutProduit.ACTIVE, supprime_le: null },
      },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.annonceMagasin.findMany({
        where,
        select: listingSelect,
        orderBy: { publie_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.annonceMagasin.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async findPublic(storeId: string, listingId: string) {
    await this.requireActiveStore(storeId);
    const listing = await this.prisma.annonceMagasin.findFirst({
      where: {
        id: listingId,
        magasin_id: storeId,
        statut: StatutAnnonce.ACTIVE,
        supprime_le: null,
        produit: {
          is: { statut: StatutProduit.ACTIVE, supprime_le: null },
        },
      },
      select: listingSelect,
    });
    if (!listing) throw new NotFoundException('Store listing not found');
    return listing;
  }

  async create(userId: string, storeId: string, input: CreateStoreListingDto) {
    await this.authorize(userId, storeId);
    const product = await this.prisma.produit.findFirst({
      where: { id: input.produit_id, statut: StatutProduit.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Active product not found');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const listing = await tx.annonceMagasin.create({
          data: {
            magasin_id: storeId,
            produit_id: input.produit_id,
            cree_par_id: userId,
            titre_personnalise: input.titre_personnalise,
            description_personnalisee: input.description_personnalisee,
            statut: input.statut ?? StatutAnnonce.BROUILLON,
            publie_le:
              input.statut === StatutAnnonce.ACTIVE ? new Date() : undefined,
          },
          select: listingSelect,
        });
        await this.audit.record(tx, {
          storeId,
          actorId: userId,
          action: input.statut === StatutAnnonce.ACTIVE ? 'listing.published' : 'listing.created',
          entityType: 'store_listing',
          entityId: listing.id,
          description: input.statut === StatutAnnonce.ACTIVE ? 'Store product published' : 'Store product listing created',
          after: {
            productId: listing.produit_id,
            status: listing.statut,
            title: listing.titre_personnalise,
          },
        });
        return listing;
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('This product is already listed by the store');
      }
      throw error;
    }
  }

  async update(
    userId: string,
    storeId: string,
    listingId: string,
    input: UpdateStoreListingDto,
  ) {
    await this.authorize(userId, storeId);
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one listing field is required');
    }
    const data: Prisma.AnnonceMagasinUpdateManyMutationInput = {
      ...(input.titre_personnalise !== undefined
        ? { titre_personnalise: input.titre_personnalise }
        : {}),
      ...(input.description_personnalisee !== undefined
        ? { description_personnalisee: input.description_personnalisee }
        : {}),
      ...(input.statut !== undefined
        ? {
            statut: input.statut,
            ...(input.statut === StatutAnnonce.ACTIVE
              ? { publie_le: new Date() }
              : {}),
          }
        : {}),
    };
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.annonceMagasin.findFirst({
        where: { id: listingId, magasin_id: storeId, supprime_le: null },
        select: { id: true, titre_personnalise: true, description_personnalisee: true, statut: true },
      });
      if (!before) throw new NotFoundException('Store listing not found');
      const updated = await tx.annonceMagasin.updateMany({
        where: { id: listingId, magasin_id: storeId, supprime_le: null },
        data,
      });
      if (!updated.count) throw new NotFoundException('Store listing not found');
      const listing = await tx.annonceMagasin.findUniqueOrThrow({
        where: { id: listingId },
        select: listingSelect,
      });
      await this.audit.record(tx, {
        storeId,
        actorId: userId,
        action: input.statut === StatutAnnonce.ACTIVE ? 'listing.published' : 'listing.updated',
        entityType: 'store_listing',
        entityId: listingId,
        description: input.statut === StatutAnnonce.ACTIVE ? 'Store product published' : 'Store product listing updated',
        before: {
          title: before.titre_personnalise,
          description: before.description_personnalisee,
          status: before.statut,
        },
        after: {
          title: listing.titre_personnalise,
          description: listing.description_personnalisee,
          status: listing.statut,
        },
      });
      return listing;
    });
  }

  async addVariant(
    userId: string,
    storeId: string,
    listingId: string,
    input: CreateListingVariantDto,
  ) {
    await this.authorize(userId, storeId);
    const listing = await this.prisma.annonceMagasin.findFirst({
      where: { id: listingId, magasin_id: storeId, supprime_le: null },
      select: { id: true, produit_id: true },
    });
    if (!listing) throw new NotFoundException('Store listing not found');
    const variant = await this.prisma.varianteProduit.findFirst({
      where: { id: input.variante_id, produit_id: listing.produit_id, est_actif: true },
      select: { id: true },
    });
    if (!variant) throw new BadRequestException('Variant does not belong to this listing product');
    if (input.prix_compare !== undefined && input.prix_compare < input.prix) {
      throw new BadRequestException('Compare-at price must be greater than or equal to price');
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.varianteAnnonceMagasin.create({
          data: {
            annonce_id: listingId,
            variante_id: input.variante_id,
            prix: new Prisma.Decimal(input.prix),
            prix_compare:
              input.prix_compare !== undefined
                ? new Prisma.Decimal(input.prix_compare)
                : undefined,
            devise: input.devise ?? 'TND',
            reference_magasin: input.reference_magasin,
            code_barres_magasin: input.code_barres_magasin,
            est_disponible: input.est_disponible ?? true,
          },
          select: {
            id: true,
            variante_id: true,
            prix: true,
            prix_compare: true,
            devise: true,
            est_disponible: true,
          },
        });
        await this.audit.record(tx, {
          storeId,
          actorId: userId,
          action: 'listing.variant_created',
          entityType: 'store_listing_variant',
          entityId: created.id,
          description: 'Store listing price and variant created',
          after: {
            price: created.prix.toString(),
            currency: created.devise,
            available: created.est_disponible,
          },
        });
        return created;
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Variant or store SKU is already listed');
      }
      throw error;
    }
  }

  async updateVariant(
    userId: string,
    storeId: string,
    listingId: string,
    listingVariantId: string,
    input: UpdateListingVariantDto,
  ) {
    await this.authorize(userId, storeId);
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one listing-variant field is required');
    }
    const existing = await this.prisma.varianteAnnonceMagasin.findFirst({
      where: {
        id: listingVariantId,
        annonce_id: listingId,
        annonce: { magasin_id: storeId, supprime_le: null },
      },
      select: { id: true, prix: true, devise: true, est_disponible: true },
    });
    if (!existing) throw new NotFoundException('Listing variant not found');
    const price = input.prix ?? Number(existing.prix);
    const comparePrice =
      input.prix_compare === undefined ? undefined : input.prix_compare;
    if (comparePrice !== undefined && comparePrice < price) {
      throw new BadRequestException('Compare-at price must be greater than or equal to price');
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.varianteAnnonceMagasin.update({
          where: { id: listingVariantId },
          data: {
          ...(input.prix !== undefined
            ? { prix: new Prisma.Decimal(input.prix) }
            : {}),
          ...(input.prix_compare !== undefined
            ? { prix_compare: new Prisma.Decimal(input.prix_compare) }
            : {}),
          ...(input.devise !== undefined ? { devise: input.devise } : {}),
          ...(input.reference_magasin !== undefined
            ? { reference_magasin: input.reference_magasin }
            : {}),
          ...(input.code_barres_magasin !== undefined
            ? { code_barres_magasin: input.code_barres_magasin }
            : {}),
          ...(input.est_disponible !== undefined
            ? { est_disponible: input.est_disponible }
            : {}),
          },
          select: {
            id: true,
            variante_id: true,
            prix: true,
            prix_compare: true,
            devise: true,
            est_disponible: true,
          },
        });
        await this.audit.record(tx, {
          storeId,
          actorId: userId,
          action: input.prix !== undefined ? 'listing.price_changed' : 'listing.variant_updated',
          entityType: 'store_listing_variant',
          entityId: listingVariantId,
          description: input.prix !== undefined ? 'Store product price changed' : 'Store listing variant updated',
          before: {
            price: existing.prix.toString(),
            currency: existing.devise,
            available: existing.est_disponible,
          },
          after: {
            price: updated.prix.toString(),
            currency: updated.devise,
            available: updated.est_disponible,
          },
        });
        return updated;
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Variant or store SKU is already listed');
      }
      throw error;
    }
  }

  private async requireActiveStore(storeId: string) {
    const store = await this.prisma.magasin.findFirst({
      where: { id: storeId, statut: StatutMagasin.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Active store not found');
  }

  private authorize(userId: string, storeId: string) {
    return this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'shop.manage_products',
    );
  }
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

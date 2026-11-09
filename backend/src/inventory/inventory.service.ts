import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RoleMembre,
  TypeMouvementStock,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

const stockSelect = {
  id: true,
  storeListingVariantId: true,
  emplacement_id: true,
  quantite_disponible: true,
  quantite_reservee: true,
  seuil_reapprovisionnement: true,
  modifie_le: true,
} satisfies Prisma.StockSelect;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
  ) {}

  async list(
    userId: string,
    storeId: string,
    pagination: PaginationDto,
  ) {
    await this.authorize(userId, storeId);
    const where: Prisma.StockWhereInput = {
      location: { magasin_id: storeId },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.stock.findMany({
        where,
        select: {
          ...stockSelect,
          variante_annonce: {
            select: {
              id: true,
              prix: true,
              annonce: {
                select: { id: true, produit: { select: { id: true, nom: true } } },
              },
              variante: { select: { id: true, variantName: true, code_barres: true } },
            },
          },
          location: { select: { id: true, nom: true, type: true } },
        },
        orderBy: { modifie_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.stock.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async create(userId: string, storeId: string, input: CreateStockDto) {
    await this.authorize(userId, storeId);
    const [listingVariant, location] = await this.prisma.$transaction([
      this.prisma.varianteAnnonceMagasin.findFirst({
        where: {
          id: input.storeListingVariantId,
          annonce: { magasin_id: storeId, supprime_le: null },
        },
        select: { id: true },
      }),
      this.prisma.emplacementMagasin.findFirst({
        where: { id: input.emplacement_id, magasin_id: storeId, est_actif: true },
        select: { id: true },
      }),
    ]);
    if (!listingVariant || !location) {
      throw new BadRequestException(
        'Listing variant and active location must belong to this store',
      );
    }

    try {
      return await this.prisma.stock.create({
        data: {
          storeListingVariantId: input.storeListingVariantId,
          emplacement_id: input.emplacement_id,
          quantite_disponible: input.quantite_disponible,
          seuil_reapprovisionnement: input.seuil_reapprovisionnement,
        },
        select: stockSelect,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Stock already exists for this variant and location');
      }
      throw error;
    }
  }

  async find(userId: string, storeId: string, stockId: string) {
    await this.authorize(userId, storeId);
    const stock = await this.prisma.stock.findFirst({
      where: { id: stockId, location: { magasin_id: storeId } },
      select: {
        ...stockSelect,
        variante_annonce: {
          select: {
            id: true,
            prix: true,
            annonce: {
              select: { id: true, produit: { select: { id: true, nom: true } } },
            },
            variante: { select: { id: true, variantName: true, code_barres: true } },
          },
        },
        location: { select: { id: true, nom: true, type: true } },
      },
    });
    if (!stock) {
      throw new NotFoundException('Inventory record not found');
    }
    return stock;
  }

  async update(
    userId: string,
    storeId: string,
    stockId: string,
    input: UpdateStockDto,
  ) {
    await this.authorize(userId, storeId);
    const result = await this.prisma.stock.updateMany({
      where: { id: stockId, location: { magasin_id: storeId } },
      data: { seuil_reapprovisionnement: input.seuil_reapprovisionnement },
    });
    if (result.count === 0) {
      throw new NotFoundException('Inventory record not found');
    }
    return this.find(userId, storeId, stockId);
  }

  async movements(
    userId: string,
    storeId: string,
    stockId: string,
    pagination: PaginationDto,
  ) {
    await this.authorize(userId, storeId);
    const stock = await this.prisma.stock.findFirst({
      where: { id: stockId, location: { magasin_id: storeId } },
      select: { id: true },
    });
    if (!stock) {
      throw new NotFoundException('Inventory record not found');
    }
    const where = { stock_id: stockId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.mouvementStock.findMany({
        where,
        select: {
          id: true,
          type: true,
          quantite: true,
          reference: true,
          note: true,
          cree_le: true,
          acteur_id: true,
        },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.mouvementStock.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async createMovement(
    userId: string,
    storeId: string,
    stockId: string,
    input: CreateStockMovementDto,
  ) {
    await this.authorize(userId, storeId);
    if (
      input.type === TypeMouvementStock.TRANSFERT_ENTRANT ||
      input.type === TypeMouvementStock.TRANSFERT_SORTANT
    ) {
      if (!input.destination_stock_id || input.destination_stock_id === stockId) {
        throw new BadRequestException('Transfers require a different destination stock');
      }
      if (input.type !== TypeMouvementStock.TRANSFERT_SORTANT) {
        throw new BadRequestException(
          'Use TRANSFERT_SORTANT to create a paired transfer',
        );
      }
      if (input.quantite < 1) {
        throw new BadRequestException('Transfer quantity must be positive');
      }
      return this.transfer(
        userId,
        storeId,
        stockId,
        input.destination_stock_id,
        input,
      );
    }
    if (
      input.type !== TypeMouvementStock.AJUSTEMENT &&
      input.quantite < 1
    ) {
      throw new BadRequestException('Movement quantity must be positive');
    }
    if (
      input.type === TypeMouvementStock.AJUSTEMENT &&
      !input.note?.trim()
    ) {
      throw new BadRequestException('Inventory adjustments require a reason');
    }
    if (
      ![
        TypeMouvementStock.RECEPTION,
        TypeMouvementStock.VENTE,
        TypeMouvementStock.RETOUR,
        TypeMouvementStock.AJUSTEMENT,
        TypeMouvementStock.ENDOMMAGE,
        TypeMouvementStock.RESERVE,
        TypeMouvementStock.LIBERE,
      ].includes(input.type)
    ) {
      throw new BadRequestException('Unsupported stock movement type');
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.stock.findFirst({
        where: { id: stockId, location: { magasin_id: storeId } },
        select: { id: true, quantite_disponible: true, quantite_reservee: true },
      });
      if (!current) {
        throw new NotFoundException('Inventory record not found');
      }

      const available = current.quantite_disponible - current.quantite_reservee;
      const delta = movementDelta(input.type, input.quantite);
      if (
        delta < 0 &&
        available < Math.abs(delta)
      ) {
        throw new ConflictException('Insufficient unreserved inventory');
      }
      if (
        input.type === TypeMouvementStock.RESERVE &&
        available < input.quantite
      ) {
        throw new ConflictException('Insufficient available inventory to reserve');
      }
      if (
        input.type === TypeMouvementStock.LIBERE &&
        current.quantite_reservee < input.quantite
      ) {
        throw new ConflictException('Cannot release more than the reserved quantity');
      }

      const updateCount = await tx.stock.updateMany({
        where: {
          id: stockId,
          location: { magasin_id: storeId },
          ...(delta < 0
            ? {
                quantite_disponible: { gte: Math.abs(delta) },
                quantite_reservee: {
                  lte: current.quantite_disponible - Math.abs(delta),
                },
              }
            : {}),
          ...(input.type === TypeMouvementStock.RESERVE
            ? {
                quantite_reservee: {
                  lte: current.quantite_disponible - input.quantite,
                },
              }
            : {}),
          ...(input.type === TypeMouvementStock.LIBERE
            ? { quantite_reservee: { gte: input.quantite } }
            : {}),
        },
        data: {
          ...(delta !== 0
            ? { quantite_disponible: { increment: delta } }
            : {}),
          ...(input.type === TypeMouvementStock.RESERVE
            ? { quantite_reservee: { increment: input.quantite } }
            : {}),
          ...(input.type === TypeMouvementStock.LIBERE
            ? { quantite_reservee: { decrement: input.quantite } }
            : {}),
        },
      });
      if (updateCount.count !== 1) {
        throw new ConflictException('Inventory changed concurrently; retry the operation');
      }

      const movement = await tx.mouvementStock.create({
        data: {
          stock_id: stockId,
          acteur_id: userId,
          type: input.type,
          quantite: input.quantite,
          reference: input.reference,
          note: input.note,
        },
        select: {
          id: true,
          type: true,
          quantite: true,
          reference: true,
          note: true,
          cree_le: true,
        },
      });
      return movement;
    });
  }

  private async transfer(
    userId: string,
    storeId: string,
    sourceStockId: string,
    destinationStockId: string,
    input: CreateStockMovementDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const [source, destination] = await Promise.all([
        tx.stock.findFirst({
          where: {
            id: sourceStockId,
            location: { magasin_id: storeId },
          },
          select: { id: true, quantite_disponible: true, quantite_reservee: true },
        }),
        tx.stock.findFirst({
          where: {
            id: destinationStockId,
            location: { magasin_id: storeId },
          },
          select: { id: true },
        }),
      ]);
      if (!source || !destination) {
        throw new NotFoundException('Source or destination inventory was not found');
      }
      const sourceUpdate = await tx.stock.updateMany({
        where: {
          id: sourceStockId,
          quantite_disponible: { gte: input.quantite },
          quantite_reservee: {
            lte: source.quantite_disponible - input.quantite,
          },
          location: { magasin_id: storeId },
        },
        data: { quantite_disponible: { decrement: input.quantite } },
      });
      if (sourceUpdate.count !== 1) {
        throw new ConflictException('Insufficient unreserved inventory to transfer');
      }
      const destinationUpdate = await tx.stock.updateMany({
        where: {
          id: destinationStockId,
          location: { magasin_id: storeId },
        },
        data: { quantite_disponible: { increment: input.quantite } },
      });
      if (destinationUpdate.count !== 1) {
        throw new ConflictException('Destination inventory changed; retry the transfer');
      }

      const [outbound, inbound] = await Promise.all([
        tx.mouvementStock.create({
          data: {
            stock_id: sourceStockId,
            acteur_id: userId,
            type: TypeMouvementStock.TRANSFERT_SORTANT,
            quantite: input.quantite,
            reference: input.reference,
            note: input.note,
          },
          select: { id: true, stock_id: true, type: true, quantite: true, cree_le: true },
        }),
        tx.mouvementStock.create({
          data: {
            stock_id: destinationStockId,
            acteur_id: userId,
            type: TypeMouvementStock.TRANSFERT_ENTRANT,
            quantite: input.quantite,
            reference: input.reference,
            note: input.note,
          },
          select: { id: true, stock_id: true, type: true, quantite: true, cree_le: true },
        }),
      ]);
      return { outbound, inbound };
    });
  }

  private authorize(userId: string, storeId: string) {
    return this.storeAuthorization.requireMembership(userId, storeId, [
      RoleMembre.PROPRIETAIRE,
      RoleMembre.GERANT,
      RoleMembre.OPTICIEN,
    ]);
  }
}

function movementDelta(type: TypeMouvementStock, quantity: number): number {
  switch (type) {
    case TypeMouvementStock.RECEPTION:
    case TypeMouvementStock.RETOUR:
      return quantity;
    case TypeMouvementStock.VENTE:
    case TypeMouvementStock.ENDOMMAGE:
      return -quantity;
    case TypeMouvementStock.AJUSTEMENT:
      return quantity;
    case TypeMouvementStock.RESERVE:
    case TypeMouvementStock.LIBERE:
      return 0;
    default:
      return 0;
  }
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

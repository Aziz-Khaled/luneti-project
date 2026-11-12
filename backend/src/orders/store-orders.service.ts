import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatutCommande,
  TypeMouvementStock,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { StorePermissionCode } from '../common/guards/store-permissions';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StoreOrdersQueryDto } from './dto/store-orders-query.dto';
import { UpdateStoreOrderStatusDto } from './dto/update-store-order-status.dto';

const orderDetails = {
  id: true,
  numero_commande: true,
  statut: true,
  devise: true,
  sous_total: true,
  total_remise: true,
  total_taxes: true,
  total_livraison: true,
  total_general: true,
  passee_le: true,
  terminee_le: true,
  annulee_le: true,
  cree_le: true,
  instantane_adresse_livraison: true,
  utilisateur: { select: { id: true, prenom: true, nom: true, nom_utilisateur: true } },
  articles: {
    select: {
      id: true,
      instantane_nom_produit: true,
      instantane_variante: true,
      instantane_reference: true,
      quantite: true,
      prix_unitaire: true,
      total_ligne: true,
    },
  },
  paiements: {
    select: {
      id: true,
      fournisseur: true,
      statut: true,
      montant: true,
      devise: true,
      paye_le: true,
    },
    orderBy: { cree_le: 'desc' },
  },
  historique_statuts: {
    select: {
      id: true,
      statut_precedent: true,
      statut_suivant: true,
      note: true,
      cree_le: true,
      modifie_par: { select: { id: true, prenom: true, nom: true } },
    },
    orderBy: { cree_le: 'asc' },
  },
} satisfies Prisma.CommandeSelect;

function orderDetailsFor(includeDeliveryAddress: boolean): Prisma.CommandeSelect {
  return {
    ...orderDetails,
    instantane_adresse_livraison: includeDeliveryAddress,
  };
}

@Injectable()
export class StoreOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
    private readonly audit: AuditService,
  ) {}

  async list(
    userId: string,
    storeId: string,
    pagination: PaginationDto,
    filters: StoreOrdersQueryDto,
  ) {
    const membership = await this.authorize(userId, storeId, 'orders.view');
    const includeDeliveryAddress = this.storeAuthorization
      .effectivePermissions(membership)
      .has('customers.view_address');
    if (filters.from && filters.to && filters.from > filters.to) {
      throw new BadRequestException('The start date must be before the end date');
    }
    const where: Prisma.CommandeWhereInput = {
      magasin_id: storeId,
      ...(filters.status ? { statut: filters.status } : {}),
      ...(filters.from || filters.to
        ? { cree_le: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { numero_commande: { contains: filters.search, mode: 'insensitive' } },
              { utilisateur: { nom: { contains: filters.search, mode: 'insensitive' } } },
              { utilisateur: { prenom: { contains: filters.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.commande.findMany({
        where,
        select: orderDetailsFor(includeDeliveryAddress),
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.commande.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async get(userId: string, storeId: string, orderId: string) {
    const membership = await this.authorize(userId, storeId, 'orders.view');
    const includeDeliveryAddress = this.storeAuthorization
      .effectivePermissions(membership)
      .has('customers.view_address');
    const order = await this.prisma.commande.findFirst({
      where: { id: orderId, magasin_id: storeId },
      select: orderDetailsFor(includeDeliveryAddress),
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(
    userId: string,
    storeId: string,
    orderId: string,
    input: UpdateStoreOrderStatusDto,
  ) {
    await this.storeAuthorization.requireActiveMembership(userId, storeId);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.commande.findFirst({
        where: { id: orderId, magasin_id: storeId },
        select: { id: true, numero_commande: true, statut: true },
      });
      if (!current) throw new NotFoundException('Order not found');
      await this.authorize(
        userId,
        storeId,
        input.status === StatutCommande.ANNULE
          ? 'orders.cancel'
          : input.status === StatutCommande.CONFIRME
            ? 'orders.accept'
            : 'orders.update_status',
      );
      const membership = await this.authorize(userId, storeId, 'orders.view');
      const includeDeliveryAddress = this.storeAuthorization
        .effectivePermissions(membership)
        .has('customers.view_address');
      if (!this.isAllowedTransition(current.statut, input.status)) {
        throw new ConflictException(
          `Order cannot transition from ${current.statut} to ${input.status}`,
        );
      }

      if (input.status === StatutCommande.ANNULE) {
        await this.releaseReservations(tx, current.numero_commande, userId);
      }
      const update = await tx.commande.updateMany({
        where: { id: current.id, magasin_id: storeId, statut: current.statut },
        data: {
          statut: input.status,
          ...(input.status === StatutCommande.TERMINE ? { terminee_le: new Date() } : {}),
          ...(input.status === StatutCommande.ANNULE ? { annulee_le: new Date() } : {}),
        },
      });
      if (update.count !== 1) {
        throw new ConflictException('Order status changed concurrently; reload and retry');
      }
      await tx.historiqueStatutCommande.create({
        data: {
          commande_id: current.id,
          statut_precedent: current.statut,
          statut_suivant: input.status,
          note: input.note,
          modifie_par_id: userId,
        },
      });
      await this.audit.record(tx, {
        storeId,
        actorId: userId,
        action: input.status === StatutCommande.ANNULE ? 'order.cancelled' : 'order.status_changed',
        entityType: 'order',
        entityId: current.id,
        description: `Order ${current.numero_commande} status changed`,
        before: { status: current.statut },
        after: { status: input.status },
        reason: input.note,
      });
      return tx.commande.findFirstOrThrow({
        where: { id: current.id, magasin_id: storeId },
        select: orderDetailsFor(includeDeliveryAddress),
      });
    });
  }

  private isAllowedTransition(from: StatutCommande, to: StatutCommande) {
    const transitions: Partial<Record<StatutCommande, StatutCommande[]>> = {
      [StatutCommande.EN_ATTENTE_PAIEMENT]: [StatutCommande.ANNULE],
      [StatutCommande.PAYE]: [StatutCommande.CONFIRME],
      [StatutCommande.CONFIRME]: [StatutCommande.EN_TRAITEMENT],
      [StatutCommande.EN_TRAITEMENT]: [StatutCommande.PRET_A_RETIRER, StatutCommande.EXPEDIE],
      [StatutCommande.PRET_A_RETIRER]: [StatutCommande.TERMINE],
      [StatutCommande.EXPEDIE]: [StatutCommande.TERMINE],
    };
    return transitions[from]?.includes(to) ?? false;
  }

  private async releaseReservations(
    tx: Prisma.TransactionClient,
    orderNumber: string,
    actorId: string,
  ) {
    const reservations = await tx.mouvementStock.findMany({
      where: { reference: orderNumber, type: TypeMouvementStock.RESERVE },
      select: { stock_id: true, quantite: true },
    });
    for (const reservation of reservations) {
      const stock = await tx.stock.findUnique({
        where: { id: reservation.stock_id },
        select: {
          id: true,
          quantite_disponible: true,
          quantite_reservee: true,
        },
      });
      if (!stock || stock.quantite_reservee < reservation.quantite) {
        throw new ConflictException('Order stock reservation is inconsistent');
      }
      const updated = await tx.stock.updateMany({
        where: {
          id: stock.id,
          quantite_disponible: stock.quantite_disponible,
          quantite_reservee: stock.quantite_reservee,
        },
        data: { quantite_reservee: { decrement: reservation.quantite } },
      });
      if (updated.count !== 1) throw new ConflictException('Inventory changed concurrently');
      await tx.mouvementStock.create({
        data: {
          stock_id: stock.id,
          acteur_id: actorId,
          type: TypeMouvementStock.LIBERE,
          quantite: reservation.quantite,
          quantite_precedente: stock.quantite_disponible,
          quantite_suivante: stock.quantite_disponible,
          reserve_precedente: stock.quantite_reservee,
          reserve_suivante: stock.quantite_reservee - reservation.quantite,
          reference: orderNumber,
          note: 'Order cancellation reservation release',
        },
      });
    }
  }

  private authorize(
    userId: string,
    storeId: string,
    permission: StorePermissionCode,
  ) {
    return this.storeAuthorization.requirePermission(userId, storeId, permission);
  }
}

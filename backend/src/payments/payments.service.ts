import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FournisseurPaiement,
  Prisma,
  StatutPaiement,
  StatutRemboursement,
} from '@prisma/client';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
  ) {}

  async listForStore(
    userId: string,
    storeId: string,
    pagination: PaginationDto,
    filters: {
      from?: Date;
      to?: Date;
      status?: StatutPaiement;
      provider?: FournisseurPaiement;
      search?: string;
    },
  ) {
    const membership = await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'transactions.view',
    );
    const canViewRefunds = this.storeAuthorization
      .effectivePermissions(membership)
      .has('transactions.view_refunds');
    if (filters.from && filters.to && filters.from > filters.to) {
      throw new BadRequestException('The start date must be before the end date');
    }

    const where: Prisma.PaiementWhereInput = {
      order: { magasin_id: storeId },
      ...(filters.status ? { statut: filters.status } : {}),
      ...(filters.provider ? { fournisseur: filters.provider } : {}),
      ...(filters.from || filters.to
        ? {
            cree_le: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { order: { numero_commande: { contains: filters.search, mode: 'insensitive' } } },
              { order: { utilisateur: { nom: { contains: filters.search, mode: 'insensitive' } } } },
              { order: { utilisateur: { prenom: { contains: filters.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.paiement.findMany({
        where,
        select: {
          id: true,
          fournisseur: true,
          statut: true,
          montant: true,
          devise: true,
          paye_le: true,
          cree_le: true,
          remboursements: {
            select: {
              id: true,
              montant: true,
              devise: true,
              statut: true,
              raison: true,
              traite_le: true,
              cree_le: true,
            },
            orderBy: { cree_le: 'desc' },
          },
          order: {
            select: {
              id: true,
              numero_commande: true,
              statut: true,
              total_general: true,
              utilisateur: {
                select: { id: true, prenom: true, nom: true },
              },
            },
          },
        },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.paiement.count({ where }),
    ]);
    return paginated(
      data.map((payment) => {
        const { remboursements, ...sanitized } = payment;
        if (!canViewRefunds) return sanitized;
        const refundedAmount = remboursements
          .filter((refund) => refund.statut === StatutRemboursement.REUSSI)
          .reduce((sum, refund) => sum + Number(refund.montant), 0);
        return {
          ...sanitized,
          remboursements,
          refunded_amount: refundedAmount,
        };
      }),
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async listForOrder(userId: string, orderId: string) {
    await this.requireOwnedOrder(userId, orderId);
    return this.prisma.paiement.findMany({
      where: { commande_id: orderId },
      select: {
        id: true,
        fournisseur: true,
        statut: true,
        montant: true,
        devise: true,
        paye_le: true,
        cree_le: true,
        remboursements: {
          select: {
            id: true,
            montant: true,
            devise: true,
            statut: true,
            raison: true,
            traite_le: true,
            cree_le: true,
          },
          orderBy: { cree_le: 'desc' },
        },
      },
      orderBy: { cree_le: 'desc' },
    });
  }

  async listRefundsForOrder(userId: string, orderId: string) {
    await this.requireOwnedOrder(userId, orderId);
    return this.prisma.remboursement.findMany({
      where: { commande_id: orderId },
      select: {
        id: true,
        paymentId: true,
        montant: true,
        devise: true,
        statut: true,
        raison: true,
        traite_le: true,
        cree_le: true,
      },
      orderBy: { cree_le: 'desc' },
    });
  }

  private async requireOwnedOrder(userId: string, orderId: string) {
    const order = await this.prisma.commande.findFirst({
      where: { id: orderId, utilisateur_id: userId },
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Order not found');
  }
}

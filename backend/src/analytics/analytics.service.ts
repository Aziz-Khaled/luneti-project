import { Injectable } from '@nestjs/common';
import {
  Prisma,
  StatutAvis,
  StatutCommande,
  StatutPaiement,
  StatutRemboursement,
  StatutAdhesion,
} from '@prisma/client';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

const purchaseStatuses = [
  StatutCommande.PAYE,
  StatutCommande.CONFIRME,
  StatutCommande.EN_TRAITEMENT,
  StatutCommande.PRET_A_RETIRER,
  StatutCommande.EXPEDIE,
  StatutCommande.TERMINE,
  StatutCommande.REMBOURSE,
  StatutCommande.PARTIELLEMENT_REMBOURSE,
];

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
  ) {}

  async dashboard(
    userId: string,
    storeId: string,
    query: DashboardQueryDto = new DashboardQueryDto(),
  ) {
    const membership = await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'dashboard.view',
    );
    const permissions = this.storeAuthorization.effectivePermissions(membership);
    const canViewFinancials = permissions.has('dashboard.view_financials');
    const { from, to } = this.getDateRange(query);
    const orderWhere: Prisma.CommandeWhereInput = {
      magasin_id: storeId,
      cree_le: { gte: from, lte: to },
    };
    const paymentWhere: Prisma.PaiementWhereInput = {
      order: { magasin_id: storeId },
      paye_le: { gte: from, lte: to },
      statut: {
        in: [
          StatutPaiement.REUSSI,
          StatutPaiement.REMBOURSE,
          StatutPaiement.PARTIELLEMENT_REMBOURSE,
        ],
      },
    };
    const [orderCount, ordersByStatus, revenueByCurrency, refundTotalsByCurrency, revenuePeriods, salesTrend, completedTransactions, pendingPayments,
      refundedTransactions, appointmentCount, stock, lowStockCount, outOfStockCount,
      productCount, memberCount, activeMemberCount, pendingMemberCount, recentMembers, recentOrders,
      recentMovements, recentActivity, reviews] =
      await this.prisma.$transaction([
        this.prisma.commande.count({ where: orderWhere }),
        this.prisma.commande.groupBy({
          by: ['statut'],
          where: orderWhere,
          _count: { _all: true },
        }),
        this.prisma.paiement.groupBy({
          by: ['devise'],
          where: paymentWhere,
          _sum: { montant: true },
        }),
        this.prisma.remboursement.groupBy({
          by: ['devise'],
          where: {
            order: { magasin_id: storeId },
            statut: StatutRemboursement.REUSSI,
            traite_le: { gte: from, lte: to },
          },
          _sum: { montant: true },
        }),
        this.prisma.$queryRaw<{
          devise: string;
          today_revenue: Prisma.Decimal;
          today_refunds: Prisma.Decimal;
          this_week_revenue: Prisma.Decimal;
          this_week_refunds: Prisma.Decimal;
          this_month_revenue: Prisma.Decimal;
          this_month_refunds: Prisma.Decimal;
          this_year_revenue: Prisma.Decimal;
          this_year_refunds: Prisma.Decimal;
        }[]>(
          Prisma.sql`SELECT ledger.currency AS devise,
              COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'PAYMENT' AND ledger.occurred_at >= date_trunc('day', now())), 0) AS today_revenue,
              COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'REFUND' AND ledger.occurred_at >= date_trunc('day', now())), 0) AS today_refunds,
              COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'PAYMENT' AND ledger.occurred_at >= date_trunc('week', now())), 0) AS this_week_revenue,
              COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'REFUND' AND ledger.occurred_at >= date_trunc('week', now())), 0) AS this_week_refunds,
              COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'PAYMENT' AND ledger.occurred_at >= date_trunc('month', now())), 0) AS this_month_revenue,
              COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'REFUND' AND ledger.occurred_at >= date_trunc('month', now())), 0) AS this_month_refunds,
              COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'PAYMENT'), 0) AS this_year_revenue,
              COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'REFUND'), 0) AS this_year_refunds
            FROM (
              SELECT p."currency", p."paid_at" AS occurred_at, p."amount" AS amount, 'PAYMENT' AS kind
              FROM "paiements" p
              INNER JOIN "commandes" o ON o."id" = p."order_id"
              WHERE o."magasin_id" = ${storeId}::uuid
                AND p."paid_at" >= date_trunc('year', now())
                AND p."status"::text IN ('SUCCEEDED', 'REFUNDED', 'PARTIALLY_REFUNDED')
              UNION ALL
              SELECT r."currency", r."processed_at" AS occurred_at, r."amount" AS amount, 'REFUND' AS kind
              FROM "remboursements" r
              INNER JOIN "commandes" o ON o."id" = r."order_id"
              WHERE o."magasin_id" = ${storeId}::uuid
                AND r."processed_at" >= date_trunc('year', now())
                AND r."status"::text = 'SUCCEEDED'
            ) ledger
            GROUP BY ledger.currency
            ORDER BY ledger.currency`,
        ),
        this.prisma.$queryRaw<{
          day: Date;
          currency: string;
          revenue: Prisma.Decimal;
          refunds: Prisma.Decimal;
        }[]>(
          Prisma.sql`SELECT ledger.day, ledger.currency,
              COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'PAYMENT'), 0)::numeric(12, 3) AS revenue,
              COALESCE(SUM(ledger.amount) FILTER (WHERE ledger.kind = 'REFUND'), 0)::numeric(12, 3) AS refunds
            FROM (
              SELECT date_trunc('day', p."paid_at") AS day, p."currency", p."amount" AS amount, 'PAYMENT' AS kind
              FROM "paiements" p
              INNER JOIN "commandes" o ON o."id" = p."order_id"
              WHERE o."magasin_id" = ${storeId}::uuid AND p."paid_at" >= ${from}
                AND p."paid_at" <= ${to}
                AND p."status"::text IN ('SUCCEEDED', 'REFUNDED', 'PARTIALLY_REFUNDED')
              UNION ALL
              SELECT date_trunc('day', r."processed_at") AS day, r."currency", r."amount" AS amount, 'REFUND' AS kind
              FROM "remboursements" r
              INNER JOIN "commandes" o ON o."id" = r."order_id"
              WHERE o."magasin_id" = ${storeId}::uuid AND r."processed_at" >= ${from}
                AND r."processed_at" <= ${to} AND r."status"::text = 'SUCCEEDED'
            ) ledger
            GROUP BY ledger.day, ledger.currency
            ORDER BY ledger.day, ledger.currency`,
        ),
        this.prisma.paiement.count({
          where: {
            order: { magasin_id: storeId },
            statut: { in: [StatutPaiement.REUSSI, StatutPaiement.PARTIELLEMENT_REMBOURSE] },
            paye_le: { gte: from, lte: to },
          },
        }),
        this.prisma.paiement.count({
          where: {
            order: { magasin_id: storeId },
            statut: { in: [StatutPaiement.CREE, StatutPaiement.ACTION_REQUISE, StatutPaiement.EN_TRAITEMENT] },
            cree_le: { gte: from, lte: to },
          },
        }),
        this.prisma.paiement.count({
          where: {
            order: { magasin_id: storeId },
          statut: { in: [StatutPaiement.REMBOURSE, StatutPaiement.PARTIELLEMENT_REMBOURSE] },
            modifie_le: { gte: from, lte: to },
          },
        }),
        this.prisma.rendezVous.count({ where: { magasin_id: storeId, cree_le: { gte: from, lte: to } } }),
        this.prisma.stock.aggregate({
          where: {
            location: { magasin_id: storeId, est_actif: true },
          },
          _sum: { quantite_disponible: true, quantite_reservee: true },
        }),
        this.prisma.$queryRaw<{ count: number }[]>(
          Prisma.sql`SELECT COUNT(*)::int AS count
            FROM "stocks" s
            INNER JOIN "emplacements_stock" l ON l."id" = s."location_id"
            WHERE l."magasin_id" = ${storeId}::uuid
              AND l."is_active" = true
              AND s."quantity_on_hand" > 0
              AND s."quantity_on_hand" <= s."reorder_level"`,
        ),
        this.prisma.stock.count({
          where: { location: { magasin_id: storeId, est_actif: true }, quantite_disponible: 0 },
        }),
        this.prisma.annonceMagasin.count({
          where: { magasin_id: storeId, supprime_le: null },
        }),
        this.prisma.membreMagasin.count({ where: { magasin_id: storeId } }),
        this.prisma.membreMagasin.count({
          where: { magasin_id: storeId, statut: StatutAdhesion.ACTIVE },
        }),
        this.prisma.membreMagasin.count({
          where: { magasin_id: storeId, statut: StatutAdhesion.INVITE },
        }),
        this.prisma.membreMagasin.findMany({
          where: { magasin_id: storeId },
          select: {
            id: true,
            role: true,
            statut: true,
            cree_le: true,
            utilisateur: { select: { id: true, prenom: true, nom: true } },
          },
          orderBy: { cree_le: 'desc' },
          take: 5,
        }),
        this.prisma.commande.findMany({
          where: { magasin_id: storeId },
          select: {
            id: true,
            numero_commande: true,
            statut: true,
            devise: true,
            total_general: true,
            cree_le: true,
            utilisateur: { select: { id: true, prenom: true, nom: true } },
          },
          orderBy: { cree_le: 'desc' },
          take: 8,
        }),
        this.prisma.mouvementStock.findMany({
          where: {
            inventory: { location: { magasin_id: storeId } },
            cree_le: { gte: from, lte: to },
          },
          select: {
            id: true,
            type: true,
            quantite: true,
            quantite_precedente: true,
            quantite_suivante: true,
            reserve_precedente: true,
            reserve_suivante: true,
            note: true,
            cree_le: true,
            acteur: { select: { id: true, prenom: true, nom: true } },
            inventory: {
              select: {
                variante_annonce: {
                  select: { annonce: { select: { produit: { select: { nom: true } } } } },
                },
              },
            },
          },
          orderBy: { cree_le: 'desc' },
          take: 8,
        }),
        this.prisma.journalAudit.findMany({
          where: { magasin_id: storeId, cree_le: { gte: from, lte: to } },
          select: {
            id: true,
            acteur_id: true,
            action: true,
            description: true,
            acteur_identite: true,
            cree_le: true,
          },
          orderBy: { cree_le: 'desc' },
          take: 8,
        }),
        this.prisma.avisMagasin.aggregate({
          where: { magasin_id: storeId, statut: StatutAvis.PUBLIE },
          _avg: { note: true },
          _count: { _all: true },
        }),
      ]);
    const statusCounts = new Map(ordersByStatus.map((row) => [row.statut, row._count._all]));
    const refunds = new Map(refundTotalsByCurrency.map((row) => [row.devise, Number(row._sum.montant ?? 0)]));
    const grossRevenue = new Map(revenueByCurrency.map((row) => [row.devise, Number(row._sum.montant ?? 0)]));
    const currencies = new Set([...grossRevenue.keys(), ...refunds.keys()]);
    const grossRevenueByCurrency = Array.from(currencies, (currency) => ({
      currency,
      amount: grossRevenue.get(currency) ?? 0,
    }));
    const refundsByCurrency = Array.from(currencies, (currency) => ({
      currency,
      amount: refunds.get(currency) ?? 0,
    }));
    const netCashFlowByCurrency = Array.from(currencies, (currency) => ({
      currency,
      amount: Math.round(((grossRevenue.get(currency) ?? 0) - (refunds.get(currency) ?? 0)) * 1000) / 1000,
    }));
    return {
      range: { from, to },
      financial: canViewFinancials ? {
        gross_revenue_by_currency: grossRevenueByCurrency,
        refunds_by_currency: refundsByCurrency,
        net_cash_flow_by_currency: netCashFlowByCurrency,
        revenue_periods_by_currency: revenuePeriods.map((row) => ({
          currency: row.devise,
          today_revenue: row.today_revenue,
          today_refunds: row.today_refunds,
          this_week_revenue: row.this_week_revenue,
          this_week_refunds: row.this_week_refunds,
          this_month_revenue: row.this_month_revenue,
          this_month_refunds: row.this_month_refunds,
          this_year_revenue: row.this_year_revenue,
          this_year_refunds: row.this_year_refunds,
        })),
        completed_transactions: completedTransactions,
        pending_payments: pendingPayments,
        refunded_transactions: refundedTransactions,
      } : null,
      orders: permissions.has('orders.view') ? {
        total: orderCount,
        by_status: Object.fromEntries(ordersByStatus.map((row) => [row.statut, row._count._all])),
        new: orderCount,
        pending:
          (statusCounts.get(StatutCommande.EN_ATTENTE_PAIEMENT) ?? 0) +
          (statusCounts.get(StatutCommande.CONFIRME) ?? 0),
        awaiting_payment: statusCounts.get(StatutCommande.EN_ATTENTE_PAIEMENT) ?? 0,
        processing: statusCounts.get(StatutCommande.EN_TRAITEMENT) ?? 0,
        completed: statusCounts.get(StatutCommande.TERMINE) ?? 0,
        cancelled: statusCounts.get(StatutCommande.ANNULE) ?? 0,
        recent: recentOrders,
      } : null,
      ...(canViewFinancials
        ? { completed_revenue_by_currency: grossRevenueByCurrency }
        : {}),
      ...(permissions.has('appointments.view')
        ? { appointments: { total: appointmentCount } }
        : {}),
      ...(permissions.has('inventory.view') ? { inventory: {
        quantity_on_hand: stock._sum.quantite_disponible ?? 0,
        quantity_reserved: stock._sum.quantite_reservee ?? 0,
        total_products: productCount,
        low_stock_products: lowStockCount[0]?.count ?? 0,
        out_of_stock_products: outOfStockCount,
        recent_movements: recentMovements,
      } } : {}),
      ...(permissions.has('employees.view') ? { employees: {
        total: memberCount,
        active: activeMemberCount,
        pending_invitations: pendingMemberCount,
        recently_added: recentMembers,
      } } : {}),
      ...(permissions.has('activity.view_all') ||
      permissions.has('activity.view_own')
        ? {
            recent_activity: permissions.has('activity.view_all')
              ? recentActivity
              : recentActivity.filter((event) => event.acteur_id === userId),
          }
        : {}),
      ...(canViewFinancials ? { sales_trend: salesTrend.map((row) => ({
        day: row.day,
        currency: row.currency,
        revenue: row.revenue,
        refunds: row.refunds,
        net_cash_flow: Number(row.revenue) - Number(row.refunds),
      })) } : {}),
      ...(permissions.has('shop.view') ? { store_reviews: {
        published_count: reviews._count._all,
        average_rating: reviews._avg.note,
      } } : {}),
    };
  }

  private getDateRange(query: DashboardQueryDto) {
    const now = new Date();
    const end = query.to ?? now;
    let start = query.from;
    if (query.range === 'custom') {
      if (!query.from || !query.to) {
        throw new BadRequestException('Custom dashboard ranges require from and to dates');
      }
    } else if (!start) {
      start = new Date(now);
      if (query.range === 'today') start.setUTCHours(0, 0, 0, 0);
      else if (query.range === '7d') start.setUTCDate(start.getUTCDate() - 7);
      else if (query.range === '3m' || query.range === '12m') {
        const dayOfMonth = start.getUTCDate();
        start.setUTCDate(1);
        start.setUTCMonth(start.getUTCMonth() - (query.range === '3m' ? 3 : 12));
        const lastDayOfMonth = new Date(
          Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
        ).getUTCDate();
        start.setUTCDate(Math.min(dayOfMonth, lastDayOfMonth));
      }
      else start.setUTCDate(start.getUTCDate() - 30);
    }
    if (!start) throw new BadRequestException('A dashboard start date is required');
    if (start > end) throw new BadRequestException('The start date must be before the end date');
    return { from: start, to: end };
  }

  async customers(
    userId: string,
    storeId: string,
    pagination: PaginationDto,
  ) {
    await this.storeAuthorization.requirePermission(userId, storeId, 'customers.view');
    const [groups, countResult] = await Promise.all([
      this.prisma.commande.groupBy({
        by: ['utilisateur_id'],
        where: {
          magasin_id: storeId,
          statut: { in: purchaseStatuses },
        },
        _count: { _all: true },
        _max: { cree_le: true },
        orderBy: { _max: { cree_le: 'desc' } },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.$queryRaw<{ total: number }[]>(
        Prisma.sql`SELECT COUNT(DISTINCT "utilisateur_id")::int AS total
          FROM "commandes" WHERE "magasin_id" = ${storeId}::uuid
          AND "status"::text IN (${Prisma.join(purchaseStatuses)})`,
      ),
    ]);
    const users = await this.prisma.utilisateur.findMany({
      where: { id: { in: groups.map((group) => group.utilisateur_id) } },
      select: {
        id: true,
        prenom: true,
        nom: true,
        nom_utilisateur: true,
      },
    });
    const userById = new Map(users.map((user) => [user.id, user]));
    const data = groups.map((group) => ({
      customer: userById.get(group.utilisateur_id),
      order_count: group._count._all,
      last_order_at: group._max.cree_le,
    }));
    return paginated(data, countResult[0].total, pagination.page, pagination.limit);
  }

  async customerOrders(
    userId: string,
    storeId: string,
    customerId: string,
    pagination: PaginationDto,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'customers.view_order_history',
    );
    const where = {
      magasin_id: storeId,
      utilisateur_id: customerId,
      statut: { in: purchaseStatuses },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.commande.findMany({
        where,
        select: {
          id: true,
          numero_commande: true,
          statut: true,
          devise: true,
          total_general: true,
          passee_le: true,
          terminee_le: true,
          cree_le: true,
        },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.commande.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

}

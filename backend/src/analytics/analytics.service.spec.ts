import { RoleMembre, StatutCommande } from '@prisma/client';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('returns store-scoped financial, order, inventory and employee metrics', async () => {
    const authorization = {
      requirePermission: jest.fn().mockResolvedValue({ role: RoleMembre.PROPRIETAIRE }),
      effectivePermissions: jest.fn().mockReturnValue(new Set(['dashboard.view', 'dashboard.view_financials', 'orders.view', 'inventory.view', 'employees.view', 'appointments.view', 'activity.view_all', 'shop.view'])),
    };
    const prisma = {
      commande: {
        count: jest.fn().mockResolvedValue(8),
        groupBy: jest.fn().mockResolvedValue([
          { statut: StatutCommande.TERMINE, _count: { _all: 3 } },
          { statut: StatutCommande.EN_TRAITEMENT, _count: { _all: 2 } },
        ]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      paiement: {
        groupBy: jest.fn().mockResolvedValue([
          { devise: 'TND', _sum: { montant: 150 } },
        ]),
        count: jest.fn()
          .mockResolvedValueOnce(5)
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(2),
      },
      remboursement: {
        groupBy: jest.fn().mockResolvedValue([
          { devise: 'TND', _sum: { montant: 20 } },
        ]),
      },
      rendezVous: { count: jest.fn().mockResolvedValue(4) },
      stock: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { quantite_disponible: 25, quantite_reservee: 2 },
        }),
        count: jest.fn().mockResolvedValue(1),
      },
      annonceMagasin: { count: jest.fn().mockResolvedValue(12) },
      membreMagasin: {
        count: jest.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(3).mockResolvedValueOnce(1),
        findMany: jest.fn().mockResolvedValue([]),
      },
      mouvementStock: { findMany: jest.fn().mockResolvedValue([]) },
      journalAudit: { findMany: jest.fn().mockResolvedValue([]) },
      avisMagasin: {
        aggregate: jest.fn().mockResolvedValue({
          _avg: { note: 4.5 },
          _count: { _all: 6 },
        }),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };
    const service = new AnalyticsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    const result = await service.dashboard('manager-id', 'store-id');

    expect(result.financial).toMatchObject({
      gross_revenue_by_currency: [{ currency: 'TND', amount: 150 }],
      refunds_by_currency: [{ currency: 'TND', amount: 20 }],
      net_cash_flow_by_currency: [{ currency: 'TND', amount: 130 }],
      completed_transactions: 5,
      pending_payments: 1,
      refunded_transactions: 2,
    });
    expect(result.orders).toMatchObject({ total: 8, completed: 3, processing: 2 });
    expect(result.inventory).toMatchObject({
      quantity_on_hand: 25,
      quantity_reserved: 2,
      low_stock_products: 0,
      out_of_stock_products: 1,
      total_products: 12,
    });
    expect(result.employees).toEqual({
      total: 4,
      active: 3,
      pending_invitations: 1,
      recently_added: [],
    });
    expect(authorization.requirePermission).toHaveBeenCalledWith(
      'manager-id',
      'store-id',
      'dashboard.view',
    );
    expect(prisma.commande.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { magasin_id: 'store-id', cree_le: expect.any(Object) } }),
    );
    expect(prisma.mouvementStock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          inventory: { location: { magasin_id: 'store-id' } },
        }),
        select: expect.objectContaining({
          inventory: expect.any(Object),
        }),
      }),
    );
  });
});

import { ForbiddenException } from '@nestjs/common';
import { RoleMembre, StatutAdhesion, StatutMagasin } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreAuthorizationService } from './store-authorization.service';

describe('StoreAuthorizationService', () => {
  it('uses the owner exception to grant the complete stable catalog', () => {
    const service = new StoreAuthorizationService({} as PrismaService);
    const permissions = service.effectivePermissions({
      id: 'membership-id',
      role: RoleMembre.PROPRIETAIRE,
      permission_preset: null,
      permissions: [],
    });

    expect(permissions.has('transactions.view')).toBe(true);
    expect(permissions.has('employees.manage_permissions')).toBe(true);
    expect(permissions.size).toBeGreaterThan(25);
  });

  it('resolves a preset and explicit deny overrides without role escalation', () => {
    const service = new StoreAuthorizationService({} as PrismaService);
    const permissions = service.effectivePermissions({
      id: 'membership-id',
      role: RoleMembre.GERANT,
      permission_preset: 'stock_manager',
      permissions: [
        { code: 'inventory.adjust_stock', autorise: false },
        { code: 'transactions.view', autorise: true },
      ],
    });

    expect(permissions.has('inventory.view')).toBe(true);
    expect(permissions.has('inventory.adjust_stock')).toBe(false);
    expect(permissions.has('transactions.view')).toBe(true);
  });

  it('denies access immediately when no active membership exists', async () => {
    const prisma = {
      membreMagasin: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new StoreAuthorizationService(prisma as unknown as PrismaService);

    await expect(
      service.requirePermission('employee-id', 'other-store-id', 'orders.view'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.membreMagasin.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          utilisateur_id: 'employee-id',
          magasin_id: 'other-store-id',
          statut: StatutAdhesion.ACTIVE,
          magasin: {
            is: {
              statut: { not: StatutMagasin.FERME },
              supprime_le: null,
            },
          },
        },
      }),
    );
  });

  it('re-reads overrides so a revoked permission fails on the next request', async () => {
    let allowed = true;
    const prisma = {
      membreMagasin: {
        findFirst: jest.fn().mockImplementation(async () => ({
          id: 'membership-id',
          role: RoleMembre.EMPLOYE,
          permission_preset: 'custom',
          permissions: [{ code: 'inventory.adjust_stock', autorise: allowed }],
        })),
      },
    };
    const service = new StoreAuthorizationService(prisma as unknown as PrismaService);

    await expect(
      service.requirePermission('employee-id', 'store-id', 'inventory.adjust_stock'),
    ).resolves.toMatchObject({ id: 'membership-id' });

    allowed = false;
    await expect(
      service.requirePermission('employee-id', 'store-id', 'inventory.adjust_stock'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.membreMagasin.findFirst).toHaveBeenCalledTimes(2);
  });
});

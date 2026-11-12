import { ForbiddenException } from '@nestjs/common';
import { RoleMembre, StatutAdhesion } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorePermissionsService } from './store-permissions.service';

describe('StorePermissionsService', () => {
  it('does not allow managers to delegate permissions they do not have', async () => {
    const authorization = {
      requireActiveMembership: jest.fn().mockResolvedValue({
        id: 'manager-membership',
        role: RoleMembre.GERANT,
        permission_preset: 'custom',
        permissions: [
          { code: 'employees.manage_permissions', autorise: true },
          { code: 'orders.view', autorise: true },
        ],
      }),
      effectivePermissions: jest.fn().mockReturnValue(
        new Set(['employees.manage_permissions', 'orders.view']),
      ),
    };
    const prisma = {
      membreMagasin: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'employee-membership',
          utilisateur_id: 'employee-id',
          role: RoleMembre.EMPLOYE,
          statut: StatutAdhesion.ACTIVE,
          permission_preset: 'custom',
          permissions: [],
        }),
      },
      $transaction: jest.fn(),
    };
    const service = new StorePermissionsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      {} as AuditService,
    );

    await expect(
      service.updateMemberPermissions('manager-id', 'store-id', 'employee-membership', {
        preset: 'stock_manager',
        overrides: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('atomically replaces a member preset and records a before/after audit event', async () => {
    const target = {
      id: 'employee-membership',
      utilisateur_id: 'employee-id',
      role: RoleMembre.EMPLOYE,
      statut: StatutAdhesion.ACTIVE,
      permission_preset: 'read_only',
      permissions: [{ code: 'inventory.adjust_stock', autorise: false }],
    };
    const tx = {
      utilisateur: {
        findUnique: jest.fn().mockResolvedValue({
          prenom: 'Store',
          nom: 'Owner',
          nom_utilisateur: 'owner',
        }),
      },
      membreMagasin: { update: jest.fn().mockResolvedValue({}) },
      permissionMembreMagasin: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      membreMagasin: { findFirst: jest.fn().mockResolvedValue(target) },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const authorization = {
      requireActiveMembership: jest.fn().mockResolvedValue({
        id: 'owner-membership',
        role: RoleMembre.PROPRIETAIRE,
        permission_preset: null,
        permissions: [],
      }),
      effectivePermissions: jest.fn().mockReturnValue(new Set<string>()),
    };
    const audit = { record: jest.fn().mockResolvedValue({}) };
    const service = new StorePermissionsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as unknown as AuditService,
    );

    await service.updateMemberPermissions('owner-id', 'store-id', 'employee-membership', {
      preset: 'stock_manager',
      overrides: [{ code: 'inventory.adjust_stock', allowed: false }],
    });

    expect(tx.membreMagasin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'employee-membership' },
        data: expect.objectContaining({
          permission_preset: 'stock_manager',
          permissions_modifie_par: 'owner-id',
        }),
      }),
    );
    expect(tx.permissionMembreMagasin.deleteMany).toHaveBeenCalledWith({
      where: { membre_magasin_id: 'employee-membership' },
    });
    expect(tx.permissionMembreMagasin.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          code: 'inventory.adjust_stock',
          autorise: false,
          modifie_par: 'owner-id',
        }),
      ],
    });
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'employee.permissions_changed',
        before: expect.objectContaining({
          preset: 'read_only',
          effectivePermissions: expect.arrayContaining(['inventory.view']),
        }),
        after: expect.objectContaining({
          preset: 'stock_manager',
          effectivePermissions: expect.not.arrayContaining(['inventory.adjust_stock']),
        }),
      }),
    );
  });
});

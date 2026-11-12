import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  RoleMembre,
  StatutAdhesion,
  StatutMagasin,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  StorePermissionCode,
  resolveStorePermissions,
} from './store-permissions';

export interface ActiveStoreMembership {
  id: string;
  role: RoleMembre;
  permission_preset: string | null;
  permissions: Array<{ code: string; autorise: boolean }>;
}

@Injectable()
export class StoreAuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMembership(
    userId: string,
    storeId: string,
    allowedRoles: RoleMembre[],
  ): Promise<{ role: RoleMembre }> {
    const membership = await this.prisma.membreMagasin.findFirst({
      where: {
        utilisateur_id: userId,
        magasin_id: storeId,
        statut: StatutAdhesion.ACTIVE,
        role: { in: allowedRoles },
        magasin: {
          is: { statut: { not: StatutMagasin.FERME }, supprime_le: null },
        },
      },
      select: { role: true },
    });
    if (!membership) {
      throw new ForbiddenException('Active store membership is required');
    }
    return membership;
  }

  async requireActiveMembership(
    userId: string,
    storeId: string,
  ): Promise<ActiveStoreMembership> {
    const membership = await this.prisma.membreMagasin.findFirst({
      where: {
        utilisateur_id: userId,
        magasin_id: storeId,
        statut: StatutAdhesion.ACTIVE,
        magasin: {
          is: { statut: { not: StatutMagasin.FERME }, supprime_le: null },
        },
      },
      select: {
        id: true,
        role: true,
        permission_preset: true,
        permissions: { select: { code: true, autorise: true } },
      },
    });
    if (!membership) {
      throw new ForbiddenException('Active store membership is required');
    }
    return membership;
  }

  effectivePermissions(membership: ActiveStoreMembership): Set<string> {
    return resolveStorePermissions(
      membership.role,
      membership.permission_preset,
      membership.permissions.map(({ code, autorise }) => ({
        code,
        allowed: autorise,
      })),
    );
  }

  async requirePermission(
    userId: string,
    storeId: string,
    required: StorePermissionCode | readonly StorePermissionCode[],
  ): Promise<ActiveStoreMembership> {
    const membership = await this.requireActiveMembership(userId, storeId);
    const permissions = this.effectivePermissions(membership);
    const requiredPermissions = Array.isArray(required) ? required : [required];
    if (
      !requiredPermissions.some((permission) => permissions.has(permission))
    ) {
      throw new ForbiddenException('Store permission is required');
    }
    return membership;
  }

  async permissionSet(
    userId: string,
    storeId: string,
  ): Promise<{ membership: ActiveStoreMembership; permissions: Set<string> }> {
    const membership = await this.requireActiveMembership(userId, storeId);
    return { membership, permissions: this.effectivePermissions(membership) };
  }
}

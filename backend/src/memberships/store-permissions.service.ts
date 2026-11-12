import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoleMembre, StatutAdhesion, StatutMagasin } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import {
  STORE_PERMISSION_CATALOG,
  STORE_PERMISSION_PRESETS,
  isStorePermissionCode,
  isStorePermissionPreset,
  resolveStorePermissions,
} from '../common/guards/store-permissions';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMemberPermissionsDto } from './dto/update-member-permissions.dto';

@Injectable()
export class StorePermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: StoreAuthorizationService,
    private readonly audit: AuditService,
  ) {}

  async catalog(userId: string, storeId: string) {
    await this.authorization.requireActiveMembership(userId, storeId);
    return {
      permissions: STORE_PERMISSION_CATALOG,
      presets: Object.entries(STORE_PERMISSION_PRESETS).map(
        ([code, permissions]) => ({
          code,
          permissions,
        }),
      ),
    };
  }

  async employeeMe(userId: string) {
    const memberships = await this.prisma.membreMagasin.findMany({
      where: {
        utilisateur_id: userId,
        statut: StatutAdhesion.ACTIVE,
        magasin: {
          is: { statut: { not: StatutMagasin.FERME }, supprime_le: null },
        },
      },
      select: {
        id: true,
        magasin_id: true,
        role: true,
        permission_preset: true,
        permissions_modifie_le: true,
        magasin: { select: { id: true, nom: true, slug: true, devise: true } },
        permissions: { select: { code: true, autorise: true } },
      },
      orderBy: { cree_le: 'asc' },
    });

    return {
      stores: memberships.map((membership) => {
        const effective = resolveStorePermissions(
          membership.role,
          membership.permission_preset,
          membership.permissions.map(({ code, autorise }) => ({
            code,
            allowed: autorise,
          })),
        );
        return {
          membershipId: membership.id,
          storeId: membership.magasin_id,
          store: membership.magasin,
          role: membership.role,
          preset: membership.permission_preset,
          permissions: [...effective],
          permissionsUpdatedAt: membership.permissions_modifie_le,
        };
      }),
    };
  }

  async memberPermissions(actorId: string, storeId: string, memberId: string) {
    const actor = await this.assertPermissionManager(actorId, storeId);
    const member = await this.prisma.membreMagasin.findFirst({
      where: { id: memberId, magasin_id: storeId },
      select: {
        id: true,
        role: true,
        permission_preset: true,
        permissions_modifie_le: true,
        permissions_modifie_par: true,
        utilisateur: {
          select: { id: true, prenom: true, nom: true, nom_utilisateur: true },
        },
        permissions: {
          select: {
            code: true,
            autorise: true,
            modifie_par: true,
            modifie_le: true,
          },
          orderBy: { code: 'asc' },
        },
      },
    });
    if (!member) throw new NotFoundException('Store membership not found');
    if (
      member.role === RoleMembre.PROPRIETAIRE &&
      actor.role !== RoleMembre.PROPRIETAIRE
    ) {
      throw new ForbiddenException('Owner permissions are restricted');
    }
    const updater = member.permissions_modifie_par
      ? await this.prisma.utilisateur.findUnique({
          where: { id: member.permissions_modifie_par },
          select: { prenom: true, nom: true, nom_utilisateur: true },
        })
      : null;
    return {
      member: {
        id: member.id,
        role: member.role,
        user: member.utilisateur,
      },
      preset: member.permission_preset,
      overrides: member.permissions.map((override) => ({
        code: override.code,
        allowed: override.autorise,
        updatedBy: override.modifie_par,
        updatedAt: override.modifie_le,
      })),
      effectivePermissions: [
        ...resolveStorePermissions(
          member.role,
          member.permission_preset,
          member.permissions.map(({ code, autorise }) => ({
            code,
            allowed: autorise,
          })),
        ),
      ],
      updatedAt: member.permissions_modifie_le,
      updatedBy: updater
        ? [updater.prenom, updater.nom].filter(Boolean).join(' ') ||
          updater.nom_utilisateur
        : member.permissions_modifie_par
          ? 'Deleted user'
          : null,
    };
  }

  async updateMemberPermissions(
    actorId: string,
    storeId: string,
    memberId: string,
    input: UpdateMemberPermissionsDto,
  ) {
    const actor = await this.assertPermissionManager(actorId, storeId);
    const target = await this.prisma.membreMagasin.findFirst({
      where: { id: memberId, magasin_id: storeId },
      select: {
        id: true,
        utilisateur_id: true,
        role: true,
        statut: true,
        permission_preset: true,
        permissions: { select: { code: true, autorise: true } },
      },
    });
    if (!target) throw new NotFoundException('Store membership not found');
    if (
      target.role === RoleMembre.PROPRIETAIRE ||
      target.utilisateur_id === actorId
    ) {
      throw new ForbiddenException(
        'Owner and self permissions cannot be changed here',
      );
    }
    if (target.statut === StatutAdhesion.RETIRE) {
      throw new ForbiddenException(
        'Removed memberships cannot receive permissions',
      );
    }
    if (!isStorePermissionPreset(input.preset)) {
      throw new BadRequestException('Unknown permission preset');
    }

    const seen = new Set<string>();
    for (const override of input.overrides) {
      if (!isStorePermissionCode(override.code)) {
        throw new BadRequestException(`Unknown permission: ${override.code}`);
      }
      if (seen.has(override.code)) {
        throw new BadRequestException(
          `Duplicate permission override: ${override.code}`,
        );
      }
      seen.add(override.code);
    }

    const actorPermissions = this.authorization.effectivePermissions(actor);
    const requestedEffective = resolveStorePermissions(
      target.role,
      input.preset,
      input.overrides,
    );
    if (
      actor.role !== RoleMembre.PROPRIETAIRE &&
      [...requestedEffective].some((code) => !actorPermissions.has(code))
    ) {
      throw new ForbiddenException(
        'You cannot delegate permissions you do not have',
      );
    }

    const before = {
      preset: target.permission_preset,
      overrides: target.permissions.map(({ code, autorise }) => ({
        code,
        allowed: autorise,
      })),
      effectivePermissions: [
        ...resolveStorePermissions(
          target.role,
          target.permission_preset,
          target.permissions.map(({ code, autorise }) => ({
            code,
            allowed: autorise,
          })),
        ),
      ],
    };
    const updatedAt = new Date();
    return this.prisma.$transaction(async (tx) => {
      const actorProfile = await tx.utilisateur.findUnique({
        where: { id: actorId },
        select: { prenom: true, nom: true, nom_utilisateur: true },
      });
      const updatedBy = actorProfile
        ? [actorProfile.prenom, actorProfile.nom].filter(Boolean).join(' ') ||
          actorProfile.nom_utilisateur
        : 'Deleted user';
      await tx.membreMagasin.update({
        where: { id: memberId },
        data: {
          permission_preset: input.preset,
          permissions_modifie_le: updatedAt,
          permissions_modifie_par: actorId,
        },
      });
      await tx.permissionMembreMagasin.deleteMany({
        where: { membre_magasin_id: memberId },
      });
      if (input.overrides.length) {
        await tx.permissionMembreMagasin.createMany({
          data: input.overrides.map(({ code, allowed }) => ({
            membre_magasin_id: memberId,
            code,
            autorise: allowed,
            modifie_par: actorId,
            cree_le: updatedAt,
            modifie_le: updatedAt,
          })),
        });
      }
      const after = {
        preset: input.preset,
        overrides: input.overrides.map(({ code, allowed }) => ({
          code,
          allowed,
        })),
        effectivePermissions: [...requestedEffective],
      };
      await this.audit.record(tx, {
        storeId,
        actorId,
        action: 'employee.permissions_changed',
        entityType: 'store_membership',
        entityId: memberId,
        description: 'Employee permissions changed',
        before,
        after,
      });
      return {
        memberId,
        ...after,
        updatedAt,
        updatedBy,
      };
    });
  }

  private async assertPermissionManager(actorId: string, storeId: string) {
    const actor = await this.authorization.requireActiveMembership(
      actorId,
      storeId,
    );
    if (
      actor.role !== RoleMembre.PROPRIETAIRE &&
      !this.authorization
        .effectivePermissions(actor)
        .has('employees.manage_permissions')
    ) {
      throw new ForbiddenException(
        'Managing employee permissions is not allowed',
      );
    }
    return actor;
  }
}

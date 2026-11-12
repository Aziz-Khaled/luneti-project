import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleMembre } from '@prisma/client';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEventInput {
  storeId?: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface AuditQuery {
  from?: Date;
  to?: Date;
  actorId?: string;
  action?: string;
  entityType?: string;
  search?: string;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
  ) {}

  async record(tx: Prisma.TransactionClient, event: AuditEventInput) {
    const actor = await tx.utilisateur.findUnique({
      where: { id: event.actorId },
      select: { prenom: true, nom: true, nom_utilisateur: true },
    });
    const actorIdentity = actor
      ? [actor.prenom, actor.nom].filter(Boolean).join(' ') ||
        actor.nom_utilisateur
      : 'Deleted user';

    return tx.journalAudit.create({
      data: {
        magasin_id: event.storeId,
        acteur_id: event.actorId,
        acteur_identite: actorIdentity,
        action: event.action,
        type_entite: event.entityType,
        entite_id: event.entityId,
        description: event.description,
        valeurs_precedentes: event.before,
        nouvelles_valeurs: event.after,
        raison: event.reason,
        metadonnees: event.metadata,
      },
    });
  }

  async list(
    userId: string,
    storeId: string,
    pagination: PaginationDto,
    filters: AuditQuery,
  ) {
    const membership = await this.storeAuthorization.requireActiveMembership(userId, storeId);
    const permissions = this.storeAuthorization.effectivePermissions(membership);
    const canViewAll =
      membership.role === RoleMembre.PROPRIETAIRE ||
      permissions.has('activity.view_all');
    if (!canViewAll && !permissions.has('activity.view_own')) {
      throw new ForbiddenException('Store activity permission is required');
    }
    if (filters.from && filters.to && filters.from > filters.to) {
      throw new BadRequestException('The start date must be before the end date');
    }

    const where: Prisma.JournalAuditWhereInput = {
      magasin_id: storeId,
      ...(filters.from || filters.to
        ? {
            cree_le: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
      ...((canViewAll ? filters.actorId : userId)
        ? { acteur_id: canViewAll ? filters.actorId : userId }
        : {}),
      ...(filters.action ? { action: { contains: filters.action, mode: 'insensitive' } } : {}),
      ...(filters.entityType
        ? { type_entite: { equals: filters.entityType, mode: 'insensitive' } }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { description: { contains: filters.search, mode: 'insensitive' } },
              { action: { contains: filters.search, mode: 'insensitive' } },
              { type_entite: { contains: filters.search, mode: 'insensitive' } },
              { entite_id: { contains: filters.search, mode: 'insensitive' } },
              { acteur_identite: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.journalAudit.findMany({
        where,
        select: {
          id: true,
          acteur_id: true,
          acteur_identite: true,
          action: true,
          type_entite: true,
          entite_id: true,
          description: true,
          valeurs_precedentes: true,
          nouvelles_valeurs: true,
          raison: true,
          metadonnees: true,
          cree_le: true,
        },
        orderBy: [{ cree_le: 'desc' }, { id: 'desc' }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.journalAudit.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async get(userId: string, storeId: string, activityId: string) {
    const membership = await this.storeAuthorization.requireActiveMembership(userId, storeId);
    const permissions = this.storeAuthorization.effectivePermissions(membership);
    const canViewAll =
      membership.role === RoleMembre.PROPRIETAIRE ||
      permissions.has('activity.view_all');
    if (!canViewAll && !permissions.has('activity.view_own')) {
      throw new ForbiddenException('Store activity permission is required');
    }
    const activity = await this.prisma.journalAudit.findFirst({
      where: { id: activityId, magasin_id: storeId },
      select: {
        id: true,
        acteur_id: true,
        acteur_identite: true,
        action: true,
        type_entite: true,
        entite_id: true,
        description: true,
        valeurs_precedentes: true,
        nouvelles_valeurs: true,
        raison: true,
        metadonnees: true,
        cree_le: true,
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    if (!canViewAll && activity.acteur_id !== userId) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }
}

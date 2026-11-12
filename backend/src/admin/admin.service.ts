import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatutAvis } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async auditLogs(query: AuditQueryDto) {
    const where: Prisma.JournalAuditWhereInput = {
      ...(query.type_entite ? { type_entite: query.type_entite } : {}),
      ...(query.acteur_id ? { acteur_id: query.acteur_id } : {}),
      ...(query.magasin_id ? { magasin_id: query.magasin_id } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.journalAudit.findMany({
        where,
        select: {
          id: true,
          acteur_id: true,
          magasin_id: true,
          action: true,
          type_entite: true,
          entite_id: true,
          cree_le: true,
        },
        orderBy: { cree_le: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.journalAudit.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async moderateProductReview(
    actorId: string,
    reviewId: string,
    status: StatutAvis,
  ) {
    const review = await this.prisma.avisProduit.findUnique({
      where: { id: reviewId },
      select: { id: true, statut: true },
    });
    if (!review) throw new NotFoundException('Product review not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.avisProduit.update({
        where: { id: reviewId },
        data: { statut: status },
        select: { id: true, statut: true },
      });
      await this.audit.record(tx, {
        actorId,
        action: 'review.moderated',
        entityType: 'product_review',
        entityId: reviewId,
        description: 'Product review moderation status changed',
        before: { status: review.statut },
        after: { status },
      });
      return updated;
    });
  }

  async moderateStoreReview(
    actorId: string,
    reviewId: string,
    status: StatutAvis,
  ) {
    const review = await this.prisma.avisMagasin.findUnique({
      where: { id: reviewId },
      select: { id: true, magasin_id: true, statut: true },
    });
    if (!review) throw new NotFoundException('Store review not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.avisMagasin.update({
        where: { id: reviewId },
        data: { statut: status },
        select: { id: true, statut: true },
      });
      await this.audit.record(tx, {
        storeId: review.magasin_id,
        actorId,
        action: 'review.moderated',
        entityType: 'store_review',
        entityId: reviewId,
        description: 'Store review moderation status changed',
        before: { status: review.statut },
        after: { status },
      });
      return updated;
    });
  }
}

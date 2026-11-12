import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  Prisma,
  StatutEssayage,
  StatutProduit,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateTryOnSessionDto } from './dto/create-try-on-session.dto';

const sessionSelect = {
  id: true,
  variante_produit_id: true,
  statut: true,
  commencee_le: true,
  terminee_le: true,
  expire_le: true,
  consentement: {
    select: {
      version_consentement: true,
      objectif: true,
      accepte_le: true,
      retire_le: true,
    },
  },
} satisfies Prisma.SessionEssayageSelect;

@Injectable()
export class VirtualTryOnService {
  constructor(private readonly prisma: PrismaService) {}

  consentPolicy() {
    const policy = this.getPolicy();
    return {
      version: policy.version,
      purpose: policy.purpose,
      text: policy.text,
    };
  }

  async create(userId: string, input: CreateTryOnSessionDto) {
    const policy = this.getPolicy();
    if (input.variante_produit_id) {
      const variant = await this.prisma.varianteProduit.findFirst({
        where: {
          id: input.variante_produit_id,
          est_actif: true,
          produit: {
            is: { statut: StatutProduit.ACTIVE, supprime_le: null },
          },
        },
        select: { id: true },
      });
      if (!variant) throw new NotFoundException('Active product variant not found');
    }

    return this.prisma.sessionEssayage.create({
      data: {
        utilisateur_id: userId,
        variante_produit_id: input.variante_produit_id,
        consentement: {
          create: {
            version_consentement: policy.version,
            objectif: policy.purpose,
          },
        },
      },
      select: sessionSelect,
    });
  }

  async list(userId: string, pagination: PaginationDto) {
    const where = { utilisateur_id: userId, supprime_le: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.sessionEssayage.findMany({
        where,
        select: sessionSelect,
        orderBy: { commencee_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.sessionEssayage.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async find(userId: string, sessionId: string) {
    const session = await this.prisma.sessionEssayage.findFirst({
      where: { id: sessionId, utilisateur_id: userId, supprime_le: null },
      select: sessionSelect,
    });
    if (!session) throw new NotFoundException('Try-on session not found');
    return session;
  }

  async withdrawConsent(userId: string, sessionId: string) {
    return this.closeSession(userId, sessionId, true);
  }

  async remove(userId: string, sessionId: string) {
    return this.closeSession(userId, sessionId, false);
  }

  private async closeSession(
    userId: string,
    sessionId: string,
    withdraw: boolean,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.sessionEssayage.findFirst({
        where: { id: sessionId, utilisateur_id: userId, supprime_le: null },
        select: {
          id: true,
          consentement: { select: { retire_le: true } },
        },
      });
      if (!session) throw new NotFoundException('Try-on session not found');
      const now = new Date();
      const shouldWithdrawConsent =
        withdraw && session.consentement && !session.consentement.retire_le;
      await tx.sessionEssayage.update({
        where: { id: sessionId },
        data: {
          statut: StatutEssayage.DELETED,
          supprime_le: now,
          ...(shouldWithdrawConsent
            ? { consentement: { update: { retire_le: now } } }
            : {}),
        },
      });
      return { success: true };
    });
  }

  private getPolicy() {
    const version = process.env.VIRTUAL_TRYON_CONSENT_VERSION;
    const purpose = process.env.VIRTUAL_TRYON_CONSENT_PURPOSE;
    const text = process.env.VIRTUAL_TRYON_CONSENT_TEXT;
    if (!version || !purpose || !text) {
      throw new ServiceUnavailableException(
        'Virtual try-on consent policy is not configured',
      );
    }
    return { version, purpose, text };
  }
}

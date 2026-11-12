import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatutNotification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, pagination: PaginationDto) {
    const where = { utilisateur_id: userId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: {
          id: true,
          type: true,
          titre: true,
          contenu: true,
          donnees: true,
          statut: true,
          lu_le: true,
          envoye_le: true,
          cree_le: true,
        },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        utilisateur_id: userId,
        statut: { in: [StatutNotification.PENDING, StatutNotification.ENVOYE] },
      },
    }).then((count) => ({ count }));
  }

  async markRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        utilisateur_id: userId,
        statut: { in: [StatutNotification.PENDING, StatutNotification.ENVOYE] },
      },
      data: { statut: StatutNotification.LU, lu_le: new Date() },
    });
    if (!result.count) {
      const exists = await this.prisma.notification.findFirst({
        where: { id: notificationId, utilisateur_id: userId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Notification not found');
      return this.prisma.notification.findUniqueOrThrow({
        where: { id: notificationId },
        select: { id: true, statut: true, lu_le: true },
      });
    }
    return this.prisma.notification.findUniqueOrThrow({
      where: { id: notificationId },
      select: { id: true, statut: true, lu_le: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        utilisateur_id: userId,
        statut: { in: [StatutNotification.PENDING, StatutNotification.ENVOYE] },
      },
      data: { statut: StatutNotification.LU, lu_le: new Date() },
    });
    return { updated: result.count };
  }

  preferences(userId: string) {
    return this.prisma.preferenceNotification.findMany({
      where: { utilisateur_id: userId },
      select: { type: true, canal: true, active: true },
      orderBy: [{ type: 'asc' }, { canal: 'asc' }],
    });
  }

  updatePreference(userId: string, input: UpdateNotificationPreferenceDto) {
    const where = {
      utilisateur_id_type_canal: {
        utilisateur_id: userId,
        type: input.type,
        canal: input.canal,
      },
    } satisfies Prisma.PreferenceNotificationWhereUniqueInput;
    return this.prisma.preferenceNotification.upsert({
      where,
      create: {
        utilisateur_id: userId,
        type: input.type,
        canal: input.canal,
        active: input.active,
      },
      update: { active: input.active },
      select: { type: true, canal: true, active: true },
    });
  }
}

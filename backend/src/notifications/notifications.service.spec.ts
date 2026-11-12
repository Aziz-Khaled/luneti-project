import { NotFoundException } from '@nestjs/common';
import { StatutNotification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('only marks the authenticated recipient notification as read', async () => {
    const prisma = {
      notification: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new NotificationsService(prisma as unknown as PrismaService);

    await expect(service.markRead('owner-id', 'notification-id'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'notification-id',
          utilisateur_id: 'owner-id',
          statut: {
            in: [StatutNotification.PENDING, StatutNotification.ENVOYE],
          },
        }),
      }),
    );
  });

  it('marks only pending and sent notifications as read in bulk', async () => {
    const prisma = {
      notification: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const service = new NotificationsService(prisma as unknown as PrismaService);

    await expect(service.markAllRead('owner-id')).resolves.toEqual({ updated: 2 });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          utilisateur_id: 'owner-id',
          statut: {
            in: [StatutNotification.PENDING, StatutNotification.ENVOYE],
          },
        }),
      }),
    );
  });
});

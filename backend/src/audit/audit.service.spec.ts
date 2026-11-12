import { BadRequestException } from '@nestjs/common';
import { RoleMembre } from '@prisma/client';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('authorizes and filters history by the requested store', async () => {
    const authorization = {
      requireActiveMembership: jest.fn().mockResolvedValue({ role: RoleMembre.PROPRIETAIRE }),
      effectivePermissions: jest.fn().mockReturnValue(new Set<string>()),
    };
    const event = { id: 'event-id', description: 'Stock received' };
    const prisma = {
      journalAudit: {
        findMany: jest.fn().mockResolvedValue([event]),
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest.fn((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      ),
    };
    const service = new AuditService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.list('owner-id', 'store-id', { page: 1, limit: 20 } as never, {
        search: 'stock',
      }),
    ).resolves.toMatchObject({
      data: [event],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    expect(authorization.requireActiveMembership).toHaveBeenCalledWith(
      'owner-id',
      'store-id',
    );
    expect(prisma.journalAudit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          magasin_id: 'store-id',
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it('rejects reversed date ranges', async () => {
    const authorization = {
      requireActiveMembership: jest.fn().mockResolvedValue({ role: RoleMembre.PROPRIETAIRE }),
      effectivePermissions: jest.fn().mockReturnValue(new Set<string>()),
    };
    const prisma = { journalAudit: { findMany: jest.fn(), count: jest.fn() } };
    const service = new AuditService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.list(
        'owner-id',
        'store-id',
        { page: 1, limit: 20 } as never,
        { from: new Date('2026-02-02'), to: new Date('2026-02-01') },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.journalAudit.findMany).not.toHaveBeenCalled();
  });
});

import { ForbiddenException } from '@nestjs/common';
import { RoleMembre, StatutAdhesion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OpticiansService } from './opticians.service';

describe('OpticiansService', () => {
  const prisma = {
    membreMagasin: { findFirst: jest.fn() },
    profilOpticien: { upsert: jest.fn(), findUnique: jest.fn() },
  };
  const service = new OpticiansService(prisma as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('requires an active owner or optician membership before creating a profile', async () => {
    prisma.membreMagasin.findFirst.mockResolvedValue(null);

    await expect(
      service.updateMe('user-id', { titre_professionnel: 'Optician' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.membreMagasin.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          utilisateur_id: 'user-id',
          role: { in: [RoleMembre.PROPRIETAIRE, RoleMembre.OPTICIEN] },
          statut: StatutAdhesion.ACTIVE,
        },
      }),
    );
    expect(prisma.profilOpticien.upsert).not.toHaveBeenCalled();
  });

  it('allows an active store owner to update their optician profile', async () => {
    prisma.membreMagasin.findFirst.mockResolvedValue({ id: 'membership-id' });
    prisma.profilOpticien.upsert.mockResolvedValue({ utilisateur_id: 'user-id' });

    await service.updateMe('user-id', { titre_professionnel: 'Optician' });

    expect(prisma.membreMagasin.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          utilisateur_id: 'user-id',
          role: { in: [RoleMembre.PROPRIETAIRE, RoleMembre.OPTICIEN] },
          statut: StatutAdhesion.ACTIVE,
        },
      }),
    );
    expect(prisma.profilOpticien.upsert).toHaveBeenCalled();
  });

  it('upserts only the authenticated optician profile', async () => {
    prisma.membreMagasin.findFirst.mockResolvedValue({ id: 'membership-id' });
    prisma.profilOpticien.upsert.mockResolvedValue({ utilisateur_id: 'user-id' });

    await service.updateMe('user-id', { titre_professionnel: 'Optician' });

    expect(prisma.profilOpticien.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { utilisateur_id: 'user-id' },
        create: expect.objectContaining({
          utilisateur: { connect: { id: 'user-id' } },
          titre_professionnel: 'Optician',
        }),
        update: { titre_professionnel: 'Optician' },
      }),
    );
  });
});

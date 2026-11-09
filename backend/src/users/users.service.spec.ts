import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    utilisateur: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    abonnementUtilisateur: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('only updates fields explicitly present in the profile DTO', async () => {
    prisma.utilisateur.updateMany.mockResolvedValue({ count: 1 });
    prisma.utilisateur.findFirst.mockResolvedValue({
      id: 'user-id',
      prenom: 'Lina',
      nom: 'Ben Ali',
    });

    await service.updateMe('user-id', { prenom: 'Lina' });

    expect(prisma.utilisateur.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-id', supprime_le: null },
      data: { prenom: 'Lina' },
    });
  });

  it('translates duplicate usernames into a conflict response', async () => {
    prisma.utilisateur.updateMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    await expect(
      service.updateMe('user-id', { nom_utilisateur: 'taken' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects self-follow before writing a follow record', async () => {
    await expect(service.follow('user-id', 'user-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.abonnementUtilisateur.create).not.toHaveBeenCalled();
  });

  it('creates a follow relationship for an active public target', async () => {
    prisma.utilisateur.findFirst.mockResolvedValue({ id: 'target-id' });
    prisma.abonnementUtilisateur.create.mockResolvedValue({ id: 'follow-id' });

    await service.follow('follower-id', 'target-id');

    expect(prisma.abonnementUtilisateur.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { abonne_id: 'follower-id', suivi_id: 'target-id' },
      }),
    );
  });
});

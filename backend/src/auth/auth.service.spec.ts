import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt-token.service';
import { PasswordHasher } from './password-hasher.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  it('replaces the temporary password and clears the required-change flag', async () => {
    const user = {
      id: 'employee-id',
      role: 'USER',
      doit_changer_mot_de_passe: false,
    };
    const prisma = {
      utilisateur: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ empreinte_mot_de_passe: 'old-hash' })
          .mockResolvedValueOnce(user),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const passwordHasher = {
      verify: jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
      hash: jest.fn().mockResolvedValue('new-hash'),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      passwordHasher as unknown as PasswordHasher,
      {} as JwtTokenService,
    );

    await expect(
      service.changePassword('employee-id', {
        currentPassword: 'temporary-password',
        newPassword: 'employee-owned-password',
      }),
    ).resolves.toEqual(user);

    expect(prisma.utilisateur.update).toHaveBeenCalledWith({
      where: { id: 'employee-id' },
      data: {
        empreinte_mot_de_passe: 'new-hash',
        doit_changer_mot_de_passe: false,
      },
    });
  });

  it('rejects a password change with an incorrect temporary password', async () => {
    const prisma = {
      utilisateur: {
        findFirst: jest.fn().mockResolvedValue({
          empreinte_mot_de_passe: 'old-hash',
        }),
        update: jest.fn(),
      },
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {
        verify: jest.fn().mockResolvedValue(false),
        hash: jest.fn(),
      } as unknown as PasswordHasher,
      {} as JwtTokenService,
    );

    await expect(
      service.changePassword('employee-id', {
        currentPassword: 'wrong-password',
        newPassword: 'employee-owned-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.utilisateur.update).not.toHaveBeenCalled();
  });

  it('rejects reusing a temporary password', async () => {
    const prisma = {
      utilisateur: {
        findFirst: jest.fn().mockResolvedValue({
          empreinte_mot_de_passe: 'old-hash',
        }),
        update: jest.fn(),
      },
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {
        verify: jest.fn().mockResolvedValue(true),
        hash: jest.fn(),
      } as unknown as PasswordHasher,
      {} as JwtTokenService,
    );

    await expect(
      service.changePassword('employee-id', {
        currentPassword: 'same-password',
        newPassword: 'same-password',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.utilisateur.update).not.toHaveBeenCalled();
  });
});

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolePlateforme } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtTokenService } from './jwt-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard temporary password restriction', () => {
  function makeContext() {
    const request = {
      headers: { authorization: 'Bearer access-token' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  it('blocks authenticated operations until the temporary password changes', async () => {
    const { context } = makeContext();
    const guard = new JwtAuthGuard(
      {
        verify: jest.fn().mockReturnValue({ id: 'employee-id' }),
      } as unknown as JwtTokenService,
      {
        utilisateur: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'employee-id',
            role: RolePlateforme.USER,
            doit_changer_mot_de_passe: true,
          }),
        },
      } as unknown as PrismaService,
      {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      } as unknown as Reflector,
    );

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows the password-change endpoint to complete onboarding', async () => {
    const { context, request } = makeContext();
    const guard = new JwtAuthGuard(
      {
        verify: jest.fn().mockReturnValue({ id: 'employee-id' }),
      } as unknown as JwtTokenService,
      {
        utilisateur: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'employee-id',
            role: RolePlateforme.USER,
            doit_changer_mot_de_passe: true,
          }),
        },
      } as unknown as PrismaService,
      {
        getAllAndOverride: jest.fn().mockReturnValue(true),
      } as unknown as Reflector,
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).toHaveProperty('user.id', 'employee-id');
  });
});

import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VirtualTryOnService } from './virtual-try-on.service';

describe('VirtualTryOnService', () => {
  const consentKeys = [
    'VIRTUAL_TRYON_CONSENT_VERSION',
    'VIRTUAL_TRYON_CONSENT_PURPOSE',
    'VIRTUAL_TRYON_CONSENT_TEXT',
  ] as const;
  const previous = new Map(
    consentKeys.map((key) => [key, process.env[key]]),
  );

  afterEach(() => {
    for (const key of consentKeys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('does not create sessions without a configured consent policy', () => {
    for (const key of consentKeys) delete process.env[key];
    const prisma = { sessionEssayage: { create: jest.fn() } };
    const service = new VirtualTryOnService(prisma as unknown as PrismaService);

    expect(() => service.consentPolicy()).toThrow(ServiceUnavailableException);
    expect(prisma.sessionEssayage.create).not.toHaveBeenCalled();
  });

  it('records consent policy version and purpose from server configuration', async () => {
    process.env.VIRTUAL_TRYON_CONSENT_VERSION = 'v3';
    process.env.VIRTUAL_TRYON_CONSENT_PURPOSE = 'Virtual product preview';
    process.env.VIRTUAL_TRYON_CONSENT_TEXT = 'Policy terms';
    const prisma = {
      sessionEssayage: {
        create: jest.fn().mockResolvedValue({ id: 'session-id' }),
      },
    };
    const service = new VirtualTryOnService(prisma as unknown as PrismaService);

    await service.create('user-id', { accepte: true });

    expect(prisma.sessionEssayage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          utilisateur_id: 'user-id',
          consentement: {
            create: {
              version_consentement: 'v3',
              objectif: 'Virtual product preview',
            },
          },
        }),
      }),
    );
  });

  it('withdraws consent through the session relation while closing the session', async () => {
    const update = jest.fn().mockResolvedValue({});
    const transaction = {
      sessionEssayage: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'session-id',
          consentement: { retire_le: null },
        }),
        update,
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const service = new VirtualTryOnService(prisma as unknown as PrismaService);

    await service.withdrawConsent('user-id', 'session-id');

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-id' },
        data: expect.objectContaining({
          supprime_le: expect.any(Date),
          consentement: {
            update: { retire_le: expect.any(Date) },
          },
        }),
      }),
    );
  });

  it('closes a session without updating a missing or previously withdrawn consent', async () => {
    const update = jest.fn().mockResolvedValue({});
    const transaction = {
      sessionEssayage: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'session-id',
          consentement: { retire_le: new Date() },
        }),
        update,
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const service = new VirtualTryOnService(prisma as unknown as PrismaService);

    await service.withdrawConsent('user-id', 'session-id');

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ consentement: expect.anything() }),
      }),
    );
  });
});

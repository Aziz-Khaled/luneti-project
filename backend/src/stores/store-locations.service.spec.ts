import { BadRequestException } from '@nestjs/common';
import { TypeEmplacementStock } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { StoreLocationsService } from './store-locations.service';

describe('StoreLocationsService', () => {
  const authorization = {
    requirePermission: jest.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a custom location type for the selected store', async () => {
    const type = {
      id: 'type-id',
      magasin_id: 'store-id',
      nom: 'Vitrine',
      est_actif: true,
    };
    const prisma = {
      typeEmplacementMagasin: {
        create: jest.fn().mockResolvedValue(type),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.createType('owner-id', 'store-id', { nom: ' Vitrine ' }),
    ).resolves.toEqual(type);
    expect(authorization.requirePermission).toHaveBeenCalledWith(
      'owner-id',
      'store-id',
      'inventory.manage_locations',
    );
    expect(prisma.typeEmplacementMagasin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { magasin_id: 'store-id', nom: 'Vitrine' },
      }),
    );
  });

  it('lists only active locations for the selected store', async () => {
    const prisma = {
      emplacementMagasin: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(service.list('owner-id', 'store-id')).resolves.toEqual([]);
    expect(prisma.emplacementMagasin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { magasin_id: 'store-id', est_actif: true },
      }),
    );
  });

  it('renames a custom location type only within its store', async () => {
    const renamed = {
      id: 'type-id',
      magasin_id: 'store-id',
      nom: 'Réserve',
      est_actif: true,
    };
    const prisma = {
      typeEmplacementMagasin: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(renamed),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.updateType('owner-id', 'store-id', 'type-id', { nom: 'Réserve' }),
    ).resolves.toEqual(renamed);
    expect(prisma.typeEmplacementMagasin.updateMany).toHaveBeenCalledWith({
      where: { id: 'type-id', magasin_id: 'store-id' },
      data: { nom: 'Réserve' },
    });
  });

  it('attaches a valid custom type when creating a location', async () => {
    const location = { id: 'location-id', type_personnalise_id: 'type-id' };
    const prisma = {
      typeEmplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue({ id: 'type-id' }),
      },
      emplacementMagasin: {
        create: jest.fn().mockResolvedValue(location),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.create('owner-id', 'store-id', {
        nom: 'Étagère',
        type_personnalise_id: 'type-id',
      }),
    ).resolves.toEqual(location);
    expect(prisma.emplacementMagasin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          magasin_id: 'store-id',
          type_personnalise_id: 'type-id',
        }),
      }),
    );
  });

  it('rejects a custom type that is inactive or belongs to another store', async () => {
    const prisma = {
      typeEmplacementMagasin: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      emplacementMagasin: {
        create: jest.fn(),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.create('owner-id', 'store-id', {
        nom: 'Étagère',
        type_personnalise_id: 'type-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.emplacementMagasin.create).not.toHaveBeenCalled();
  });

  it('clears a custom type when changing a location back to a standard type', async () => {
    const location = {
      id: 'location-id',
      type: 'STORE',
      type_personnalise_id: null,
    };
    const prisma = {
      emplacementMagasin: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(location),
      },
    };
    const service = new StoreLocationsService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
    );

    await expect(
      service.update('owner-id', 'store-id', 'location-id', {
        type: TypeEmplacementStock.STORE,
        type_personnalise_id: null,
      }),
    ).resolves.toEqual(location);
    expect(prisma.emplacementMagasin.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { type: 'STORE', type_personnalise_id: null },
      }),
    );
  });
});

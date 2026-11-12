import { BadRequestException, ConflictException } from '@nestjs/common';
import { RoleMembre, StatutAdhesion, StatutMagasin } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { StoresService } from './stores.service';
import { UpdateStoreDto } from './dto/update-store.dto';

describe('StoresService', () => {
  const passwordHasher = {
    hash: jest.fn().mockResolvedValue('hashed-temporary-password'),
  };

  it('rejects attempts to change a store name or address after creation', async () => {
    const input = plainToInstance(UpdateStoreDto, {
      nom: 'Autre nom',
      adresse_ligne_1: 'Nouvelle adresse',
      adresse_ville: 'Sfax',
      description: 'Description modifiable',
    });

    const errors = await validate(input, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['nom', 'adresse_ligne_1', 'adresse_ville']),
    );
    expect(errors.map((error) => error.property)).not.toContain('description');
  });

  it('blocks verification until the official RNE integration is configured', async () => {
    const service = new StoresService(
      {} as PrismaService,
      {} as StoreAuthorizationService,
      {} as never,
      passwordHasher as never,
    );

    await expect(
      service.verifyRegistrationCode('RNE-123456'),
    ).rejects.toThrow(
      'La vérification auprès du RNE tunisien n’est pas encore configurée.',
    );
  });

  it('rejects uploaded image data that does not match its declared type', async () => {
    const authorization = {
      requirePermission: jest.fn().mockResolvedValue({
        role: RoleMembre.PROPRIETAIRE,
      }),
    };
    const service = new StoresService(
      {} as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      {} as never,
      passwordHasher as never,
    );

    await expect(
      service.uploadBrandingImage('owner-id', 'store-id', 'logo', {
        mimetype: 'image/png',
        buffer: Buffer.from('not an image'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(authorization.requirePermission).toHaveBeenCalledWith(
      'owner-id',
      'store-id',
      'shop.update',
    );
  });

  it('lets an owner read their draft store through the management path', async () => {
    const store = { id: 'store-id', nom: 'Optique', slug: 'optique' };
    const prisma = {
      magasin: { findFirst: jest.fn().mockResolvedValue(store) },
    };
    const authorization = {
      requirePermission: jest.fn().mockResolvedValue({
        role: RoleMembre.PROPRIETAIRE,
      }),
    };
    const service = new StoresService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      { record: jest.fn() } as never,
      passwordHasher as never,
    );

    await expect(
      service.findForMember('owner-id', 'store-id'),
    ).resolves.toEqual(store);
    expect(authorization.requirePermission).toHaveBeenCalledWith(
      'owner-id',
      'store-id',
      'shop.view',
    );
    expect(prisma.magasin.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'store-id',
          supprime_le: null,
          statut: { not: StatutMagasin.FERME },
        },
      }),
    );
  });

  it('creates the store and owner membership atomically', async () => {
    const store = { id: 'store-id', nom: 'Optique', slug: 'optique' };
    const tx = {
      magasin: {
        create: jest.fn().mockResolvedValue(store),
        findUniqueOrThrow: jest.fn().mockResolvedValue(store),
      },
      adresse: { create: jest.fn().mockResolvedValue({}) },
      membreMagasin: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const authorization = {} as StoreAuthorizationService;
    const service = new StoresService(
      prisma as unknown as PrismaService,
      authorization,
      { record: jest.fn() } as never,
      passwordHasher as never,
      { verifyRegistrationCode: jest.fn().mockResolvedValue({ verified: true }) } as never,
    );

    await expect(
      service.create('owner-id', {
        nom: 'Optique',
        slug: 'optique',
        code_enregistrement: 'RNE-123456',
        adresse_ligne_1: '10 rue de la République',
        adresse_ville: 'Tunis',
      }),
    ).resolves.toEqual(store);

    expect(tx.magasin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code_enregistrement: 'RNE-123456' }),
      }),
    );
    expect(tx.adresse.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        magasin_id: 'store-id',
        ligne_1: '10 rue de la République',
        ville: 'Tunis',
      }),
    });
    expect(tx.membreMagasin.create).toHaveBeenCalledWith({
      data: {
        magasin_id: 'store-id',
        utilisateur_id: 'owner-id',
        role: RoleMembre.PROPRIETAIRE,
        statut: StatutAdhesion.ACTIVE,
        rejoint_le: expect.any(Date),
      },
    });
  });

  it('creates a shop without an RNE code while verification is bypassed', async () => {
    const store = { id: 'store-id', nom: 'Optique', slug: 'optique' };
    const tx = {
      magasin: {
        create: jest.fn().mockResolvedValue(store),
        findUniqueOrThrow: jest.fn().mockResolvedValue(store),
      },
      adresse: { create: jest.fn().mockResolvedValue({}) },
      membreMagasin: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new StoresService(
      prisma as unknown as PrismaService,
      {} as StoreAuthorizationService,
      { record: jest.fn() } as never,
      passwordHasher as never,
    );

    await expect(
      service.create('owner-id', {
        nom: 'Optique',
        adresse_ligne_1: '10 rue de la République',
        adresse_ville: 'Tunis',
      }),
    ).resolves.toEqual(store);
    expect(tx.magasin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code_enregistrement: undefined,
          slug: expect.stringMatching(/^optique-[a-f0-9]{8}$/),
        }),
      }),
    );
  });

  it('allows an owner to create multiple shops', async () => {
    const first = { id: 'store-1', nom: 'Optique 1', slug: 'optique-1' };
    const second = { id: 'store-2', nom: 'Optique 2', slug: 'optique-2' };
    const tx = {
      magasin: {
        create: jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second),
        findUniqueOrThrow: jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second),
      },
      adresse: { create: jest.fn().mockResolvedValue({}) },
      membreMagasin: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new StoresService(
      prisma as unknown as PrismaService,
      {} as StoreAuthorizationService,
      { record: jest.fn() } as never,
      passwordHasher as never,
      { verifyRegistrationCode: jest.fn().mockResolvedValue({ verified: true }) } as never,
    );
    const shared = {
      code_enregistrement: 'RNE-123456',
      adresse_ligne_1: '10 rue de la République',
      adresse_ville: 'Tunis',
    };

    await expect(
      service.create('owner-id', {
        ...shared,
        nom: 'Optique 1',
        slug: 'optique-1',
      }),
    ).resolves.toEqual(first);
    await expect(
      service.create('owner-id', {
        ...shared,
        nom: 'Optique 2',
        slug: 'optique-2',
        code_enregistrement: 'RNE-654321',
      }),
    ).resolves.toEqual(second);

    expect(tx.magasin.create).toHaveBeenCalledTimes(2);
    expect(tx.membreMagasin.create).toHaveBeenCalledTimes(2);
  });

  it('closes a shop without deleting its database record', async () => {
    const tx = {
      magasin: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'store-id',
          statut: StatutMagasin.ACTIVE,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const authorization = {
      requireMembership: jest.fn().mockResolvedValue({
        role: RoleMembre.PROPRIETAIRE,
      }),
    };
    const service = new StoresService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      { record: jest.fn() } as never,
      passwordHasher as never,
    );

    await expect(
      service.archive('owner-id', 'store-id'),
    ).resolves.toEqual({ success: true });

    expect(tx.magasin.update).toHaveBeenCalledWith({
      where: { id: 'store-id' },
      data: { statut: StatutMagasin.FERME },
    });
    expect(tx.magasin.update.mock.calls[0][0].data).not.toHaveProperty(
      'supprime_le',
    );
  });

  it('prevents removal of the last active owner while holding the store lock', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'store-id' }]),
      membreMagasin: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'owner-membership',
          utilisateur_id: 'owner-id',
          role: RoleMembre.PROPRIETAIRE,
          statut: StatutAdhesion.ACTIVE,
        }),
        count: jest.fn().mockResolvedValue(1),
        delete: jest.fn(),
      },
    };
    const prisma = {
      membreMagasin: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'owner-membership',
          utilisateur_id: 'owner-id',
          role: RoleMembre.PROPRIETAIRE,
        }),
      },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new StoresService(
      prisma as unknown as PrismaService,
      {
        requirePermission: jest.fn().mockResolvedValue({
          role: RoleMembre.PROPRIETAIRE,
        }),
        requireActiveMembership: jest.fn().mockResolvedValue({
          role: RoleMembre.PROPRIETAIRE,
        }),
      } as unknown as StoreAuthorizationService,
      { record: jest.fn() } as never,
      passwordHasher as never,
    );

    await expect(
      service.removeMember('owner-id', 'store-id', 'owner-membership'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.membreMagasin.delete).not.toHaveBeenCalled();
  });

  it('allows an invited user to accept without already being an active member', async () => {
    const tx = {
      membreMagasin: {
        update: jest.fn().mockResolvedValue({
          id: 'member-id',
          role: RoleMembre.EMPLOYE,
          statut: StatutAdhesion.ACTIVE,
          invite_le: new Date('2026-01-01T00:00:00.000Z'),
          rejoint_le: new Date('2026-11-10T00:00:00.000Z'),
        }),
      },
    };
    const prisma = {
      membreMagasin: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'member-id',
          utilisateur_id: 'employee-id',
          role: RoleMembre.EMPLOYE,
          statut: StatutAdhesion.INVITE,
        }),
      },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const authorization = {
      requireActiveMembership: jest.fn(),
    };
    const audit = { record: jest.fn().mockResolvedValue({}) };
    const service = new StoresService(
      prisma as unknown as PrismaService,
      authorization as unknown as StoreAuthorizationService,
      audit as never,
      passwordHasher as never,
    );

    await expect(
      service.updateMember('employee-id', 'store-id', 'member-id', {
        statut: StatutAdhesion.ACTIVE,
      }),
    ).resolves.toMatchObject({ statut: StatutAdhesion.ACTIVE });
    expect(authorization.requireActiveMembership).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: 'employee.status_changed' }),
    );
  });

  it('creates an employee account with custom permissions atomically', async () => {
    const employee = {
      id: 'employee-id',
      prenom: 'Sam',
      nom: 'Optician',
      email: 'employee@example.com',
    };
    const member = {
      id: 'member-id',
      role: RoleMembre.EMPLOYE,
      statut: StatutAdhesion.ACTIVE,
      rejoint_le: new Date('2026-11-10T00:00:00.000Z'),
      utilisateur: employee,
    };
    const tx = {
      utilisateur: { create: jest.fn().mockResolvedValue(employee) },
      membreMagasin: { create: jest.fn().mockResolvedValue(member) },
      permissionMembreMagasin: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const audit = { record: jest.fn().mockResolvedValue({}) };
    const service = new StoresService(
      prisma as unknown as PrismaService,
      {
        requirePermission: jest.fn().mockResolvedValue({
          role: RoleMembre.PROPRIETAIRE,
        }),
        requireActiveMembership: jest.fn().mockResolvedValue({
          role: RoleMembre.PROPRIETAIRE,
        }),
        effectivePermissions: jest.fn().mockReturnValue(new Set()),
      } as unknown as StoreAuthorizationService,
      audit as never,
      passwordHasher as never,
    );

    await expect(
      service.createEmployee('owner-id', 'store-id', {
        prenom: 'Sam',
        nom: 'Optician',
        email: 'employee@example.com',
        temporaryPassword: 'a-secure-temp-password',
        role: RoleMembre.EMPLOYE,
        preset: 'read_only',
        overrides: [
          { code: 'inventory.adjust_stock', allowed: true },
          { code: 'dashboard.view', allowed: false },
        ],
      }),
    ).resolves.toMatchObject({
      id: 'member-id',
      statut: StatutAdhesion.ACTIVE,
    });

    expect(tx.utilisateur.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'employee@example.com',
          empreinte_mot_de_passe: 'hashed-temporary-password',
          doit_changer_mot_de_passe: true,
          statut: 'ACTIVE',
        }),
      }),
    );

    expect(tx.membreMagasin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          permission_preset: 'read_only',
          permissions_modifie_par: 'owner-id',
          permissions_modifie_le: expect.any(Date),
          statut: StatutAdhesion.ACTIVE,
          rejoint_le: expect.any(Date),
        }),
      }),
    );
    expect(tx.permissionMembreMagasin.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          membre_magasin_id: 'member-id',
          code: 'inventory.adjust_stock',
          autorise: true,
          modifie_par: 'owner-id',
        }),
        expect.objectContaining({
          membre_magasin_id: 'member-id',
          code: 'dashboard.view',
          autorise: false,
          modifie_par: 'owner-id',
        }),
      ]),
    });
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'employee.created',
        after: expect.objectContaining({
          permissionOverrides: [
            { code: 'inventory.adjust_stock', allowed: true },
            { code: 'dashboard.view', allowed: false },
          ],
        }),
      }),
    );
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain(
      'a-secure-temp-password',
    );
  });

  it('restricts employee account creation to store owners', async () => {
    const service = new StoresService(
      {} as PrismaService,
      {
        requirePermission: jest.fn().mockResolvedValue({
          role: RoleMembre.GERANT,
        }),
        requireActiveMembership: jest.fn().mockResolvedValue({
          role: RoleMembre.GERANT,
        }),
      } as unknown as StoreAuthorizationService,
      { record: jest.fn() } as never,
      passwordHasher as never,
    );

    await expect(
      service.createEmployee('manager-id', 'store-id', {
        prenom: 'Sam',
        nom: 'Optician',
        email: 'employee@example.com',
        temporaryPassword: 'a-secure-temp-password',
        role: RoleMembre.EMPLOYE,
        preset: 'read_only',
        overrides: [],
      }),
    ).rejects.toThrow('Only the store owner can create employee accounts');
  });

  it('rejects whitespace-only employee names and temporary passwords', async () => {
    const service = new StoresService(
      {} as PrismaService,
      {
        requirePermission: jest.fn().mockResolvedValue({
          role: RoleMembre.PROPRIETAIRE,
        }),
      } as unknown as StoreAuthorizationService,
      { record: jest.fn() } as never,
      passwordHasher as never,
    );

    await expect(
      service.createEmployee('owner-id', 'store-id', {
        prenom: ' ',
        nom: 'Optician',
        email: 'employee@example.com',
        temporaryPassword: 'a-secure-temp-password',
        role: RoleMembre.EMPLOYE,
        preset: 'read_only',
        overrides: [],
      }),
    ).rejects.toThrow('Employee name is required');

    await expect(
      service.createEmployee('owner-id', 'store-id', {
        prenom: 'Sam',
        nom: 'Optician',
        email: 'employee@example.com',
        temporaryPassword: '            ',
        role: RoleMembre.EMPLOYE,
        preset: 'read_only',
        overrides: [],
      }),
    ).rejects.toThrow(
      'Temporary password must be at least 12 characters',
    );
  });
});

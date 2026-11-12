import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RoleMembre,
  StatutAdhesion,
  StatutMagasin,
  StatutUtilisateur,
  TypeAdresse,
} from '@prisma/client';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname, resolve } from 'node:path';
import { PasswordHasher } from '../auth/password-hasher.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import {
  isStorePermissionCode,
  isStorePermissionPreset,
  resolveStorePermissions,
} from '../common/guards/store-permissions';
import { CreateStoreDto } from './dto/create-store.dto';
import { CreateStoreMemberDto } from './dto/create-store-member.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreMemberDto } from './dto/update-store-member.dto';
import { RneVerificationService } from './rne-verification.service';

const publicStoreSelect = {
  id: true,
  nom: true,
  slug: true,
  description: true,
  url_logo: true,
  url_image_couverture: true,
  email: true,
  telephone: true,
  url_site_web: true,
  fuseau_horaire: true,
  devise: true,
} satisfies Prisma.MagasinSelect;

const managedStoreSelect = {
  ...publicStoreSelect,
  code_enregistrement: true,
  adresses: {
    where: { type: TypeAdresse.STORE },
    take: 1,
    select: {
      ligne_1: true,
      ville: true,
      region: true,
      code_postal: true,
    },
  },
} satisfies Prisma.MagasinSelect;

export interface StoreImageFile {
  buffer: Buffer;
  mimetype: string;
}

function hasValidImageSignature(file: StoreImageFile) {
  const { buffer, mimetype } = file;
  switch (mimetype) {
    case 'image/png':
      return buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
    case 'image/jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/webp':
      return (
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      );
    case 'image/avif': {
      const brand = buffer.toString('ascii', 8, 12);
      return (
        buffer.length >= 12 &&
        buffer.toString('ascii', 4, 8) === 'ftyp' &&
        (brand === 'avif' || brand === 'avis')
      );
    }
    default:
      return false;
  }
}

@Injectable()
export class StoresService {
  private readonly brandingDirectory = resolve(
    process.cwd(),
    'uploads',
    'store-branding',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
    private readonly audit: AuditService,
    private readonly passwordHasher: PasswordHasher,
    private readonly rneVerification: RneVerificationService =
      new RneVerificationService(),
  ) {}

  async list(pagination: PaginationDto) {
    const where: Prisma.MagasinWhereInput = {
      statut: StatutMagasin.ACTIVE,
      supprime_le: null,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.magasin.findMany({
        where,
        select: publicStoreSelect,
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.magasin.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async create(userId: string, input: CreateStoreDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const store = await tx.magasin.create({
          data: {
            nom: input.nom,
            slug: input.slug ?? this.generateStoreSlug(input.nom),
            code_enregistrement: input.code_enregistrement,
            description: input.description,
            email: input.email,
            telephone: input.telephone,
            url_site_web: input.url_site_web,
            url_logo: input.url_logo,
            url_image_couverture: input.url_image_couverture,
            fuseau_horaire: input.fuseau_horaire,
            devise: input.devise,
          },
          select: managedStoreSelect,
        });
        await tx.adresse.create({
          data: {
            magasin_id: store.id,
            type: TypeAdresse.STORE,
            ligne_1: input.adresse_ligne_1,
            ville: input.adresse_ville,
            region: input.adresse_region,
            code_postal: input.adresse_code_postal,
          },
        });
        await tx.membreMagasin.create({
          data: {
            magasin_id: store.id,
            utilisateur_id: userId,
            role: RoleMembre.PROPRIETAIRE,
            statut: StatutAdhesion.ACTIVE,
            rejoint_le: new Date(),
          },
        });
        await this.audit.record(tx, {
          storeId: store.id,
          actorId: userId,
          action: 'store.created',
          entityType: 'store',
          entityId: store.id,
          description: 'Store created',
          after: {
            name: store.nom,
            slug: store.slug,
            status: 'DRAFT',
          },
        });
        return tx.magasin.findUniqueOrThrow({
          where: { id: store.id },
          select: managedStoreSelect,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target;
        if (
          Array.isArray(target) &&
          target.some((field) => String(field).includes('registration_code'))
        ) {
          throw new ConflictException('Ce code RNE est déjà associé à une boutique.');
        }
        throw new ConflictException(
          'Le code RNE ou l’adresse de boutique est déjà associé à une boutique.',
        );
      }
      throw error;
    }
  }

  verifyRegistrationCode(code: string) {
    return this.rneVerification.verifyRegistrationCode(code);
  }

  private generateStoreSlug(name: string): string {
    const base = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 150) || 'boutique';
    return `${base}-${randomUUID().replace(/-/g, '').slice(0, 8)}`;
  }

  async find(storeId: string) {
    const store = await this.prisma.magasin.findFirst({
      where: {
        id: storeId,
        supprime_le: null,
        statut: StatutMagasin.ACTIVE,
      },
      select: publicStoreSelect,
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async findForMember(userId: string, storeId: string) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'shop.view',
    );
    const store = await this.prisma.magasin.findFirst({
      where: {
        id: storeId,
        supprime_le: null,
        statut: { not: StatutMagasin.FERME },
      },
      select: managedStoreSelect,
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async update(userId: string, storeId: string, input: UpdateStoreDto) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'shop.update',
    );
    try {
      return await this.prisma.$transaction(async (tx) => {
        const before = await tx.magasin.findFirst({
          where: {
            id: storeId,
            supprime_le: null,
            statut: { not: StatutMagasin.FERME },
          },
          select: publicStoreSelect,
        });
        if (!before) throw new NotFoundException('Store not found');
        const updated = await tx.magasin.update({
          where: { id: storeId },
          data: input,
          select: publicStoreSelect,
        });
        const changedFields = Object.keys(input).filter(
          (field) =>
            before[field as keyof typeof before] !==
            updated[field as keyof typeof updated],
        );
        if (changedFields.length > 0) {
          await this.audit.record(tx, {
            storeId,
            actorId: userId,
            action: 'store.profile_updated',
            entityType: 'store',
            entityId: storeId,
            description: 'Store information updated',
            before: Object.fromEntries(
              changedFields.map((field) => [
                field,
                before[field as keyof typeof before],
              ]),
            ) as Prisma.InputJsonValue,
            after: Object.fromEntries(
              changedFields.map((field) => [
                field,
                updated[field as keyof typeof updated],
              ]),
            ) as Prisma.InputJsonValue,
          });
        }
        return updated;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Store not found');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Store slug is already in use');
      }
      throw error;
    }
  }

  async uploadBrandingImage(
    userId: string,
    storeId: string,
    imageType: string,
    file: StoreImageFile,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'shop.update',
    );
    if (imageType !== 'logo' && imageType !== 'cover') {
      throw new BadRequestException('Image type must be logo or cover');
    }

    const extensions: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/avif': '.avif',
    };
    const extension = extensions[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Unsupported image type');
    }
    if (!file.buffer.length || !hasValidImageSignature(file)) {
      throw new BadRequestException('Image contents do not match the file type');
    }

    const filename = `${randomUUID().replace(/-/g, '')}${extension}`;
    const storeDirectory = resolve(this.brandingDirectory, storeId);
    await mkdir(storeDirectory, { recursive: true });
    await writeFile(resolve(storeDirectory, filename), file.buffer, {
      flag: 'wx',
    });

    return { url: `/api/v1/stores/${storeId}/branding/${filename}` };
  }

  getBrandingImage(storeId: string, filename: string) {
    if (!/^[a-f0-9]{32}\.(?:png|jpe?g|webp|avif)$/i.test(filename)) {
      throw new NotFoundException('Store image not found');
    }
    const filePath = resolve(this.brandingDirectory, storeId, filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Store image not found');
    }
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
    };
    return {
      stream: createReadStream(filePath),
      contentType: contentTypes[extname(filename).toLowerCase()],
    };
  }

  async archive(userId: string, storeId: string) {
    await this.storeAuthorization.requireMembership(userId, storeId, [
      RoleMembre.PROPRIETAIRE,
    ]);
    try {
      await this.prisma.$transaction(async (tx) => {
        const store = await tx.magasin.findFirst({
          where: {
            id: storeId,
            supprime_le: null,
            statut: { not: StatutMagasin.FERME },
          },
          select: { id: true, statut: true },
        });
        if (!store) throw new NotFoundException('Store not found');
        await tx.magasin.update({
          where: { id: storeId },
          data: { statut: StatutMagasin.FERME },
        });
        await this.audit.record(tx, {
          storeId,
          actorId: userId,
          action: 'store.archived',
          entityType: 'store',
          entityId: storeId,
          description: 'Store archived',
          before: { status: store.statut },
          after: { status: StatutMagasin.FERME },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Store not found');
      }
      throw error;
    }
    return { success: true };
  }

  async listMembers(
    userId: string,
    storeId: string,
    pagination: PaginationDto,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'employees.view',
    );
    const where = { magasin_id: storeId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.membreMagasin.findMany({
        where,
        select: {
          id: true,
          role: true,
          statut: true,
          permission_preset: true,
          permissions_modifie_le: true,
          permissions_modifie_par: true,
          invite_le: true,
          rejoint_le: true,
          utilisateur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              nom_utilisateur: true,
              url_image_profil: true,
            },
          },
        },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.membreMagasin.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async createEmployee(
    actorId: string,
    storeId: string,
    input: CreateStoreMemberDto,
  ) {
    const actor = await this.storeAuthorization.requirePermission(
      actorId,
      storeId,
      'employees.create',
    );
    if (actor.role !== RoleMembre.PROPRIETAIRE) {
      throw new ForbiddenException(
        'Only the store owner can create employee accounts',
      );
    }
    const preset = input.preset ?? 'read_only';
    if (!isStorePermissionPreset(preset)) {
      throw new BadRequestException('Unknown permission preset');
    }
    const overrides = input.overrides ?? [];
    const seenPermissions = new Set<string>();
    for (const override of overrides) {
      if (!isStorePermissionCode(override.code)) {
        throw new BadRequestException(`Unknown permission: ${override.code}`);
      }
      if (seenPermissions.has(override.code)) {
        throw new BadRequestException(
          `Duplicate permission override: ${override.code}`,
        );
      }
      seenPermissions.add(override.code);
    }
    const effectivePermissions = resolveStorePermissions(
      input.role,
      preset,
      overrides,
    );
    const prenom = input.prenom.trim();
    const nom = input.nom.trim();
    const temporaryPassword = input.temporaryPassword.trim();
    if (!prenom || !nom) {
      throw new BadRequestException('Employee name is required');
    }
    if (temporaryPassword.length < 12) {
      throw new BadRequestException(
        'Temporary password must be at least 12 characters',
      );
    }
    const passwordHash = await this.passwordHasher.hash(
      temporaryPassword,
    );
    const now = new Date();
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.utilisateur.create({
          data: {
            prenom,
            nom,
            email: input.email.trim().toLowerCase(),
            empreinte_mot_de_passe: passwordHash,
            doit_changer_mot_de_passe: true,
            statut: StatutUtilisateur.ACTIVE,
          },
          select: { id: true, prenom: true, nom: true, email: true },
        });
        const member = await tx.membreMagasin.create({
          data: {
            magasin_id: storeId,
            utilisateur_id: user.id,
            role: input.role,
            statut: StatutAdhesion.ACTIVE,
            rejoint_le: now,
            permission_preset: preset,
            permissions_modifie_le: now,
            permissions_modifie_par: actorId,
          },
          select: {
            id: true,
            role: true,
            statut: true,
            rejoint_le: true,
            utilisateur: {
              select: { id: true, prenom: true, nom: true, email: true },
            },
          },
        });
        if (overrides.length) {
          await tx.permissionMembreMagasin.createMany({
            data: overrides.map(({ code, allowed }) => ({
              membre_magasin_id: member.id,
              code,
              autorise: allowed,
              modifie_par: actorId,
              cree_le: now,
              modifie_le: now,
            })),
          });
        }
        await this.audit.record(tx, {
          storeId,
          actorId,
          action: 'employee.created',
          entityType: 'store_membership',
          entityId: member.id,
          description: 'Employee account created for the store',
          after: {
            role: member.role,
            status: member.statut,
            userId: user.id,
            email: user.email,
            permissionPreset: preset,
            permissionOverrides: overrides.map(({ code, allowed }) => ({
              code,
              allowed,
            })),
            effectivePermissions: [...effectivePermissions],
          },
        });
        return member;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account already exists for that email');
      }
      throw error;
    }
  }

  async updateMember(
    actorId: string,
    storeId: string,
    memberId: string,
    input: UpdateStoreMemberDto,
  ) {
    const member = await this.prisma.membreMagasin.findFirst({
      where: { id: memberId, magasin_id: storeId },
      select: { id: true, utilisateur_id: true, role: true, statut: true },
    });
    if (!member) {
      throw new NotFoundException('Store membership not found');
    }

    const isSelfAcceptingInvite =
      member.utilisateur_id === actorId &&
      member.statut === StatutAdhesion.INVITE &&
      input.statut === StatutAdhesion.ACTIVE &&
      input.role === undefined;
    if (member.utilisateur_id === actorId && !isSelfAcceptingInvite) {
      throw new ForbiddenException(
        'You cannot change your own store membership',
      );
    }
    const actor = isSelfAcceptingInvite
      ? null
      : await this.storeAuthorization.requireActiveMembership(actorId, storeId);
    if (!isSelfAcceptingInvite) {
      if (actor?.role !== RoleMembre.PROPRIETAIRE) {
        await this.storeAuthorization.requirePermission(
          actorId,
          storeId,
          'employees.update',
        );
      }
      if (
        actor?.role !== RoleMembre.PROPRIETAIRE &&
        member.role === RoleMembre.GERANT
      ) {
        throw new ForbiddenException(
          'Only the store owner can change a manager membership',
        );
      }
      if (member.role === RoleMembre.PROPRIETAIRE) {
        throw new ForbiddenException('Owner membership cannot be changed here');
      }
      if (input.role === RoleMembre.PROPRIETAIRE) {
        throw new ForbiddenException(
          'Use an explicit ownership transfer operation',
        );
      }
      if (
        input.role === RoleMembre.GERANT &&
        actor?.role !== RoleMembre.PROPRIETAIRE
      ) {
        throw new ForbiddenException(
          'Only the store owner can assign the manager role',
        );
      }
    }

    const data: Prisma.MembreMagasinUpdateInput = {};
    if (input.role !== undefined) data.role = input.role;
    if (input.statut !== undefined) {
      data.statut = input.statut;
      if (input.statut === StatutAdhesion.ACTIVE) data.rejoint_le = new Date();
    }
    if (Object.keys(data).length === 0) {
      throw new ConflictException('At least one membership field is required');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.membreMagasin.update({
        where: { id: memberId },
        data,
        select: {
          id: true,
          role: true,
          statut: true,
          invite_le: true,
          rejoint_le: true,
        },
      });
      await this.audit.record(tx, {
        storeId,
        actorId,
        action: input.role
          ? 'employee.role_changed'
          : 'employee.status_changed',
        entityType: 'store_membership',
        entityId: memberId,
        description: 'Store employee membership changed',
        before: { role: member.role, status: member.statut },
        after: { role: updated.role, status: updated.statut },
      });
      return updated;
    });
  }

  async removeMember(actorId: string, storeId: string, memberId: string) {
    const actorMembership =
      await this.storeAuthorization.requireActiveMembership(actorId, storeId);
    const member = await this.prisma.membreMagasin.findFirst({
      where: { id: memberId, magasin_id: storeId },
      select: { id: true, utilisateur_id: true, role: true },
    });
    if (!member) {
      throw new NotFoundException('Store membership not found');
    }
    if (
      member.utilisateur_id !== actorId &&
      actorMembership.role !== RoleMembre.PROPRIETAIRE
    ) {
      await this.storeAuthorization.requirePermission(
        actorId,
        storeId,
        'employees.remove',
      );
    }
    if (
      member.utilisateur_id !== actorId &&
      member.role === RoleMembre.GERANT &&
      actorMembership.role !== RoleMembre.PROPRIETAIRE
    ) {
      throw new ForbiddenException('Only the store owner can remove a manager');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "magasins" WHERE "id" = ${storeId}::uuid FOR UPDATE`;
      const currentMember = await tx.membreMagasin.findFirst({
        where: { id: memberId, magasin_id: storeId },
        select: { id: true, utilisateur_id: true, role: true, statut: true },
      });
      if (!currentMember)
        throw new NotFoundException('Store membership not found');
      if (
        currentMember.role === RoleMembre.PROPRIETAIRE &&
        currentMember.statut === StatutAdhesion.ACTIVE
      ) {
        const ownerCount = await tx.membreMagasin.count({
          where: {
            magasin_id: storeId,
            role: RoleMembre.PROPRIETAIRE,
            statut: StatutAdhesion.ACTIVE,
          },
        });
        if (ownerCount <= 1) {
          throw new ConflictException('The store must retain an active owner');
        }
      }
      await tx.membreMagasin.delete({ where: { id: memberId } });
      await this.audit.record(tx, {
        storeId,
        actorId,
        action: 'employee.removed',
        entityType: 'store_membership',
        entityId: memberId,
        description: 'Employee removed from the store',
        before: {
          userId: currentMember.utilisateur_id,
          role: currentMember.role,
        },
      });
      return { success: true };
    });
  }
}

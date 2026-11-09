import {
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
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { CreateStoreMemberDto } from './dto/create-store-member.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreMemberDto } from './dto/update-store-member.dto';

const publicStoreSelect = {
  id: true,
  nom: true,
  slug: true,
  description: true,
  url_logo: true,
  url_image_couverture: true,
  telephone: true,
  url_site_web: true,
  fuseau_horaire: true,
  devise: true,
} satisfies Prisma.MagasinSelect;

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
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
            slug: input.slug,
            description: input.description,
            email: input.email,
            telephone: input.telephone,
            url_site_web: input.url_site_web,
          },
          select: publicStoreSelect,
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
        return store;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Store slug is already in use');
      }
      throw error;
    }
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

  async update(
    userId: string,
    storeId: string,
    input: UpdateStoreDto,
  ) {
    await this.storeAuthorization.requireMembership(userId, storeId, [
      RoleMembre.PROPRIETAIRE,
      RoleMembre.GERANT,
    ]);
    try {
      return await this.prisma.magasin.update({
        where: { id: storeId, supprime_le: null },
        data: input,
        select: publicStoreSelect,
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

  async archive(userId: string, storeId: string) {
    await this.storeAuthorization.requireMembership(userId, storeId, [
      RoleMembre.PROPRIETAIRE,
    ]);
    try {
      await this.prisma.magasin.update({
        where: { id: storeId },
        data: { supprime_le: new Date(), statut: StatutMagasin.FERME },
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

  async listMembers(userId: string, storeId: string, pagination: PaginationDto) {
    await this.storeAuthorization.requireMembership(userId, storeId, [
      RoleMembre.PROPRIETAIRE,
      RoleMembre.GERANT,
    ]);
    const where = { magasin_id: storeId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.membreMagasin.findMany({
        where,
        select: {
          id: true,
          role: true,
          statut: true,
          invite_le: true,
          rejoint_le: true,
          utilisateur: {
            select: {
              id: true,
              prenom: true,
              nom: true,
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

  async inviteMember(
    actorId: string,
    storeId: string,
    input: CreateStoreMemberDto,
  ) {
    const actor = await this.storeAuthorization.requireMembership(actorId, storeId, [
      RoleMembre.PROPRIETAIRE,
      RoleMembre.GERANT,
    ]);
    if (
      input.role === RoleMembre.PROPRIETAIRE ||
      (input.role === RoleMembre.GERANT && actor.role !== RoleMembre.PROPRIETAIRE)
    ) {
      throw new ForbiddenException('You cannot invite a member with that role');
    }

    const user = await this.prisma.utilisateur.findFirst({
      where: { email: input.email.toLowerCase(), supprime_le: null },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User must register before being invited');
    }
    try {
      return await this.prisma.membreMagasin.create({
        data: {
          magasin_id: storeId,
          utilisateur_id: user.id,
          role: input.role,
          statut: StatutAdhesion.INVITE,
          invite_le: new Date(),
        },
        select: {
          id: true,
          role: true,
          statut: true,
          invite_le: true,
          utilisateur: { select: { id: true, prenom: true, nom: true, email: true } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already belongs to this store');
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
    const actor = await this.storeAuthorization.requireMembership(actorId, storeId, [
      RoleMembre.PROPRIETAIRE,
      RoleMembre.GERANT,
    ]);
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
    if (!isSelfAcceptingInvite) {
      if (actor.role !== RoleMembre.PROPRIETAIRE) {
        throw new ForbiddenException('Only the store owner can change membership');
      }
      if (member.role === RoleMembre.PROPRIETAIRE) {
        throw new ForbiddenException('Owner membership cannot be changed here');
      }
      if (input.role === RoleMembre.PROPRIETAIRE) {
        throw new ForbiddenException('Use an explicit ownership transfer operation');
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
    return this.prisma.membreMagasin.update({
      where: { id: memberId },
      data,
      select: { id: true, role: true, statut: true, invite_le: true, rejoint_le: true },
    });
  }

  async removeMember(actorId: string, storeId: string, memberId: string) {
    const actorMembership = await this.prisma.membreMagasin.findFirst({
      where: {
        utilisateur_id: actorId,
        magasin_id: storeId,
        statut: StatutAdhesion.ACTIVE,
      },
      select: { role: true },
    });
    if (!actorMembership) {
      throw new ForbiddenException('Active store membership is required');
    }
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
      throw new ForbiddenException('Only the store owner can remove other members');
    }
    if (member.role === RoleMembre.PROPRIETAIRE) {
      const ownerCount = await this.prisma.membreMagasin.count({
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
    await this.prisma.membreMagasin.delete({ where: { id: memberId } });
    return { success: true };
  }
}

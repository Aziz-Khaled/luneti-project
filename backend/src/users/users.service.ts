import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

const publicUserSelect = {
  id: true,
  prenom: true,
  nom: true,
  nom_utilisateur: true,
  url_image_profil: true,
  cree_le: true,
} satisfies Prisma.UtilisateurSelect;

const privateUserSelect = {
  ...publicUserSelect,
  email: true,
  telephone: true,
  statut: true,
  langue_preferee: true,
  email_verifie_le: true,
  cree_le: true,
  modifie_le: true,
} satisfies Prisma.UtilisateurSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(pagination: PaginationDto) {
    const where: Prisma.UtilisateurWhereInput = {
      statut: 'ACTIVE',
      supprime_le: null,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.utilisateur.findMany({
        where,
        select: publicUserSelect,
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.utilisateur.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async findPublic(id: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id, statut: 'ACTIVE', supprime_le: null },
      select: publicUserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findMe(id: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id, supprime_le: null },
      select: privateUserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateMe(id: string, input: UpdateUserProfileDto) {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one profile field is required');
    }
    try {
      await this.prisma.utilisateur.updateMany({
        where: { id, supprime_le: null },
        data: input,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username is already in use');
      }
      throw error;
    }
    return this.findMe(id);
  }

  async deactivate(id: string) {
    const result = await this.prisma.utilisateur.updateMany({
      where: { id, supprime_le: null },
      data: { supprime_le: new Date(), statut: 'DESACTIVE' },
    });
    if (result.count === 0) {
      throw new NotFoundException('User not found');
    }
    return { success: true };
  }

  async followers(id: string, pagination: PaginationDto) {
    await this.findPublic(id);
    const where = { suivi_id: id };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.abonnementUtilisateur.findMany({
        where,
        select: { abonne: { select: publicUserSelect } },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.abonnementUtilisateur.count({ where }),
    ]);
    return paginated(
      items.map((item) => item.abonne),
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async following(id: string, pagination: PaginationDto) {
    await this.findPublic(id);
    const where = { abonne_id: id };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.abonnementUtilisateur.findMany({
        where,
        select: { suivi: { select: publicUserSelect } },
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.abonnementUtilisateur.count({ where }),
    ]);
    return paginated(
      items.map((item) => item.suivi),
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async follow(followerId: string, followedId: string) {
    if (followerId === followedId) {
      throw new BadRequestException('Users cannot follow themselves');
    }
    await this.findPublic(followedId);
    try {
      return await this.prisma.abonnementUtilisateur.create({
        data: { abonne_id: followerId, suivi_id: followedId },
        select: { id: true, abonne_id: true, suivi_id: true, cree_le: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Already following this user');
      }
      throw error;
    }
  }

  async unfollow(followerId: string, followedId: string) {
    const result = await this.prisma.abonnementUtilisateur.deleteMany({
      where: { abonne_id: followerId, suivi_id: followedId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Follow relationship not found');
    }
    return { success: true };
  }
}

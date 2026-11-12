import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RoleMembre,
  StatutMagasin,
  VisibilitePublication,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';

const postSelect = {
  id: true,
  auteur_id: true,
  magasin_id: true,
  legende: true,
  visibilite: true,
  publie_le: true,
  cree_le: true,
  auteur: { select: { id: true, prenom: true, nom: true, nom_utilisateur: true } },
  magasin: { select: { id: true, nom: true, slug: true } },
  medias: {
    select: { id: true, type: true, position: true },
    orderBy: { position: 'asc' },
  },
  _count: { select: { commentaires: true, mentions_j_aime: true, partages: true } },
} satisfies Prisma.PublicationSelect;

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async feed(pagination: PaginationDto) {
    const where: Prisma.PublicationWhereInput = {
      est_publie: true,
      supprime_le: null,
      visibilite: VisibilitePublication.PUBLIC,
      OR: [
        { magasin: { is: null } },
        { magasin: { statut: StatutMagasin.ACTIVE, supprime_le: null } },
      ],
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.publication.findMany({
        where,
        select: postSelect,
        orderBy: [{ publie_le: 'desc' }, { cree_le: 'desc' }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.publication.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async myPosts(userId: string, pagination: PaginationDto) {
    const where = { auteur_id: userId, supprime_le: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.publication.findMany({
        where,
        select: postSelect,
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.publication.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async createPost(userId: string, input: CreatePublicationDto) {
    if (input.magasin_id) {
      await this.requireStorePostingPermission(userId, input.magasin_id);
    }
    return this.prisma.publication.create({
      data: {
        auteur_id: userId,
        magasin_id: input.magasin_id,
        legende: input.legende,
        visibilite: input.visibilite ?? VisibilitePublication.PUBLIC,
        est_publie: true,
        publie_le: new Date(),
      },
      select: postSelect,
    });
  }

  async updatePost(userId: string, postId: string, input: UpdatePublicationDto) {
    const result = await this.prisma.publication.updateMany({
      where: { id: postId, auteur_id: userId, supprime_le: null },
      data: {
        ...(input.legende !== undefined ? { legende: input.legende } : {}),
        ...(input.visibilite !== undefined
          ? { visibilite: input.visibilite }
          : {}),
      },
    });
    if (!result.count) throw new NotFoundException('Publication not found');
    return this.prisma.publication.findUniqueOrThrow({
      where: { id: postId },
      select: postSelect,
    });
  }

  async deletePost(userId: string, postId: string) {
    const result = await this.prisma.publication.updateMany({
      where: { id: postId, auteur_id: userId, supprime_le: null },
      data: { supprime_le: new Date(), est_publie: false },
    });
    if (!result.count) throw new NotFoundException('Publication not found');
    return { success: true };
  }

  async comments(postId: string, pagination: PaginationDto) {
    await this.requirePublicPost(postId);
    const where = { publication_id: postId, supprime_le: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.commentairePublication.findMany({
        where,
        select: {
          id: true,
          parent_id: true,
          contenu: true,
          cree_le: true,
          utilisateur: {
            select: { id: true, prenom: true, nom: true, nom_utilisateur: true },
          },
        },
        orderBy: { cree_le: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.commentairePublication.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async addComment(userId: string, postId: string, input: CreateCommentDto) {
    await this.requirePublicPost(postId);
    if (input.parent_id) {
      const parent = await this.prisma.commentairePublication.findFirst({
        where: {
          id: input.parent_id,
          publication_id: postId,
          supprime_le: null,
        },
        select: { id: true },
      });
      if (!parent) throw new NotFoundException('Parent comment not found');
    }
    return this.prisma.commentairePublication.create({
      data: {
        publication_id: postId,
        utilisateur_id: userId,
        parent_id: input.parent_id,
        contenu: input.contenu,
      },
      select: { id: true, publication_id: true, parent_id: true, contenu: true, cree_le: true },
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const result = await this.prisma.commentairePublication.updateMany({
      where: { id: commentId, utilisateur_id: userId, supprime_le: null },
      data: { supprime_le: new Date(), contenu: '[deleted]' },
    });
    if (!result.count) throw new NotFoundException('Comment not found');
    return { success: true };
  }

  async like(userId: string, postId: string) {
    await this.requirePublicPost(postId);
    try {
      return await this.prisma.aimePublication.create({
        data: { publication_id: postId, utilisateur_id: userId },
        select: { id: true, publication_id: true, cree_le: true },
      });
    } catch (error) {
      if (isUniqueConflict(error)) throw new ConflictException('Publication already liked');
      throw error;
    }
  }

  async unlike(userId: string, postId: string) {
    const result = await this.prisma.aimePublication.deleteMany({
      where: { publication_id: postId, utilisateur_id: userId },
    });
    if (!result.count) throw new NotFoundException('Like not found');
    return { success: true };
  }

  async repost(userId: string, postId: string, input: CreateShareDto) {
    await this.requirePublicPost(postId);
    try {
      return await this.prisma.partagePublication.create({
        data: {
          publication_id: postId,
          utilisateur_id: userId,
          legende: input.legende,
        },
        select: { id: true, publication_id: true, legende: true, cree_le: true },
      });
    } catch (error) {
      if (isUniqueConflict(error)) throw new ConflictException('Publication already reposted');
      throw error;
    }
  }

  async unrepost(userId: string, postId: string) {
    const result = await this.prisma.partagePublication.deleteMany({
      where: { publication_id: postId, utilisateur_id: userId },
    });
    if (!result.count) throw new NotFoundException('Repost not found');
    return { success: true };
  }

  async followStore(userId: string, storeId: string) {
    const store = await this.prisma.magasin.findFirst({
      where: { id: storeId, statut: StatutMagasin.ACTIVE, supprime_le: null },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Active store not found');
    try {
      return await this.prisma.abonnementMagasin.create({
        data: { utilisateur_id: userId, magasin_id: storeId },
        select: { id: true, magasin_id: true, cree_le: true },
      });
    } catch (error) {
      if (isUniqueConflict(error)) throw new ConflictException('Already following this store');
      throw error;
    }
  }

  async unfollowStore(userId: string, storeId: string) {
    const result = await this.prisma.abonnementMagasin.deleteMany({
      where: { utilisateur_id: userId, magasin_id: storeId },
    });
    if (!result.count) throw new NotFoundException('Store follow not found');
    return { success: true };
  }

  private async requirePublicPost(postId: string) {
    const post = await this.prisma.publication.findFirst({
      where: {
        id: postId,
        est_publie: true,
        supprime_le: null,
        visibilite: VisibilitePublication.PUBLIC,
        OR: [
          { magasin: { is: null } },
          { magasin: { statut: StatutMagasin.ACTIVE, supprime_le: null } },
        ],
      },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Public publication not found');
  }

  private async requireStorePostingPermission(userId: string, storeId: string) {
    const membership = await this.prisma.membreMagasin.findFirst({
      where: {
        utilisateur_id: userId,
        magasin_id: storeId,
        statut: 'ACTIVE',
        role: {
          in: [RoleMembre.PROPRIETAIRE, RoleMembre.GERANT, RoleMembre.OPTICIEN],
        },
      },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException('Store publishing permission is required');
  }
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

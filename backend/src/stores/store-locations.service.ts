import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleMembre } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { CreateStoreLocationDto } from './dto/create-store-location.dto';
import { UpdateStoreLocationDto } from './dto/update-store-location.dto';

const locationSelect = {
  id: true,
  magasin_id: true,
  nom: true,
  code: true,
  type: true,
  est_par_defaut: true,
  est_actif: true,
} satisfies Prisma.EmplacementMagasinSelect;

@Injectable()
export class StoreLocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
  ) {}

  async list(userId: string, storeId: string) {
    await this.authorize(userId, storeId);
    return this.prisma.emplacementMagasin.findMany({
      where: { magasin_id: storeId },
      select: locationSelect,
      orderBy: [{ est_par_defaut: 'desc' }, { nom: 'asc' }],
    });
  }

  async create(userId: string, storeId: string, input: CreateStoreLocationDto) {
    await this.authorize(userId, storeId);
    try {
      if (input.est_par_defaut) {
        return await this.prisma.$transaction(async (tx) => {
          await tx.emplacementMagasin.updateMany({
            where: { magasin_id: storeId, est_par_defaut: true },
            data: { est_par_defaut: false },
          });
          return tx.emplacementMagasin.create({
            data: {
              magasin_id: storeId,
              nom: input.nom,
              ...(input.code !== undefined ? { code: input.code } : {}),
              ...(input.type !== undefined ? { type: input.type } : {}),
              ...(input.est_par_defaut !== undefined
                ? { est_par_defaut: input.est_par_defaut }
                : {}),
            },
            select: locationSelect,
          });
        });
      }
      return await this.prisma.emplacementMagasin.create({
        data: {
          magasin_id: storeId,
          nom: input.nom,
          ...(input.code !== undefined ? { code: input.code } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.est_par_defaut !== undefined
            ? { est_par_defaut: input.est_par_defaut }
            : {}),
        },
        select: locationSelect,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Location code is already used in this store');
      }
      throw error;
    }
  }

  async update(
    userId: string,
    storeId: string,
    locationId: string,
    input: UpdateStoreLocationDto,
  ) {
    await this.authorize(userId, storeId);
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one location field is required');
    }
    const data: Prisma.EmplacementMagasinUpdateManyMutationInput = {
      ...(input.nom !== undefined ? { nom: input.nom } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.est_par_defaut !== undefined
        ? { est_par_defaut: input.est_par_defaut }
        : {}),
      ...(input.est_actif !== undefined ? { est_actif: input.est_actif } : {}),
    };

    try {
      if (input.est_par_defaut) {
        return await this.prisma.$transaction(async (tx) => {
          const current = await tx.emplacementMagasin.findFirst({
            where: { id: locationId, magasin_id: storeId },
            select: { id: true },
          });
          if (!current) {
            throw new NotFoundException('Store location not found');
          }
          await tx.emplacementMagasin.updateMany({
            where: { magasin_id: storeId, est_par_defaut: true },
            data: { est_par_defaut: false },
          });
          return tx.emplacementMagasin.update({
            where: { id: locationId },
            data,
            select: locationSelect,
          });
        });
      }

      const updated = await this.prisma.emplacementMagasin.updateMany({
        where: { id: locationId, magasin_id: storeId },
        data,
      });
      if (updated.count === 0) {
        throw new NotFoundException('Store location not found');
      }
      return this.prisma.emplacementMagasin.findUniqueOrThrow({
        where: { id: locationId },
        select: locationSelect,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Location code is already used in this store');
      }
      throw error;
    }
  }

  private authorize(userId: string, storeId: string) {
    return this.storeAuthorization.requireMembership(userId, storeId, [
      RoleMembre.PROPRIETAIRE,
      RoleMembre.GERANT,
    ]);
  }
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

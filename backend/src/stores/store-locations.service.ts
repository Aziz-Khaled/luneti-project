import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { CreateStoreLocationDto } from './dto/create-store-location.dto';
import { CreateStoreLocationTypeDto } from './dto/create-store-location-type.dto';
import { UpdateStoreLocationDto } from './dto/update-store-location.dto';
import { UpdateStoreLocationTypeDto } from './dto/update-store-location-type.dto';

const locationTypeSelect = {
  id: true,
  magasin_id: true,
  nom: true,
  est_actif: true,
} satisfies Prisma.TypeEmplacementMagasinSelect;

const locationSelect = {
  id: true,
  magasin_id: true,
  nom: true,
  code: true,
  type: true,
  type_personnalise_id: true,
  type_personnalise: { select: { id: true, nom: true, est_actif: true } },
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
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.view',
    );
    return this.prisma.emplacementMagasin.findMany({
      where: { magasin_id: storeId, est_actif: true },
      select: locationSelect,
      orderBy: [{ est_par_defaut: 'desc' }, { nom: 'asc' }],
    });
  }

  async listTypes(userId: string, storeId: string) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.view',
    );
    return this.prisma.typeEmplacementMagasin.findMany({
      where: { magasin_id: storeId },
      select: locationTypeSelect,
      orderBy: { nom: 'asc' },
    });
  }

  async createType(
    userId: string,
    storeId: string,
    input: CreateStoreLocationTypeDto,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.manage_locations',
    );
    const nom = input.nom.trim();
    if (!nom) throw new BadRequestException('Le nom du type est obligatoire.');
    try {
      return await this.prisma.typeEmplacementMagasin.create({
        data: { magasin_id: storeId, nom },
        select: locationTypeSelect,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException('Ce type existe déjà pour cette boutique.');
      }
      throw error;
    }
  }

  async updateType(
    userId: string,
    storeId: string,
    typeId: string,
    input: UpdateStoreLocationTypeDto,
  ) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.manage_locations',
    );
    if (Object.keys(input).length === 0) {
      throw new BadRequestException(
        'Au moins un champ du type doit être renseigné.',
      );
    }
    const data: Prisma.TypeEmplacementMagasinUpdateManyMutationInput = {
      ...(input.nom !== undefined ? { nom: input.nom.trim() } : {}),
      ...(input.est_actif !== undefined ? { est_actif: input.est_actif } : {}),
    };
    if (input.nom !== undefined && !input.nom.trim()) {
      throw new BadRequestException('Le nom du type est obligatoire.');
    }
    try {
      const updated = await this.prisma.typeEmplacementMagasin.updateMany({
        where: { id: typeId, magasin_id: storeId },
        data,
      });
      if (updated.count === 0) {
        throw new NotFoundException('Type d’emplacement introuvable.');
      }
      return this.prisma.typeEmplacementMagasin.findUniqueOrThrow({
        where: { id: typeId },
        select: locationTypeSelect,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (isUniqueConflict(error)) {
        throw new ConflictException('Ce type existe déjà pour cette boutique.');
      }
      throw error;
    }
  }

  async create(userId: string, storeId: string, input: CreateStoreLocationDto) {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.manage_locations',
    );
    await this.assertLocationType(storeId, input.type_personnalise_id);
    const locationData = {
      magasin_id: storeId,
      nom: input.nom,
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.type_personnalise_id !== undefined
        ? { type_personnalise_id: input.type_personnalise_id }
        : {}),
      ...(input.est_par_defaut !== undefined
        ? { est_par_defaut: input.est_par_defaut }
        : {}),
    };
    try {
      if (input.est_par_defaut) {
        return await this.prisma.$transaction(async (tx) => {
          await tx.emplacementMagasin.updateMany({
            where: { magasin_id: storeId, est_par_defaut: true },
            data: { est_par_defaut: false },
          });
          return tx.emplacementMagasin.create({
            data: locationData,
            select: locationSelect,
          });
        });
      }
      return await this.prisma.emplacementMagasin.create({
        data: locationData,
        select: locationSelect,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'Ce code d’emplacement est déjà utilisé dans cette boutique.',
        );
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
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.manage_locations',
    );
    if (Object.keys(input).length === 0) {
      throw new BadRequestException(
        'Au moins un champ de l’emplacement doit être renseigné.',
      );
    }
    await this.assertLocationType(storeId, input.type_personnalise_id);
    const data: Prisma.EmplacementMagasinUpdateManyMutationInput = {
      ...(input.nom !== undefined ? { nom: input.nom } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.type_personnalise_id !== undefined
        ? { type_personnalise_id: input.type_personnalise_id }
        : {}),
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
            throw new NotFoundException('Emplacement introuvable.');
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
        throw new NotFoundException('Emplacement introuvable.');
      }
      return this.prisma.emplacementMagasin.findUniqueOrThrow({
        where: { id: locationId },
        select: locationSelect,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'Ce code d’emplacement est déjà utilisé dans cette boutique.',
        );
      }
      throw error;
    }
  }

  private async assertLocationType(storeId: string, typeId?: string | null) {
    if (typeId === undefined || typeId === null) return;
    const type = await this.prisma.typeEmplacementMagasin.findFirst({
      where: { id: typeId, magasin_id: storeId, est_actif: true },
      select: { id: true },
    });
    if (!type) {
      throw new BadRequestException(
        'Le type sélectionné est indisponible pour cette boutique.',
      );
    }
  }
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

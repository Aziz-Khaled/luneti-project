import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

const addressSelect = {
  id: true,
  utilisateur_id: true,
  type: true,
  libelle: true,
  nom_destinataire: true,
  telephone: true,
  ligne_1: true,
  ligne_2: true,
  ville: true,
  region: true,
  code_postal: true,
  code_pays: true,
  latitude: true,
  longitude: true,
  est_par_defaut: true,
  cree_le: true,
} satisfies Prisma.AdresseSelect;

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.adresse.findMany({
      where: { utilisateur_id: userId },
      select: addressSelect,
      orderBy: [{ est_par_defaut: 'desc' }, { cree_le: 'desc' }],
    });
  }

  async find(userId: string, addressId: string) {
    const address = await this.prisma.adresse.findFirst({
      where: { id: addressId, utilisateur_id: userId },
      select: addressSelect,
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  create(userId: string, input: CreateAddressDto) {
    const data = this.toCreateData(input);
    if (input.est_par_defaut) {
      return this.prisma.$transaction(async (tx) => {
        await tx.adresse.updateMany({
          where: { utilisateur_id: userId, est_par_defaut: true },
          data: { est_par_defaut: false },
        });
        return tx.adresse.create({
          data: { ...data, utilisateur_id: userId },
          select: addressSelect,
        });
      });
    }
    return this.prisma.adresse.create({
      data: { ...data, utilisateur_id: userId },
      select: addressSelect,
    });
  }

  async update(userId: string, addressId: string, input: UpdateAddressDto) {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one address field is required');
    }
    const data = this.toUpdateData(input);
    if (input.est_par_defaut) {
      return this.prisma.$transaction(async (tx) => {
        const owned = await tx.adresse.findFirst({
          where: { id: addressId, utilisateur_id: userId },
          select: { id: true },
        });
        if (!owned) {
          throw new NotFoundException('Address not found');
        }
        await tx.adresse.updateMany({
          where: { utilisateur_id: userId, est_par_defaut: true },
          data: { est_par_defaut: false },
        });
        return tx.adresse.update({
          where: { id: addressId },
          data,
          select: addressSelect,
        });
      });
    }
    const result = await this.prisma.adresse.updateMany({
      where: { id: addressId, utilisateur_id: userId },
      data,
    });
    if (result.count === 0) {
      throw new NotFoundException('Address not found');
    }
    return this.find(userId, addressId);
  }

  async remove(userId: string, addressId: string) {
    const result = await this.prisma.adresse.deleteMany({
      where: { id: addressId, utilisateur_id: userId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Address not found');
    }
    return { success: true };
  }

  private toCreateData(input: CreateAddressDto): Prisma.AdresseCreateManyInput {
    return {
      type: input.type,
      libelle: input.libelle,
      nom_destinataire: input.nom_destinataire,
      telephone: input.telephone,
      ligne_1: input.ligne_1,
      ligne_2: input.ligne_2,
      ville: input.ville,
      region: input.region,
      code_postal: input.code_postal,
      code_pays: input.code_pays,
      latitude:
        input.latitude !== undefined ? new Prisma.Decimal(input.latitude) : null,
      longitude:
        input.longitude !== undefined ? new Prisma.Decimal(input.longitude) : null,
      est_par_defaut: input.est_par_defaut,
    };
  }

  private toUpdateData(input: UpdateAddressDto): Prisma.AdresseUpdateManyMutationInput {
    return {
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.libelle !== undefined ? { libelle: input.libelle } : {}),
      ...(input.nom_destinataire !== undefined
        ? { nom_destinataire: input.nom_destinataire }
        : {}),
      ...(input.telephone !== undefined ? { telephone: input.telephone } : {}),
      ...(input.ligne_1 !== undefined ? { ligne_1: input.ligne_1 } : {}),
      ...(input.ligne_2 !== undefined ? { ligne_2: input.ligne_2 } : {}),
      ...(input.ville !== undefined ? { ville: input.ville } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.code_postal !== undefined
        ? { code_postal: input.code_postal }
        : {}),
      ...(input.code_pays !== undefined ? { code_pays: input.code_pays } : {}),
      ...(input.latitude !== undefined
        ? { latitude: new Prisma.Decimal(input.latitude) }
        : {}),
      ...(input.longitude !== undefined
        ? { longitude: new Prisma.Decimal(input.longitude) }
        : {}),
      ...(input.est_par_defaut !== undefined
        ? { est_par_defaut: input.est_par_defaut }
        : {}),
    };
  }
}

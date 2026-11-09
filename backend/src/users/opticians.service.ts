import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleMembre, StatutAdhesion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOpticianProfileDto } from './dto/update-optician-profile.dto';

const profileSelect = {
  id: true,
  utilisateur_id: true,
  titre_professionnel: true,
  numero_professionnel: true,
  biographie: true,
  cree_le: true,
  modifie_le: true,
} satisfies Prisma.ProfilOpticienSelect;

@Injectable()
export class OpticiansService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    await this.requireOpticianMembership(userId);
    const profile = await this.prisma.profilOpticien.findUnique({
      where: { utilisateur_id: userId },
      select: profileSelect,
    });
    if (!profile) {
      throw new NotFoundException('Optician profile not found');
    }
    return profile;
  }

  async updateMe(userId: string, input: UpdateOpticianProfileDto) {
    await this.requireOpticianMembership(userId);
    const data: Prisma.ProfilOpticienUpdateInput = {
      ...(input.titre_professionnel !== undefined
        ? { titre_professionnel: input.titre_professionnel }
        : {}),
      ...(input.numero_professionnel !== undefined
        ? { numero_professionnel: input.numero_professionnel }
        : {}),
      ...(input.biographie !== undefined ? { biographie: input.biographie } : {}),
    };
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one optician profile field is required');
    }
    const createData: Prisma.ProfilOpticienCreateInput = {
      utilisateur: { connect: { id: userId } },
      ...(input.titre_professionnel !== undefined
        ? { titre_professionnel: input.titre_professionnel }
        : {}),
      ...(input.numero_professionnel !== undefined
        ? { numero_professionnel: input.numero_professionnel }
        : {}),
      ...(input.biographie !== undefined ? { biographie: input.biographie } : {}),
    };
    return this.prisma.profilOpticien.upsert({
      where: { utilisateur_id: userId },
      create: createData,
      update: data,
      select: profileSelect,
    });
  }

  private async requireOpticianMembership(userId: string) {
    const membership = await this.prisma.membreMagasin.findFirst({
      where: {
        utilisateur_id: userId,
        role: RoleMembre.OPTICIEN,
        statut: StatutAdhesion.ACTIVE,
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException(
        'An active optician store membership is required',
      );
    }
  }
}

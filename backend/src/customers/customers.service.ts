import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';

const profileSelect = {
  id: true,
  utilisateur_id: true,
  date_naissance: true,
  accepte_marketing: true,
  cree_le: true,
  modifie_le: true,
} satisfies Prisma.ProfilClientSelect;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const profile = await this.prisma.profilClient.findUnique({
      where: { utilisateur_id: userId },
      select: profileSelect,
    });
    if (!profile) {
      throw new NotFoundException('Client profile not found');
    }
    return profile;
  }

  updateMe(userId: string, input: UpdateClientProfileDto) {
    const data: Prisma.ProfilClientUpdateInput = {
      ...(input.date_naissance !== undefined
        ? {
            date_naissance: input.date_naissance
              ? new Date(input.date_naissance)
              : null,
          }
        : {}),
      ...(input.accepte_marketing !== undefined
        ? { accepte_marketing: input.accepte_marketing }
        : {}),
    };
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one client profile field is required');
    }
    return this.prisma.profilClient.upsert({
      where: { utilisateur_id: userId },
      create: {
        utilisateur: { connect: { id: userId } },
        ...(input.date_naissance
          ? { date_naissance: new Date(input.date_naissance) }
          : {}),
        ...(input.accepte_marketing !== undefined
          ? { accepte_marketing: input.accepte_marketing }
          : {}),
      },
      update: data,
      select: profileSelect,
    });
  }
}

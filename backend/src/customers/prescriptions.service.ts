import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoteOeil, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionEyeDto } from './dto/prescription-eye.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

const prescriptionSelect = {
  id: true,
  profil_client_id: true,
  titre: true,
  prescrit_le: true,
  expire_le: true,
  notes: true,
  cree_le: true,
  modifie_le: true,
  yeux: {
    select: {
      id: true,
      cote: true,
      sphere: true,
      cylindre: true,
      axe: true,
      addition: true,
      prisme: true,
      base: true,
      ecart_pupillaire: true,
    },
    orderBy: { cote: 'asc' },
  },
} satisfies Prisma.OrdonnanceSelect;

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const profile = await this.getClientProfileId(userId);
    return this.prisma.ordonnance.findMany({
      where: { profil_client_id: profile },
      select: prescriptionSelect,
      orderBy: [{ prescrit_le: 'desc' }, { cree_le: 'desc' }],
    });
  }

  async find(userId: string, prescriptionId: string) {
    const profile = await this.getClientProfileId(userId);
    const result = await this.prisma.ordonnance.findFirst({
      where: { id: prescriptionId, profil_client_id: profile },
      select: prescriptionSelect,
    });
    if (!result) throw new NotFoundException('Prescription not found');
    return result;
  }

  async create(userId: string, input: CreatePrescriptionDto) {
    const profile = await this.getClientProfileId(userId);
    this.validateEyes(input.yeux);
    this.validateDates(input.prescrit_le, input.expire_le);
    return this.prisma.ordonnance.create({
      data: {
        profil_client_id: profile,
        titre: input.titre,
        prescrit_le: input.prescrit_le ? new Date(input.prescrit_le) : undefined,
        expire_le: input.expire_le ? new Date(input.expire_le) : undefined,
        notes: input.notes,
        yeux: {
          create: input.yeux.map((eye) => this.toEyeCreateInput(eye)),
        },
      },
      select: prescriptionSelect,
    });
  }

  async update(
    userId: string,
    prescriptionId: string,
    input: UpdatePrescriptionDto,
  ) {
    const profile = await this.getClientProfileId(userId);
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('At least one prescription field is required');
    }
    if (input.yeux) this.validateEyes(input.yeux);
    this.validateDates(input.prescrit_le, input.expire_le);
    const owned = await this.prisma.ordonnance.findFirst({
      where: { id: prescriptionId, profil_client_id: profile },
      select: { id: true },
    });
    if (!owned) throw new NotFoundException('Prescription not found');

    return this.prisma.$transaction(async (tx) => {
      if (input.yeux) {
        await tx.oeilOrdonnance.deleteMany({
          where: { ordonnance_id: prescriptionId },
        });
      }
      return tx.ordonnance.update({
        where: { id: prescriptionId },
        data: {
          ...(input.titre !== undefined ? { titre: input.titre } : {}),
          ...(input.prescrit_le !== undefined
            ? { prescrit_le: new Date(input.prescrit_le) }
            : {}),
          ...(input.expire_le !== undefined
            ? { expire_le: new Date(input.expire_le) }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.yeux
            ? {
                yeux: {
                  create: input.yeux.map((eye) => this.toEyeCreateInput(eye)),
                },
              }
            : {}),
        },
        select: prescriptionSelect,
      });
    });
  }

  async remove(userId: string, prescriptionId: string) {
    const profile = await this.getClientProfileId(userId);
    const result = await this.prisma.ordonnance.deleteMany({
      where: { id: prescriptionId, profil_client_id: profile },
    });
    if (!result.count) throw new NotFoundException('Prescription not found');
    return { success: true };
  }

  private async getClientProfileId(userId: string) {
    const profile = await this.prisma.profilClient.upsert({
      where: { utilisateur_id: userId },
      create: { utilisateur: { connect: { id: userId } } },
      update: {},
      select: { id: true },
    });
    return profile.id;
  }

  private validateEyes(eyes: PrescriptionEyeDto[]) {
    const sides = eyes.map((eye) => eye.cote);
    if (new Set(sides).size !== sides.length) {
      throw new BadRequestException('Prescription can have at most one entry per eye');
    }
    for (const eye of eyes) {
      if (eye.axe !== undefined && eye.cylindre === undefined) {
        throw new BadRequestException('Axis requires a cylinder value');
      }
    }
  }

  private validateDates(prescribed?: string, expires?: string) {
    if (
      prescribed &&
      expires &&
      new Date(expires).getTime() < new Date(prescribed).getTime()
    ) {
      throw new BadRequestException('Prescription expiration cannot precede prescription date');
    }
  }

  private toEyeCreateInput(eye: PrescriptionEyeDto): Prisma.OeilOrdonnanceCreateWithoutPrescriptionInput {
    return {
      cote: eye.cote as CoteOeil,
      ...(eye.sphere !== undefined ? { sphere: new Prisma.Decimal(eye.sphere) } : {}),
      ...(eye.cylindre !== undefined ? { cylindre: new Prisma.Decimal(eye.cylindre) } : {}),
      ...(eye.axe !== undefined ? { axe: eye.axe } : {}),
      ...(eye.addition !== undefined ? { addition: new Prisma.Decimal(eye.addition) } : {}),
      ...(eye.prisme !== undefined ? { prisme: new Prisma.Decimal(eye.prisme) } : {}),
      ...(eye.base !== undefined ? { base: eye.base } : {}),
      ...(eye.ecart_pupillaire !== undefined
        ? { ecart_pupillaire: new Prisma.Decimal(eye.ecart_pupillaire) }
        : {}),
    };
  }
}

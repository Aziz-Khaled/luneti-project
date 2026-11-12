import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatutMagasin, StatutRendezVous } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { StorePermissionCode } from '../common/guards/store-permissions';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

const customerSelect = {
  id: true,
  magasin_id: true,
  statut: true,
  type_service: true,
  commence_le: true,
  termine_le: true,
  note_client: true,
  cree_le: true,
  magasin: { select: { id: true, nom: true, slug: true } },
} as const;

const staffSelect = {
  ...customerSelect,
  note_interne: true,
  utilisateur: { select: { id: true, prenom: true, nom: true, email: true } },
} as const;

function staffSelectFor(includeContact: boolean) {
  return {
    ...staffSelect,
    utilisateur: {
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: includeContact,
      },
    },
  };
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeAuthorization: StoreAuthorizationService,
  ) {}

  async listMine(userId: string, pagination: PaginationDto) {
    const where = { utilisateur_id: userId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.rendezVous.findMany({
        where,
        select: customerSelect,
        orderBy: { commence_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.rendezVous.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async create(userId: string, input: CreateAppointmentDto) {
    const start = new Date(input.commence_le);
    const end = new Date(input.termine_le);
    if (start.getTime() <= Date.now() || end.getTime() <= start.getTime()) {
      throw new BadRequestException('Appointment must have a future start and a later end');
    }
    const store = await this.prisma.magasin.findFirst({
      where: {
        id: input.magasin_id,
        statut: StatutMagasin.ACTIVE,
        supprime_le: null,
      },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Active store not found');
    return this.prisma.rendezVous.create({
      data: {
        utilisateur_id: userId,
        magasin_id: input.magasin_id,
        type_service: input.type_service,
        commence_le: start,
        termine_le: end,
        note_client: input.note_client,
      },
      select: customerSelect,
    });
  }

  async cancelMine(userId: string, appointmentId: string) {
    const appointment = await this.prisma.rendezVous.findFirst({
      where: { id: appointmentId, utilisateur_id: userId },
      select: { id: true, statut: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (
      appointment.statut === StatutRendezVous.TERMINE ||
      appointment.statut === StatutRendezVous.ANNULE ||
      appointment.statut === StatutRendezVous.ABSENT
    ) {
      throw new ConflictException('Appointment can no longer be cancelled');
    }
    return this.prisma.rendezVous.update({
      where: { id: appointmentId },
      data: { statut: StatutRendezVous.ANNULE },
      select: customerSelect,
    });
  }

  async listStore(userId: string, storeId: string, pagination: PaginationDto) {
    const membership = await this.authorizeStore(userId, storeId, 'appointments.view');
    const includeContact = this.storeAuthorization
      .effectivePermissions(membership)
      .has('customers.view_contact');
    const where = { magasin_id: storeId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.rendezVous.findMany({
        where,
        select: staffSelectFor(includeContact),
        orderBy: { commence_le: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.rendezVous.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async updateStatus(
    userId: string,
    storeId: string,
    appointmentId: string,
    next: StatutRendezVous,
  ) {
    const membership = await this.authorizeStore(
      userId,
      storeId,
      next === StatutRendezVous.ANNULE
        ? 'appointments.cancel'
        : 'appointments.update',
    );
    const includeContact = this.storeAuthorization
      .effectivePermissions(membership)
      .has('customers.view_contact');
    const current = await this.prisma.rendezVous.findFirst({
      where: { id: appointmentId, magasin_id: storeId },
      select: { id: true, statut: true },
    });
    if (!current) throw new NotFoundException('Appointment not found');
    const allowed: Partial<Record<StatutRendezVous, StatutRendezVous[]>> = {
      [StatutRendezVous.DEMANDE]: [
        StatutRendezVous.CONFIRME,
        StatutRendezVous.REPLANIFIE,
        StatutRendezVous.ANNULE,
      ],
      [StatutRendezVous.CONFIRME]: [
        StatutRendezVous.REPLANIFIE,
        StatutRendezVous.TERMINE,
        StatutRendezVous.ANNULE,
        StatutRendezVous.ABSENT,
      ],
      [StatutRendezVous.REPLANIFIE]: [
        StatutRendezVous.CONFIRME,
        StatutRendezVous.ANNULE,
      ],
    };
    if (!allowed[current.statut]?.includes(next)) {
      throw new ConflictException('Invalid appointment status transition');
    }
    return this.prisma.rendezVous.update({
      where: { id: appointmentId },
      data: { statut: next },
      select: staffSelectFor(includeContact),
    });
  }

  private authorizeStore(
    userId: string,
    storeId: string,
    permission: StorePermissionCode,
  ) {
    return this.storeAuthorization.requirePermission(userId, storeId, permission);
  }
}

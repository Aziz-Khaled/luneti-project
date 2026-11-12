import { ApiProperty } from '@nestjs/swagger';
import { StatutRendezVous } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: StatutRendezVous })
  @IsEnum(StatutRendezVous)
  statut!: StatutRendezVous;
}

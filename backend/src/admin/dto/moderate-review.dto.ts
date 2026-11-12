import { ApiProperty } from '@nestjs/swagger';
import { StatutAvis } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ModerateReviewDto {
  @ApiProperty({ enum: StatutAvis, enumName: 'StatutAvis' })
  @IsEnum(StatutAvis)
  statut!: StatutAvis;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoleMembre, StatutAdhesion } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateStoreMemberDto {
  @ApiPropertyOptional({ enum: RoleMembre })
  @IsOptional()
  @IsEnum(RoleMembre)
  role?: RoleMembre;

  @ApiPropertyOptional({ enum: StatutAdhesion })
  @IsOptional()
  @IsEnum(StatutAdhesion)
  statut?: StatutAdhesion;
}

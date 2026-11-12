import { StatutCommande } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStoreOrderStatusDto {
  @IsEnum(StatutCommande)
  status!: StatutCommande;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

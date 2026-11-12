import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { StatutAnnonce } from '@prisma/client';

export class CreateStoreListingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  produit_id!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titre_personnalise?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description_personnalisee?: string;

  @ApiPropertyOptional({ enum: StatutAnnonce })
  @IsOptional()
  @IsEnum(StatutAnnonce)
  statut?: StatutAnnonce;
}

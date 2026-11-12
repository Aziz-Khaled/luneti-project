import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeEmplacementStock } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateStoreLocationDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  nom!: string;

  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;

  @ApiPropertyOptional({ enum: TypeEmplacementStock })
  @IsOptional()
  @IsEnum(TypeEmplacementStock)
  type?: TypeEmplacementStock;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  type_personnalise_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  est_par_defaut?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeEmplacementStock } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  est_par_defaut?: boolean;
}

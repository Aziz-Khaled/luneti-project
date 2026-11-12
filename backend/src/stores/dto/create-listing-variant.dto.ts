import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateListingVariantDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  variante_id!: string;

  @ApiProperty({ minimum: 0.001 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  prix!: number;

  @ApiPropertyOptional({ minimum: 0.001 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  prix_compare?: number;

  @ApiPropertyOptional({ minLength: 3, maxLength: 3, default: 'TND' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  devise?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  reference_magasin?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  code_barres_magasin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  est_disponible?: boolean;
}

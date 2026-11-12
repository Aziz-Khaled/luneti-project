import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CoteOeil } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PrescriptionEyeDto {
  @ApiProperty({ enum: CoteOeil })
  @IsEnum(CoteOeil)
  cote!: CoteOeil;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  sphere?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  cylindre?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 180 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(180)
  axe?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  addition?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  prisme?: number;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  base?: string;

  @ApiPropertyOptional({ type: Number, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  ecart_pupillaire?: number;
}

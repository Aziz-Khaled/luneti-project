import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicCible, TypeProduit, Prisma } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @Length(1, 200)
  nom!: string;

  @ApiProperty({ example: 'monture-ronde-noir' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(220)
  slug!: string;

  @ApiProperty({ enum: TypeProduit })
  @IsEnum(TypeProduit)
  type!: TypeProduit;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  marque?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fabricant?: string;

  @ApiPropertyOptional({ enum: PublicCible })
  @IsOptional()
  @IsEnum(PublicCible)
  public_cible?: PublicCible;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categorie?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquettes?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  attributs?: Prisma.InputJsonValue;
}

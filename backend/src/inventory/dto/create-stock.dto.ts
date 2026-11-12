import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AgeMontureStock,
  ConceptionVerreStock,
  PublicCible,
  TraitementVerreStock,
  TypeArticleStock,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStockDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Lien facultatif avec une variante du catalogue',
  })
  @IsOptional()
  @IsUUID()
  storeListingVariantId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  emplacement_id!: string;

  @ApiProperty({ enum: TypeArticleStock })
  @IsEnum(TypeArticleStock)
  type_article!: TypeArticleStock;

  @ApiPropertyOptional({ enum: ConceptionVerreStock })
  @IsOptional()
  @IsEnum(ConceptionVerreStock)
  conception_verre?: ConceptionVerreStock;

  @ApiPropertyOptional({ enum: TraitementVerreStock })
  @IsOptional()
  @IsEnum(TraitementVerreStock)
  traitement_verre?: TraitementVerreStock;

  @ApiPropertyOptional({ description: 'Puissance optique de l’œil droit' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  puissance_droite?: number;

  @ApiPropertyOptional({ description: 'Puissance optique de l’œil gauche' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  puissance_gauche?: number;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  marque_reference?: string;

  @ApiPropertyOptional({ enum: AgeMontureStock })
  @IsOptional()
  @IsEnum(AgeMontureStock)
  age_monture?: AgeMontureStock;

  @ApiPropertyOptional({ enum: PublicCible })
  @IsOptional()
  @IsEnum(PublicCible)
  public_cible?: PublicCible;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  taille_monture?: string;

  @ApiProperty({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  quantite_disponible = 0;

  @ApiProperty({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  seuil_reapprovisionnement = 0;
}

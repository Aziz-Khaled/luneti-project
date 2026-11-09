import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeAdresse } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({ enum: TypeAdresse })
  @IsOptional()
  @IsEnum(TypeAdresse)
  type?: TypeAdresse;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  libelle?: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nom_destinataire?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telephone?: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @Length(1, 255)
  ligne_1!: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ligne_2?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @Length(1, 100)
  ville!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code_postal?: string;

  @ApiPropertyOptional({ minLength: 2, maxLength: 2, default: 'TN' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  code_pays?: string;

  @ApiPropertyOptional({ type: Number, minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ type: Number, minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  est_par_defaut?: boolean;
}

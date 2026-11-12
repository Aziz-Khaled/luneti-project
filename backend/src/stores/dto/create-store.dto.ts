import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, Length, MaxLength, Matches } from 'class-validator';

const storeImageUrlPattern =
  /^(?:https?:\/\/[^\s]+|\/api\/v1\/stores\/[0-9a-f-]+\/branding\/[0-9a-f]{32}\.(?:png|jpe?g|webp|avif))$/i;

export class CreateStoreDto {
  @ApiProperty({ maxLength: 160, example: 'Lunetty Optique Tunis' })
  @IsString()
  @Length(1, 160)
  nom!: string;

  @ApiPropertyOptional({ maxLength: 180, example: 'lunetty-optique-tunis' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code_enregistrement?: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @Length(1, 255)
  adresse_ligne_1!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @Length(1, 100)
  adresse_ville!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  adresse_region?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  adresse_code_postal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telephone?: string;

  @ApiPropertyOptional({ format: 'uri' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  url_site_web?: string;

  @ApiPropertyOptional({ format: 'uri' })
  @IsOptional()
  @Matches(storeImageUrlPattern)
  @MaxLength(2048)
  url_logo?: string;

  @ApiPropertyOptional({ format: 'uri' })
  @IsOptional()
  @Matches(storeImageUrlPattern)
  @MaxLength(2048)
  url_image_couverture?: string;

  @ApiPropertyOptional({ maxLength: 80, example: 'Africa/Tunis' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  fuseau_horaire?: string;

  @ApiPropertyOptional({ minLength: 3, maxLength: 3, example: 'TND' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  devise?: string;
}

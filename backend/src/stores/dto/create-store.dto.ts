import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, Length, MaxLength, Matches } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ maxLength: 160, example: 'Lunetty Optique Tunis' })
  @IsString()
  @Length(1, 160)
  nom!: string;

  @ApiProperty({ maxLength: 180, example: 'lunetty-optique-tunis' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(180)
  slug!: string;

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
}

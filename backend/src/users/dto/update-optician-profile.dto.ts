import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateOpticianProfileDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titre_professionnel?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  numero_professionnel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 10000)
  biographie?: string;
}

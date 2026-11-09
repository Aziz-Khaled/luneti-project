import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateClientProfileDto {
  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  date_naissance?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accepte_marketing?: boolean;
}

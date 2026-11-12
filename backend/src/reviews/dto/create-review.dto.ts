import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  note!: number;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  titre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 10000)
  contenu?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional completed store order to associate with this review',
  })
  @IsOptional()
  @IsUUID()
  commande_id?: string;
}

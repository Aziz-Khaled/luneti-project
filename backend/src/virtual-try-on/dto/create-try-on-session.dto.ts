import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equals, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateTryOnSessionDto {
  @ApiProperty({ enum: [true], description: 'Must be true after the user accepts the displayed policy' })
  @IsBoolean()
  @Equals(true)
  accepte!: true;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  variante_produit_id?: string;
}

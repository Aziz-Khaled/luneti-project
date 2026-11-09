import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeMouvementStock } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, MaxLength, NotEquals } from 'class-validator';

export class CreateStockMovementDto {
  @ApiProperty({ enum: TypeMouvementStock })
  @IsEnum(TypeMouvementStock)
  type!: TypeMouvementStock;

  @ApiProperty({ description: 'Non-zero quantity; adjustments may be negative' })
  @IsInt()
  @NotEquals(0)
  quantite!: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Destination stock for paired transfers' })
  @IsOptional()
  @IsUUID()
  destination_stock_id?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  note?: string;
}

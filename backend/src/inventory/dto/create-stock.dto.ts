import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateStockDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storeListingVariantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  emplacement_id!: string;

  @ApiProperty({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  quantite_disponible = 0;

  @ApiProperty({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  seuil_reapprovisionnement = 0;
}

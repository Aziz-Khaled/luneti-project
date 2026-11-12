import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class UpsertCartItemDto {
  @ApiProperty({ format: 'uuid', description: 'Store listing variant ID' })
  @IsUUID()
  variante_annonce_id!: string;

  @ApiProperty({ minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  quantite!: number;
}

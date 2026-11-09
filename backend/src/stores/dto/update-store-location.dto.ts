import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateStoreLocationDto } from './create-store-location.dto';

export class UpdateStoreLocationDto extends PartialType(CreateStoreLocationDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  est_actif?: boolean;
}

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateStoreLocationTypeDto } from './create-store-location-type.dto';

export class UpdateStoreLocationTypeDto extends PartialType(
  CreateStoreLocationTypeDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  est_actif?: boolean;
}

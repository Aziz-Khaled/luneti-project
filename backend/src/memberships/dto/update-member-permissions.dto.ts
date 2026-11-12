import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  STORE_PERMISSION_CATALOG,
  STORE_PERMISSION_PRESETS,
} from '../../common/guards/store-permissions';

const presetCodes = Object.keys(STORE_PERMISSION_PRESETS);

export class PermissionOverrideDto {
  @ApiProperty({ maxLength: 100, example: 'inventory.adjust_stock' })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty()
  @IsBoolean()
  allowed!: boolean;
}

export class UpdateMemberPermissionsDto {
  @ApiProperty({ enum: presetCodes })
  @IsIn(presetCodes)
  preset!: string;

  @ApiProperty({ type: [PermissionOverrideDto] })
  @IsArray()
  @ArrayMaxSize(STORE_PERMISSION_CATALOG.length)
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideDto)
  overrides!: PermissionOverrideDto[];
}

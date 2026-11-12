import { ApiProperty } from '@nestjs/swagger';
import { RoleMembre } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import {
  STORE_PERMISSION_CATALOG,
  STORE_PERMISSION_PRESETS,
} from '../../common/guards/store-permissions';
import { PermissionOverrideDto } from '../../memberships/dto/update-member-permissions.dto';

const permissionPresetCodes = Object.keys(STORE_PERMISSION_PRESETS);

export class CreateStoreMemberDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @Length(1, 100)
  prenom!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @Length(1, 100)
  nom!: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 12, maxLength: 1024 })
  @IsString()
  @Length(12, 1024)
  temporaryPassword!: string;

  @ApiProperty({
    enum: [RoleMembre.GERANT, RoleMembre.OPTICIEN, RoleMembre.EMPLOYE],
  })
  @IsIn([RoleMembre.GERANT, RoleMembre.OPTICIEN, RoleMembre.EMPLOYE])
  role!: RoleMembre;

  @ApiProperty({
    enum: permissionPresetCodes,
    required: false,
    default: 'read_only',
  })
  @IsOptional()
  @IsIn(permissionPresetCodes)
  preset?: string;

  @ApiProperty({
    type: [PermissionOverrideDto],
    required: false,
    maxItems: STORE_PERMISSION_CATALOG.length,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(STORE_PERMISSION_CATALOG.length)
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideDto)
  overrides?: PermissionOverrideDto[];
}

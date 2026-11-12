import { ApiProperty } from '@nestjs/swagger';
import { CanalNotification, TypeNotification } from '@prisma/client';
import { IsBoolean, IsEnum } from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ enum: TypeNotification })
  @IsEnum(TypeNotification)
  type!: TypeNotification;

  @ApiProperty({ enum: CanalNotification })
  @IsEnum(CanalNotification)
  canal!: CanalNotification;

  @ApiProperty()
  @IsBoolean()
  active!: boolean;
}

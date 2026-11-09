import { ApiProperty } from '@nestjs/swagger';
import { RoleMembre } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateStoreMemberDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: RoleMembre })
  @IsEnum(RoleMembre)
  role!: RoleMembre;
}

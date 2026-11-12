import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateStoreLocationTypeDto {
  @ApiProperty({ maxLength: 80 })
  @IsString()
  @Length(1, 80)
  nom!: string;
}

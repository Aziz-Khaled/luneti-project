import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyRneDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @Length(1, 100)
  code_enregistrement!: string;
}

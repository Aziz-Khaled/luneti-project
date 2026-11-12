import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  magasin_id!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @Length(1, 100)
  type_service!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  commence_le!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  termine_le!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note_client?: string;
}

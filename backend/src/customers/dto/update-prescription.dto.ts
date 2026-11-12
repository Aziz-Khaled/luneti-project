import { OmitType, PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreatePrescriptionDto } from './create-prescription.dto';
import { PrescriptionEyeDto } from './prescription-eye.dto';

export class UpdatePrescriptionDto extends PartialType(
  OmitType(CreatePrescriptionDto, ['yeux'] as const),
) {
  @ApiPropertyOptional({ type: [PrescriptionEyeDto], minItems: 1, maxItems: 2 })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionEyeDto)
  yeux?: PrescriptionEyeDto[];
}

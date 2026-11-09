import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeProduit } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryProductsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TypeProduit })
  @IsOptional()
  @IsEnum(TypeProduit)
  type?: TypeProduit;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}

import { StatutCommande } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class StoreOrdersQueryDto extends PaginationDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @IsOptional()
  @IsEnum(StatutCommande)
  status?: StatutCommande;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

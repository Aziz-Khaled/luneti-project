import { FournisseurPaiement, StatutPaiement } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class StoreTransactionsQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @IsOptional()
  @IsEnum(StatutPaiement)
  status?: StatutPaiement;

  @IsOptional()
  @IsEnum(FournisseurPaiement)
  provider?: FournisseurPaiement;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @IsIn(['today', '7d', '30d', '3m', '12m', 'custom'])
  range: 'today' | '7d' | '30d' | '3m' | '12m' | 'custom' = '30d';

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

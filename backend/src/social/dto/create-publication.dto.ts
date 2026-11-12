import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { VisibilitePublication } from '@prisma/client';

export class CreatePublicationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  legende?: string;

  @ApiPropertyOptional({ enum: VisibilitePublication })
  @IsOptional()
  @IsEnum(VisibilitePublication)
  visibilite?: VisibilitePublication;

  @ApiPropertyOptional({ format: 'uuid', description: 'Post on behalf of a store' })
  @IsOptional()
  @IsUUID()
  magasin_id?: string;
}

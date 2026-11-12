import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateListingVariantDto } from './create-listing-variant.dto';

export class UpdateListingVariantDto extends PartialType(
  OmitType(CreateListingVariantDto, ['variante_id'] as const),
) {}

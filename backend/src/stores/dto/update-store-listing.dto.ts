import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateStoreListingDto } from './create-store-listing.dto';

export class UpdateStoreListingDto extends PartialType(
  OmitType(CreateStoreListingDto, ['produit_id'] as const),
) {}

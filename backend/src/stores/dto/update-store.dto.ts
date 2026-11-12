import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';

export class UpdateStoreDto extends PartialType(
  OmitType(CreateStoreDto, [
    'nom',
    'slug',
    'code_enregistrement',
    'adresse_ligne_1',
    'adresse_ville',
    'adresse_region',
    'adresse_code_postal',
  ] as const),
) {}

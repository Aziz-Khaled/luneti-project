import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { StoreLocationsController } from './store-locations.controller';
import { StoreLocationsService } from './store-locations.service';
import { StoreListingsController } from './store-listings.controller';
import { StoreListingsService } from './store-listings.service';
import { RneVerificationService } from './rne-verification.service';

@Module({
  imports: [AuthModule],
  controllers: [StoresController, StoreLocationsController, StoreListingsController],
  providers: [
    StoresService,
    StoreLocationsService,
    StoreListingsService,
    RneVerificationService,
  ],
  exports: [StoresService, StoreLocationsService, StoreListingsService],
})
export class StoresModule {}

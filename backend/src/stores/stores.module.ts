import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { StoreLocationsController } from './store-locations.controller';
import { StoreLocationsService } from './store-locations.service';

@Module({
  imports: [AuthModule],
  controllers: [StoresController, StoreLocationsController],
  providers: [StoresService, StoreLocationsService],
  exports: [StoresService, StoreLocationsService],
})
export class StoresModule {}

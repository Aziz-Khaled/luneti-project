import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ReferenceScanService } from './reference-scan.service';

@Module({
  imports: [AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService, ReferenceScanService],
  exports: [InventoryService],
})
export class InventoryModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { StoreOrdersController } from './store-orders.controller';
import { StoreOrdersService } from './store-orders.service';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController, StoreOrdersController],
  providers: [OrdersService, StoreOrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

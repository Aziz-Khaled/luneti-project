import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController, StoreTransactionsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController, StoreTransactionsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

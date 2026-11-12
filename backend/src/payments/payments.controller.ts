import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { StoreTransactionsQueryDto } from './dto/store-transactions-query.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Payments')
@Controller('orders/:orderId')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('payments')
  @ApiOperation({ summary: 'List sanitized payment records for an owned order' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  listPayments(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.payments.listForOrder(user.id, orderId);
  }

  @Get('refunds')
  @ApiOperation({ summary: 'List refund records for an owned order' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  listRefunds(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.payments.listRefundsForOrder(user.id, orderId);
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Store Transactions')
@Controller('stores/:storeId/transactions')
export class StoreTransactionsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List real payment records for an authorized store' })
  list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: StoreTransactionsQueryDto,
  ) {
    return this.payments.listForStore(user.id, storeId, query, query);
  }
}

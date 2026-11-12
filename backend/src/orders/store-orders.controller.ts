import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StoreOrdersQueryDto } from './dto/store-orders-query.dto';
import { UpdateStoreOrderStatusDto } from './dto/update-store-order-status.dto';
import { StoreOrdersService } from './store-orders.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Store Orders')
@Controller('stores/:storeId/orders')
export class StoreOrdersController {
  constructor(private readonly orders: StoreOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List this store’s orders with filters and pagination' })
  list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: StoreOrdersQueryDto,
  ) {
    return this.orders.list(user.id, storeId, query, query);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get an order and status history in this store' })
  get(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orders.get(user.id, storeId, orderId);
  }

  @Patch(':orderId/status')
  @ApiOperation({ summary: 'Advance an order through an allowed status transition' })
  updateStatus(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() input: UpdateStoreOrderStatusDto,
  ) {
    return this.orders.updateStatus(user.id, storeId, orderId, input);
  }
}

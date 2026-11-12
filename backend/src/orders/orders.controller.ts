import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpsertCartItemDto } from './dto/upsert-cart-item.dto';
import { OrdersService } from './orders.service';

@Controller()
@UseGuards(JwtAuthGuard)
@ApiTags('Cart and Orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('cart')
  @ApiOperation({ summary: "Get the authenticated user's active cart" })
  getCart(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.orders.getCart(user.id);
  }

  @Post('cart/items')
  @ApiOperation({ summary: 'Add or set quantity of a priced store listing variant' })
  addCartItem(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: UpsertCartItemDto,
  ) {
    return this.orders.upsertCartItem(user.id, input);
  }

  @Delete('cart/items/:itemId')
  @ApiOperation({ summary: 'Remove an item from the authenticated user cart' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  removeCartItem(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.orders.removeCartItem(user.id, itemId);
  }

  @Delete('cart')
  @ApiOperation({ summary: 'Abandon and clear the active cart' })
  clearCart(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.orders.clearCart(user.id);
  }

  @Post('orders')
  @ApiOperation({
    summary: 'Create a pending-payment order from the active cart and reserve stock',
  })
  createOrder(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CreateOrderDto,
  ) {
    return this.orders.createOrder(user.id, input);
  }

  @Get('orders')
  @ApiOperation({ summary: "List the authenticated user's orders" })
  listOrders(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() pagination: PaginationDto,
  ) {
    return this.orders.listOrders(user.id, pagination);
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Get an order owned by the authenticated user' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  getOrder(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orders.getOrder(user.id, orderId);
  }

  @Get('orders/:orderId/history')
  @ApiOperation({ summary: 'Get status history for an owned order' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  getOrderHistory(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orders.getOrderHistory(user.id, orderId);
  }

  @Post('orders/:orderId/cancel')
  @ApiOperation({ summary: 'Cancel an unpaid order and release its stock reservations' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  cancelOrder(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orders.cancelOrder(user.id, orderId);
  }
}

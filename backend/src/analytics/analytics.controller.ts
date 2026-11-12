import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StoreCustomersQueryDto } from './dto/store-customers-query.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Store Dashboard')
@Controller('stores/:storeId')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get owner/manager store dashboard metrics' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  dashboard(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.analytics.dashboard(user.id, storeId, query);
  }

  @Get('customers')
  @ApiOperation({ summary: 'List customers with purchases from this store' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  customers(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: StoreCustomersQueryDto,
  ) {
    return this.analytics.customers(user.id, storeId, query);
  }

  @Get('customers/:customerId/orders')
  @ApiOperation({ summary: 'List a store customer purchase history' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  @ApiParam({ name: 'customerId', format: 'uuid' })
  customerOrders(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query() query: StoreCustomersQueryDto,
  ) {
    return this.analytics.customerOrders(user.id, storeId, customerId, query);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { InventoryService } from './inventory.service';

@Controller('stores/:storeId/inventory')
@UseGuards(JwtAuthGuard)
@ApiTags('Inventory')
@ApiBearerAuth()
@ApiParam({ name: 'storeId', format: 'uuid' })
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory for a store you are authorized to manage' })
  list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.inventory.list(user.id, storeId, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Create a stock record for a store listing and location' })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: CreateStockDto,
  ) {
    return this.inventory.create(user.id, storeId, input);
  }

  @Get(':stockId')
  @ApiOperation({ summary: 'Get an inventory record from an authorized store' })
  @ApiParam({ name: 'stockId', format: 'uuid' })
  find(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('stockId', ParseUUIDPipe) stockId: string,
  ) {
    return this.inventory.find(user.id, storeId, stockId);
  }

  @Patch(':stockId')
  @ApiOperation({ summary: 'Update the reorder threshold of a stock record' })
  @ApiParam({ name: 'stockId', format: 'uuid' })
  update(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('stockId', ParseUUIDPipe) stockId: string,
    @Body() input: UpdateStockDto,
  ) {
    return this.inventory.update(user.id, storeId, stockId, input);
  }

  @Get(':stockId/movements')
  @ApiOperation({ summary: 'List stock movement history' })
  @ApiParam({ name: 'stockId', format: 'uuid' })
  movements(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('stockId', ParseUUIDPipe) stockId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.inventory.movements(user.id, storeId, stockId, pagination);
  }

  @Post(':stockId/movements')
  @ApiOperation({
    summary: 'Apply a validated inventory movement in a database transaction',
  })
  @ApiParam({ name: 'stockId', format: 'uuid' })
  createMovement(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('stockId', ParseUUIDPipe) stockId: string,
    @Body() input: CreateStockMovementDto,
  ) {
    return this.inventory.createMovement(user.id, storeId, stockId, input);
  }
}

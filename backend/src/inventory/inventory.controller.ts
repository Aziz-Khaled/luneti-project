import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
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
import {
  ReferenceScanService,
  ReferenceScanUpload,
} from './reference-scan.service';

@Controller('stores/:storeId/inventory')
@UseGuards(JwtAuthGuard)
@ApiTags('Inventory')
@ApiBearerAuth()
@ApiParam({ name: 'storeId', format: 'uuid' })
export class InventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly referenceScan: ReferenceScanService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List inventory for a store you are authorized to manage',
  })
  list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.inventory.list(user.id, storeId, pagination);
  }

  @Post()
  @ApiOperation({
    summary: 'Create an optical stock item for an active store location',
  })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: CreateStockDto,
  ) {
    return this.inventory.create(user.id, storeId, input);
  }

  @Post('scan-reference')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 16 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/avif',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Choisissez une photo au format JPEG, PNG, WebP ou AVIF.',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
      required: ['image'],
    },
  })
  @ApiOperation({
    summary: 'Read an eyeglass frame reference from a photo',
  })
  async scanReference(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @UploadedFile() file: ReferenceScanUpload | undefined,
  ) {
    await this.inventory.authorizeReferenceScan(user.id, storeId);
    if (!file) {
      throw new BadRequestException('Aucune photo reçue.');
    }
    return this.referenceScan.scan(file);
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

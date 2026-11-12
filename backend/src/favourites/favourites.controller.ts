import {
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
import { FavouritesService } from './favourites.service';

@Controller('users/me/favorites')
@UseGuards(JwtAuthGuard)
@ApiTags('Favorites')
@ApiBearerAuth()
export class FavouritesController {
  constructor(private readonly favourites: FavouritesService) {}

  @Get('products')
  @ApiOperation({ summary: "List the authenticated user's favorite products" })
  products(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() pagination: PaginationDto,
  ) {
    return this.favourites.products(user.id, pagination);
  }

  @Post('products/:productId')
  @ApiOperation({ summary: 'Favorite an active catalog product' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  addProduct(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.favourites.addProduct(user.id, productId);
  }

  @Delete('products/:productId')
  @ApiOperation({ summary: 'Remove a product from favorites' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  removeProduct(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.favourites.removeProduct(user.id, productId);
  }

  @Get('stores')
  @ApiOperation({ summary: "List the authenticated user's favorite stores" })
  stores(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() pagination: PaginationDto,
  ) {
    return this.favourites.stores(user.id, pagination);
  }

  @Post('stores/:storeId')
  @ApiOperation({ summary: 'Favorite an active store' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  addStore(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.favourites.addStore(user.id, storeId);
  }

  @Delete('stores/:storeId')
  @ApiOperation({ summary: 'Remove a store from favorites' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  removeStore(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.favourites.removeStore(user.id, storeId);
  }
}

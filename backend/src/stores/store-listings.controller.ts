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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateStoreListingDto } from './dto/create-store-listing.dto';
import { UpdateStoreListingDto } from './dto/update-store-listing.dto';
import { CreateListingVariantDto } from './dto/create-listing-variant.dto';
import { UpdateListingVariantDto } from './dto/update-listing-variant.dto';
import { StoreListingsService } from './store-listings.service';

@Controller('stores/:storeId/listings')
@ApiTags('Store Listings')
@ApiParam({ name: 'storeId', format: 'uuid' })
export class StoreListingsController {
  constructor(private readonly listings: StoreListingsService) {}

  @Get()
  @ApiOperation({ summary: 'List public listings for an active store' })
  list(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.listings.listPublic(storeId, pagination);
  }

  @Get(':listingId')
  @ApiOperation({ summary: 'Get an active public store listing' })
  @ApiParam({ name: 'listingId', format: 'uuid' })
  find(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.listings.findPublic(storeId, listingId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a store listing (store manager)' })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: CreateStoreListingDto,
  ) {
    return this.listings.create(user.id, storeId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':listingId')
  @ApiOperation({ summary: 'Update a store listing (store manager)' })
  @ApiParam({ name: 'listingId', format: 'uuid' })
  update(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() input: UpdateStoreListingDto,
  ) {
    return this.listings.update(user.id, storeId, listingId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':listingId/variants')
  @ApiOperation({ summary: 'Add a priced product variant to a store listing' })
  @ApiParam({ name: 'listingId', format: 'uuid' })
  addVariant(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() input: CreateListingVariantDto,
  ) {
    return this.listings.addVariant(user.id, storeId, listingId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':listingId/variants/:listingVariantId')
  @ApiOperation({ summary: 'Change listing price or availability' })
  @ApiParam({ name: 'listingId', format: 'uuid' })
  @ApiParam({ name: 'listingVariantId', format: 'uuid' })
  updateVariant(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Param('listingVariantId', ParseUUIDPipe) listingVariantId: string,
    @Body() input: UpdateListingVariantDto,
  ) {
    return this.listings.updateVariant(
      user.id,
      storeId,
      listingId,
      listingVariantId,
      input,
    );
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { StoreLocationsService } from './store-locations.service';
import { CreateStoreLocationDto } from './dto/create-store-location.dto';
import { CreateStoreLocationTypeDto } from './dto/create-store-location-type.dto';
import { UpdateStoreLocationDto } from './dto/update-store-location.dto';
import { UpdateStoreLocationTypeDto } from './dto/update-store-location-type.dto';

@Controller('stores/:storeId/locations')
@UseGuards(JwtAuthGuard)
@ApiTags('Stores')
@ApiBearerAuth()
@ApiParam({ name: 'storeId', format: 'uuid' })
export class StoreLocationsController {
  constructor(private readonly locations: StoreLocationsService) {}

  @Get('types')
  @ApiOperation({ summary: 'List custom inventory location types' })
  listTypes(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.locations.listTypes(user.id, storeId);
  }

  @Post('types')
  @ApiOperation({ summary: 'Create a custom inventory location type' })
  createType(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: CreateStoreLocationTypeDto,
  ) {
    return this.locations.createType(user.id, storeId, input);
  }

  @Patch('types/:typeId')
  @ApiOperation({ summary: 'Rename or deactivate a custom location type' })
  @ApiParam({ name: 'typeId', format: 'uuid' })
  updateType(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('typeId', ParseUUIDPipe) typeId: string,
    @Body() input: UpdateStoreLocationTypeDto,
  ) {
    return this.locations.updateType(user.id, storeId, typeId, input);
  }

  @Get()
  @ApiOperation({ summary: 'List locations in a store you can manage' })
  list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.locations.list(user.id, storeId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a store inventory location' })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: CreateStoreLocationDto,
  ) {
    return this.locations.create(user.id, storeId, input);
  }

  @Patch(':locationId')
  @ApiOperation({ summary: 'Update or deactivate a store location' })
  @ApiParam({ name: 'locationId', format: 'uuid' })
  update(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() input: UpdateStoreLocationDto,
  ) {
    return this.locations.update(user.id, storeId, locationId, input);
  }
}

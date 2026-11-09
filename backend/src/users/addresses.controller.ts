import {
  Body,
  Controller,
  Delete,
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
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('users/me/addresses')
@UseGuards(JwtAuthGuard)
@ApiTags('Addresses')
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's addresses" })
  list(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.addresses.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Create an address for the authenticated user" })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CreateAddressDto,
  ) {
    return this.addresses.create(user.id, input);
  }

  @Get(':addressId')
  @ApiOperation({ summary: "Get an address owned by the authenticated user" })
  @ApiParam({ name: 'addressId', format: 'uuid' })
  find(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return this.addresses.find(user.id, addressId);
  }

  @Patch(':addressId')
  @ApiOperation({ summary: "Update an address owned by the authenticated user" })
  @ApiParam({ name: 'addressId', format: 'uuid' })
  update(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() input: UpdateAddressDto,
  ) {
    return this.addresses.update(user.id, addressId, input);
  }

  @Delete(':addressId')
  @ApiOperation({ summary: "Delete an address owned by the authenticated user" })
  @ApiParam({ name: 'addressId', format: 'uuid' })
  remove(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return this.addresses.remove(user.id, addressId);
  }
}

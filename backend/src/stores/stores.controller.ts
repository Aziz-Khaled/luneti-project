import {
  Body,
  Controller,
  Delete,
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
import { CreateStoreMemberDto } from './dto/create-store-member.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreMemberDto } from './dto/update-store-member.dto';
import { StoresService } from './stores.service';

@Controller('stores')
@ApiTags('Stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'List active public stores' })
  list(@Query() pagination: PaginationDto) {
    return this.stores.list(pagination);
  }

  @Get(':storeId')
  @ApiOperation({ summary: 'Get an active public store' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  find(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.stores.find(storeId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a store and become its owner' })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CreateStoreDto,
  ) {
    return this.stores.create(user.id, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':storeId')
  @ApiOperation({ summary: 'Update store profile as owner or manager' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  update(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: UpdateStoreDto,
  ) {
    return this.stores.update(user.id, storeId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':storeId')
  @ApiOperation({ summary: 'Archive a store as its owner' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  archive(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.stores.archive(user.id, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':storeId/members')
  @ApiOperation({ summary: 'List members of a store you manage' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  members(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.stores.listMembers(user.id, storeId, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':storeId/members')
  @ApiOperation({ summary: 'Invite a user to a store you manage' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  inviteMember(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: CreateStoreMemberDto,
  ) {
    return this.stores.inviteMember(user.id, storeId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':storeId/members/:memberId')
  @ApiOperation({
    summary: 'Accept your invitation or update membership as store owner',
  })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  updateMember(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() input: UpdateStoreMemberDto,
  ) {
    return this.stores.updateMember(user.id, storeId, memberId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':storeId/members/:memberId')
  @ApiOperation({ summary: 'Leave or remove a store membership' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  removeMember(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.stores.removeMember(user.id, storeId, memberId);
  }
}

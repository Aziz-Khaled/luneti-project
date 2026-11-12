import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateMemberPermissionsDto } from './dto/update-member-permissions.dto';
import { StorePermissionsService } from './store-permissions.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Store Permissions')
@Controller('stores/:storeId')
export class StorePermissionsController {
  constructor(private readonly permissions: StorePermissionsService) {}

  @Get('permissions/catalog')
  @ApiOperation({ summary: 'Get the store permission catalog and presets' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  catalog(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.permissions.catalog(user.id, storeId);
  }

  @Get('members/:memberId/permissions')
  @ApiOperation({ summary: 'Get effective permissions for a store member' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  getMemberPermissions(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.permissions.memberPermissions(user.id, storeId, memberId);
  }

  @Put('members/:memberId/permissions')
  @ApiOperation({ summary: 'Replace a member preset and individual permission overrides' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  updateMemberPermissions(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() input: UpdateMemberPermissionsDto,
  ) {
    return this.permissions.updateMemberPermissions(user.id, storeId, memberId, input);
  }
}

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Employee Portal')
@Controller('employee')
export class EmployeeController {
  constructor(private readonly permissions: StorePermissionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get active employee store memberships and permissions' })
  me(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.permissions.employeeMe(user.id);
  }

  @Get('stores')
  @ApiOperation({ summary: 'List active employee store memberships' })
  stores(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.permissions.employeeMe(user.id);
  }
}

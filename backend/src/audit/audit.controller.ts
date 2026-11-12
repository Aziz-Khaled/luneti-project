import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { AuditService } from './audit.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Store Activity History')
@Controller('stores/:storeId/activity')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List paginated, store-scoped audit history' })
  list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: ActivityQueryDto,
  ) {
    return this.audit.list(user.id, storeId, query, query);
  }

  @Get('my-activity')
  @ApiOperation({ summary: 'List the authenticated employee’s own store activity' })
  myActivity(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: ActivityQueryDto,
  ) {
    return this.audit.list(user.id, storeId, query, {
      from: query.from,
      to: query.to,
      actorId: user.id,
      action: query.action,
      entityType: query.entityType,
      search: query.search,
    });
  }

  @Get(':activityId')
  @ApiOperation({ summary: 'Get an audit event from the authorized store' })
  get(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('activityId', ParseUUIDPipe) activityId: string,
  ) {
    return this.audit.get(user.id, storeId, activityId);
  }
}

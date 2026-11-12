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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's notifications" })
  list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() pagination: PaginationDto,
  ) {
    return this.notifications.list(user.id, pagination);
  }

  @Get('unread-count')
  @ApiOperation({ summary: "Get the authenticated user's unread count" })
  unreadCount(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.notifications.unreadCount(user.id);
  }

  @Post(':notificationId/read')
  @ApiOperation({ summary: 'Mark an owned notification as read' })
  markRead(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    return this.notifications.markRead(user.id, notificationId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all pending or sent notifications as read' })
  markAllRead(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.notifications.markAllRead(user.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: "List the authenticated user's notification preferences" })
  preferences(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.notifications.preferences(user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Create or update a notification-channel preference' })
  updatePreference(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: UpdateNotificationPreferenceDto,
  ) {
    return this.notifications.updatePreference(user.id, input);
  }
}

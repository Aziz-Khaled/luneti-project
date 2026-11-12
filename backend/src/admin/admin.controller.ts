import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RolePlateforme } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlatformRoles } from '../common/decorators/platform-roles.decorator';
import { PlatformRolesGuard } from '../common/guards/platform-roles.guard';
import { AuditQueryDto } from './dto/audit-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@PlatformRoles(RolePlateforme.SUPER_ADMIN)
@ApiBearerAuth()
@ApiTags('Platform Administration')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('audit-logs')
  @ApiOperation({ summary: 'List sanitized audit events (SUPER_ADMIN)' })
  auditLogs(@Query() query: AuditQueryDto) {
    return this.admin.auditLogs(query);
  }

  @Patch('product-reviews/:reviewId')
  @ApiOperation({ summary: 'Moderate a product review (SUPER_ADMIN)' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  moderateProductReview(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() input: ModerateReviewDto,
  ) {
    return this.admin.moderateProductReview(user.id, reviewId, input.statut);
  }

  @Patch('store-reviews/:reviewId')
  @ApiOperation({ summary: 'Moderate a store review (SUPER_ADMIN)' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  moderateStoreReview(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() input: ModerateReviewDto,
  ) {
    return this.admin.moderateStoreReview(user.id, reviewId, input.statut);
  }
}

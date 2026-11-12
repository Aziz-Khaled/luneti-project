import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CreateTryOnSessionDto } from './dto/create-try-on-session.dto';
import { VirtualTryOnService } from './virtual-try-on.service';

@ApiTags('Virtual Try-On')
@Controller('virtual-try-on')
export class VirtualTryOnController {
  constructor(private readonly tryOn: VirtualTryOnService) {}

  @Get('consent')
  @ApiOperation({ summary: 'Get the configured consent policy before opt-in' })
  consentPolicy() {
    return this.tryOn.consentPolicy();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('sessions')
  @ApiOperation({
    summary: 'Create a session after explicit consent using the current policy',
  })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CreateTryOnSessionDto,
  ) {
    return this.tryOn.create(user.id, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'List the authenticated user try-on sessions' })
  list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() pagination: PaginationDto,
  ) {
    return this.tryOn.list(user.id, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get an owned session and consent state' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  find(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.tryOn.find(user.id, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('sessions/:sessionId/withdraw-consent')
  @ApiOperation({ summary: 'Withdraw consent and close the owned session' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  withdrawConsent(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.tryOn.withdrawConsent(user.id, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Close an owned try-on session' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  remove(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.tryOn.remove(user.id, sessionId);
  }
}

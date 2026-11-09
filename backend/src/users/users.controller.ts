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
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List public active user profiles' })
  list(@Query() pagination: PaginationDto) {
    return this.users.list(pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  getMe(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.users.findMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  updateMe(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: UpdateUserProfileDto,
  ) {
    return this.users.updateMe(user.id, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me/profile')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  updateProfile(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: UpdateUserProfileDto,
  ) {
    return this.users.updateMe(user.id, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('me')
  @ApiOperation({ summary: 'Deactivate the authenticated user account' })
  deactivate(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.users.deactivate(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/followers')
  @ApiParam({ name: 'id', format: 'uuid' })
  followers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.users.followers(id, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/following')
  @ApiParam({ name: 'id', format: 'uuid' })
  following(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.users.following(id, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow a public user profile' })
  @ApiParam({ name: 'id', format: 'uuid' })
  follow(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.users.follow(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id/follow')
  @ApiOperation({ summary: 'Unfollow a user profile' })
  @ApiParam({ name: 'id', format: 'uuid' })
  unfollow(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.users.unfollow(user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a public user profile' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findPublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findPublic(id);
  }
}

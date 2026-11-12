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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { CreateShareDto } from './dto/create-share.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { SocialService } from './social.service';

@Controller('social')
@ApiTags('Social')
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Get('feed')
  @ApiOperation({ summary: 'List public active publications' })
  feed(@Query() pagination: PaginationDto) {
    return this.social.feed(pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/publications')
  @ApiOperation({ summary: 'List the authenticated user publications' })
  myPosts(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() pagination: PaginationDto,
  ) {
    return this.social.myPosts(user.id, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('publications')
  @ApiOperation({ summary: 'Create a user or authorized store publication' })
  createPost(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CreatePublicationDto,
  ) {
    return this.social.createPost(user.id, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('publications/:postId')
  @ApiOperation({ summary: 'Update a publication owned by the authenticated user' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  updatePost(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() input: UpdatePublicationDto,
  ) {
    return this.social.updatePost(user.id, postId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('publications/:postId')
  @ApiOperation({ summary: 'Soft-delete an owned publication' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  deletePost(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.social.deletePost(user.id, postId);
  }

  @Get('publications/:postId/comments')
  @ApiOperation({ summary: 'List comments for a public publication' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  comments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.social.comments(postId, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('publications/:postId/comments')
  @ApiOperation({ summary: 'Comment on a public publication' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  addComment(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() input: CreateCommentDto,
  ) {
    return this.social.addComment(user.id, postId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Soft-delete an owned comment' })
  @ApiParam({ name: 'commentId', format: 'uuid' })
  deleteComment(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.social.deleteComment(user.id, commentId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('publications/:postId/like')
  @ApiOperation({ summary: 'Like a public publication' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  like(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.social.like(user.id, postId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('publications/:postId/like')
  @ApiOperation({ summary: 'Unlike a publication' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  unlike(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.social.unlike(user.id, postId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('publications/:postId/repost')
  @ApiOperation({ summary: 'Repost a public publication' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  repost(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() input: CreateShareDto,
  ) {
    return this.social.repost(user.id, postId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('publications/:postId/repost')
  @ApiOperation({ summary: 'Remove an owned repost' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  unrepost(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.social.unrepost(user.id, postId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('stores/:storeId/follow')
  @ApiOperation({ summary: 'Follow an active store' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  followStore(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.social.followStore(user.id, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('stores/:storeId/follow')
  @ApiOperation({ summary: 'Unfollow a store' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  unfollowStore(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.social.unfollowStore(user.id, storeId);
  }
}

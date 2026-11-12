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
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
@ApiTags('Reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'List published reviews for an active product' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  listProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.reviews.listProduct(productId, pagination);
  }

  @Get('stores/:storeId/reviews')
  @ApiOperation({ summary: 'List published reviews for an active store' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  listStore(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.reviews.listStore(storeId, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('products/:productId/reviews')
  @ApiOperation({ summary: 'Submit a product review for moderation' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  createProduct(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() input: CreateReviewDto,
  ) {
    return this.reviews.createProduct(user.id, productId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('stores/:storeId/reviews')
  @ApiOperation({ summary: 'Submit a store review for moderation' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  createStore(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: CreateReviewDto,
  ) {
    return this.reviews.createStore(user.id, storeId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('reviews/:reviewId')
  @ApiOperation({ summary: 'Edit an owned review; status returns to moderation' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  update(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() input: UpdateReviewDto,
  ) {
    return this.reviews.update(user.id, reviewId, input);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('reviews/:reviewId')
  @ApiOperation({ summary: 'Delete an owned review' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  remove(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ) {
    return this.reviews.remove(user.id, reviewId);
  }
}

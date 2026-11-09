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
import { RolePlateforme } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformRoles } from '../common/decorators/platform-roles.decorator';
import { PlatformRolesGuard } from '../common/guards/platform-roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@ApiTags('Products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Search the active product catalog' })
  list(@Query() query: QueryProductsDto) {
    return this.products.list(query);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get an active product with variants and specifications' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  find(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.products.findPublic(productId);
  }

  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @PlatformRoles(RolePlateforme.ADMIN, RolePlateforme.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a catalog product (platform admin)' })
  create(@Body() input: CreateProductDto) {
    return this.products.create(input);
  }

  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @PlatformRoles(RolePlateforme.ADMIN, RolePlateforme.SUPER_ADMIN)
  @ApiBearerAuth()
  @Patch(':productId')
  @ApiOperation({ summary: 'Update a catalog product (platform admin)' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() input: UpdateProductDto,
  ) {
    return this.products.update(productId, input);
  }

  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @PlatformRoles(RolePlateforme.ADMIN, RolePlateforme.SUPER_ADMIN)
  @ApiBearerAuth()
  @Delete(':productId')
  @ApiOperation({ summary: 'Archive a catalog product (platform admin)' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  archive(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.products.archive(productId);
  }

  @Get(':productId/variants')
  @ApiOperation({ summary: 'List active product variants and specifications' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  variants(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.products.listVariants(productId);
  }

  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @PlatformRoles(RolePlateforme.ADMIN, RolePlateforme.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post(':productId/variants')
  @ApiOperation({ summary: 'Create a product variant (platform admin)' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  createVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() input: CreateProductVariantDto,
  ) {
    return this.products.createVariant(productId, input);
  }
}

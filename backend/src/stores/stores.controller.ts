import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
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
import { VerifyRneDto } from './dto/verify-rne.dto';
import { StoreImageFile, StoresService } from './stores.service';

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
  @Get(':storeId/manage')
  @ApiOperation({ summary: 'Get a store you manage, including draft stores' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  findForMember(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.stores.findForMember(user.id, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('verify-rne')
  @ApiOperation({ summary: 'Verify a Tunisian RNE registration code' })
  verifyRne(@Body() input: VerifyRneDto) {
    return this.stores.verifyRegistrationCode(input.code_enregistrement);
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
  @Post(':storeId/branding/:imageType')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const allowedTypes = [
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/avif',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          callback(new BadRequestException('Only PNG, JPEG, WebP, or AVIF images are allowed'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload a store logo or cover image' })
  uploadBrandingImage(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('imageType') imageType: string,
    @UploadedFile() file: StoreImageFile | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('An image file is required');
    }
    return this.stores.uploadBrandingImage(
      user.id,
      storeId,
      imageType,
      file,
    );
  }

  @Get(':storeId/branding/:filename')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  @ApiOperation({ summary: 'Get a public store branding image' })
  getBrandingImage(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('filename') filename: string,
  ) {
    const image = this.stores.getBrandingImage(storeId, filename);
    return new StreamableFile(image.stream, { type: image.contentType });
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
  @ApiOperation({ summary: 'Create an employee account for your store' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  createEmployee(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: CreateStoreMemberDto,
  ) {
    return this.stores.createEmployee(user.id, storeId, input);
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

import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { AuthenticatedRequest } from './auth.types';
import { AllowInitialPasswordChange } from './allow-initial-password-change.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
@ApiTags('Authentication')
@SkipThrottle()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register an account' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['prenom', 'nom', 'email', 'password'],
      properties: {
        prenom: { type: 'string', maxLength: 100 },
        nom: { type: 'string', maxLength: 100 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 12 },
      },
    },
  })
  register(@Body() body: unknown) {
    return this.authService.register(body);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Log in and obtain an access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
      },
    },
  })
  login(@Body() body: unknown) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @AllowInitialPasswordChange()
  @ApiOperation({ summary: 'Get the authenticated profile' })
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.authService.getSafeUser(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @AllowInitialPasswordChange()
  @ApiOperation({ summary: 'Change a temporary password' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string' },
        newPassword: { type: 'string', minLength: 12 },
      },
    },
  })
  changePassword(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.authService.changePassword(request.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the authenticated profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prenom: { type: 'string', maxLength: 100 },
        nom: { type: 'string', maxLength: 100 },
        nom_utilisateur: { type: 'string', maxLength: 50, nullable: true },
        telephone: { type: 'string', maxLength: 30, nullable: true },
        url_image_profil: { type: 'string', maxLength: 2048, nullable: true },
        langue_preferee: { type: 'string', maxLength: 10 },
      },
    },
  })
  updateProfile(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.authService.updateProfile(request.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate the authenticated account' })
  deactivate(@Req() request: AuthenticatedRequest) {
    return this.authService.deactivate(request.user.id);
  }
}

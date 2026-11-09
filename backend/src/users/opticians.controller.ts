import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateOpticianProfileDto } from './dto/update-optician-profile.dto';
import { OpticiansService } from './opticians.service';

@Controller('opticians/me')
@UseGuards(JwtAuthGuard)
@ApiTags('Opticians')
@ApiBearerAuth()
export class OpticiansController {
  constructor(private readonly opticians: OpticiansService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated optician profile' })
  getMe(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.opticians.findMe(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Create or update the authenticated optician profile' })
  updateMe(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: UpdateOpticianProfileDto,
  ) {
    return this.opticians.updateMe(user.id, input);
  }
}

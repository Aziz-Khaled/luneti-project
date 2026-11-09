import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { CustomersService } from './customers.service';

@Controller('clients/me')
@UseGuards(JwtAuthGuard)
@ApiTags('Clients')
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated client profile' })
  getMe(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.customers.findMe(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Create or update the authenticated client profile' })
  updateMe(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: UpdateClientProfileDto,
  ) {
    return this.customers.updateMe(user.id, input);
  }
}

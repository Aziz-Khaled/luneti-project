import {
  Body,
  Controller,
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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
@ApiTags('Appointments')
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get('appointments/me')
  @ApiOperation({ summary: "List the authenticated user's appointments" })
  listMine(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() pagination: PaginationDto,
  ) {
    return this.appointments.listMine(user.id, pagination);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Request an appointment at an active store' })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CreateAppointmentDto,
  ) {
    return this.appointments.create(user.id, input);
  }

  @Post('appointments/:appointmentId/cancel')
  @ApiOperation({ summary: 'Cancel an appointment owned by the authenticated user' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  cancel(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.appointments.cancelMine(user.id, appointmentId);
  }

  @Get('stores/:storeId/appointments')
  @ApiOperation({ summary: 'List appointments for a store you can manage' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  listStore(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.appointments.listStore(user.id, storeId, pagination);
  }

  @Patch('stores/:storeId/appointments/:appointmentId')
  @ApiOperation({ summary: 'Transition an appointment status as store staff' })
  @ApiParam({ name: 'storeId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  updateStatus(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() input: UpdateAppointmentStatusDto,
  ) {
    return this.appointments.updateStatus(
      user.id,
      storeId,
      appointmentId,
      input.statut,
    );
  }
}

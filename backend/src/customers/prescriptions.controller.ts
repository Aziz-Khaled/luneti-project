import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@Controller('clients/me/prescriptions')
@UseGuards(JwtAuthGuard)
@ApiTags('Prescriptions')
@ApiBearerAuth()
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated client's prescriptions" })
  list(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.prescriptions.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Create a prescription for the authenticated client" })
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CreatePrescriptionDto,
  ) {
    return this.prescriptions.create(user.id, input);
  }

  @Get(':prescriptionId')
  @ApiOperation({ summary: "Get a prescription owned by the authenticated client" })
  @ApiParam({ name: 'prescriptionId', format: 'uuid' })
  find(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('prescriptionId', ParseUUIDPipe) prescriptionId: string,
  ) {
    return this.prescriptions.find(user.id, prescriptionId);
  }

  @Patch(':prescriptionId')
  @ApiOperation({ summary: 'Update prescription metadata or replace eye details' })
  @ApiParam({ name: 'prescriptionId', format: 'uuid' })
  update(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('prescriptionId', ParseUUIDPipe) prescriptionId: string,
    @Body() input: UpdatePrescriptionDto,
  ) {
    return this.prescriptions.update(user.id, prescriptionId, input);
  }

  @Delete(':prescriptionId')
  @ApiOperation({ summary: 'Delete an owned prescription and its eye details' })
  @ApiParam({ name: 'prescriptionId', format: 'uuid' })
  remove(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('prescriptionId', ParseUUIDPipe) prescriptionId: string,
  ) {
    return this.prescriptions.remove(user.id, prescriptionId);
  }
}

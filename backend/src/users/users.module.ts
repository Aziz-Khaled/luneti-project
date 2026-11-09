import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { OpticiansController } from './opticians.controller';
import { OpticiansService } from './opticians.service';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController, OpticiansController, AddressesController],
  providers: [UsersService, OpticiansService, AddressesService],
  exports: [UsersService, OpticiansService, AddressesService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorePermissionsController, EmployeeController } from './store-permissions.controller';
import { StorePermissionsService } from './store-permissions.service';

@Module({
  imports: [AuthModule],
  controllers: [StorePermissionsController, EmployeeController],
  providers: [StorePermissionsService],
  exports: [StorePermissionsService],
})
export class MembershipsModule {}

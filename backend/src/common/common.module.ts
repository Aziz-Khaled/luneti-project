import { Global, Module } from '@nestjs/common';
import { StoreAuthorizationService } from './guards/store-authorization.service';
import { PlatformRolesGuard } from './guards/platform-roles.guard';

@Global()
@Module({
  providers: [PlatformRolesGuard, StoreAuthorizationService],
  exports: [PlatformRolesGuard, StoreAuthorizationService],
})
export class CommonModule {}

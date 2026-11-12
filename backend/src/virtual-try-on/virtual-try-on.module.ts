import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VirtualTryOnController } from './virtual-try-on.controller';
import { VirtualTryOnService } from './virtual-try-on.service';

@Module({
  imports: [AuthModule],
  controllers: [VirtualTryOnController],
  providers: [VirtualTryOnService],
  exports: [VirtualTryOnService],
})
export class VirtualTryOnModule {}

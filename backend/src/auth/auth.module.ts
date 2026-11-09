import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenService } from './jwt-token.service';
import { PasswordHasher } from './password-hasher.service';
import { SuperAdminGuard } from './super-admin.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtTokenService,
    PasswordHasher,
    JwtAuthGuard,
    SuperAdminGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    JwtTokenService,
    PasswordHasher,
    SuperAdminGuard,
  ],
})
export class AuthModule {}

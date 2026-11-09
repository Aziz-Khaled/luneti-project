import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RolePlateforme } from '@prisma/client';
import { AuthenticatedRequest } from './auth.types';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user?.role !== RolePlateforme.SUPER_ADMIN) {
      throw new ForbiddenException('Super-admin access is required');
    }
    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../../auth/auth.types';
import { PLATFORM_ROLES_KEY } from '../decorators/platform-roles.decorator';

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<
      AuthenticatedRequest['user']['role'][]
    >(PLATFORM_ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!roles.includes(request.user?.role)) {
      throw new ForbiddenException('Insufficient platform role');
    }
    return true;
  }
}

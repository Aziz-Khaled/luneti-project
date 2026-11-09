import { SetMetadata } from '@nestjs/common';
import { RolePlateforme } from '@prisma/client';

export const PLATFORM_ROLES_KEY = 'platform-roles';
export const PlatformRoles = (...roles: RolePlateforme[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);

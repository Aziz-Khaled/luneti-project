import { RolePlateforme } from '@prisma/client';
import type { Request } from 'express';

export interface AuthPrincipal {
  id: string;
  role: RolePlateforme;
  must_change_password?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthPrincipal;
}

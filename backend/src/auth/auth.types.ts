import { RolePlateforme } from '@prisma/client';
import type { Request } from 'express';

export interface AuthPrincipal {
  id: string;
  role: RolePlateforme;
}

export interface AuthenticatedRequest extends Request {
  user: AuthPrincipal;
}

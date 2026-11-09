import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { StatutUtilisateur } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedRequest } from './auth.types';
import { JwtTokenService } from './jwt-token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: JwtTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer access token is required');
    }

    const principal = this.tokens.verify(authorization.slice(7));
    const user = await this.prisma.utilisateur.findFirst({
      where: {
        id: principal.id,
        statut: StatutUtilisateur.ACTIVE,
        supprime_le: null,
      },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('Account is unavailable');
    }

    request.user = user;
    return true;
  }
}

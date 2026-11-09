import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { RolePlateforme } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AuthPrincipal } from './auth.types';

@Injectable()
export class JwtTokenService {
  private readonly lifetimeSeconds = 15 * 60;

  issue(principal: AuthPrincipal): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const header = this.encode({ alg: 'HS256', typ: 'JWT' });
    const payload = this.encode({
      ...principal,
      iat: issuedAt,
      exp: issuedAt + this.lifetimeSeconds,
    });
    const unsigned = `${header}.${payload}`;
    return `${unsigned}.${this.sign(unsigned)}`;
  }

  verify(token: string): AuthPrincipal {
    const [headerPart, payloadPart, signature, extra] = token.split('.');
    if (!headerPart || !payloadPart || !signature || extra !== undefined) {
      throw new UnauthorizedException('Invalid access token');
    }

    const unsigned = `${headerPart}.${payloadPart}`;
    const expected = Buffer.from(this.sign(unsigned), 'base64url');
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Invalid access token');
    }

    const header = this.decode(headerPart);
    const claims = this.decode(payloadPart);
    if (
      header.alg !== 'HS256' ||
      typeof claims.id !== 'string' ||
      !Object.values(RolePlateforme).includes(claims.role as RolePlateforme) ||
      typeof claims.exp !== 'number' ||
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return { id: claims.id, role: claims.role as RolePlateforme };
  }

  private sign(value: string): string {
    return createHmac('sha256', this.getSecret()).update(value).digest('base64url');
  }

  private getSecret(): string {
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new InternalServerErrorException(
        'AUTH_JWT_SECRET must be configured with at least 32 characters',
      );
    }
    return secret;
  }

  private encode(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private decode(value: string): Record<string, unknown> {
    try {
      const decoded: unknown = JSON.parse(
        Buffer.from(value, 'base64url').toString('utf8'),
      );
      if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
        throw new Error('Invalid JWT segment');
      }
      return decoded as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}

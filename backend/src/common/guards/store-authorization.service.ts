import { ForbiddenException, Injectable } from '@nestjs/common';
import { RoleMembre, StatutAdhesion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoreAuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMembership(
    userId: string,
    storeId: string,
    allowedRoles: RoleMembre[],
  ): Promise<{ role: RoleMembre }> {
    const membership = await this.prisma.membreMagasin.findFirst({
      where: {
        utilisateur_id: userId,
        magasin_id: storeId,
        statut: StatutAdhesion.ACTIVE,
        role: { in: allowedRoles },
      },
      select: { role: true },
    });
    if (!membership) {
      throw new ForbiddenException('Active store membership is required');
    }
    return membership;
  }
}

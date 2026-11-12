import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, StatutUtilisateur } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtTokenService } from './jwt-token.service';
import { PasswordHasher } from './password-hasher.service';

const userSelect = {
  id: true,
  role: true,
  prenom: true,
  nom: true,
  nom_utilisateur: true,
  email: true,
  telephone: true,
  url_image_profil: true,
  statut: true,
  doit_changer_mot_de_passe: true,
  langue_preferee: true,
  cree_le: true,
  modifie_le: true,
} satisfies Prisma.UtilisateurSelect;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: JwtTokenService,
  ) {}

  async register(input: unknown) {
    if (!isRecord(input)) {
      throw new BadRequestException('A JSON object is required');
    }
    const prenom = requiredString(input.prenom, 'prenom', 100);
    const nom = requiredString(input.nom, 'nom', 100);
    const email = requiredString(input.email, 'email', 255).toLowerCase();
    const password = requiredString(input.password, 'password', 1024);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid email address is required');
    }
    if (password.length < 12) {
      throw new BadRequestException('Password must be at least 12 characters');
    }

    try {
      const user = await this.prisma.utilisateur.create({
        data: {
          prenom,
          nom,
          email,
          empreinte_mot_de_passe: await this.passwordHasher.hash(password),
          statut: StatutUtilisateur.ACTIVE,
        },
        select: userSelect,
      });
      return {
        user,
        accessToken: this.tokens.issue({ id: user.id, role: user.role }),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account already exists for that email or username',
        );
      }
      throw error;
    }
  }

  async login(input: unknown) {
    if (!isRecord(input)) {
      throw new BadRequestException('A JSON object is required');
    }
    const email = requiredString(input.email, 'email', 255).toLowerCase();
    const password = requiredString(input.password, 'password', 1024);
    const user = await this.prisma.utilisateur.findFirst({
      where: { email, supprime_le: null },
    });

    if (
      !user ||
      !(await this.passwordHasher.verify(password, user.empreinte_mot_de_passe))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.statut !== StatutUtilisateur.ACTIVE) {
      throw new UnauthorizedException('This account is not active');
    }

    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { derniere_connexion_le: new Date() },
    });
    return {
      user: await this.getSafeUser(user.id),
      accessToken: this.tokens.issue({ id: user.id, role: user.role }),
    };
  }

  async changePassword(id: string, input: unknown) {
    if (!isRecord(input)) {
      throw new BadRequestException('A JSON object is required');
    }
    const currentPassword = requiredString(
      input.currentPassword,
      'currentPassword',
      1024,
    );
    const newPassword = requiredString(input.newPassword, 'newPassword', 1024);
    if (newPassword.length < 12) {
      throw new BadRequestException('Password must be at least 12 characters');
    }

    const user = await this.prisma.utilisateur.findFirst({
      where: { id, supprime_le: null, statut: StatutUtilisateur.ACTIVE },
      select: { empreinte_mot_de_passe: true },
    });
    if (
      !user ||
      !(await this.passwordHasher.verify(
        currentPassword,
        user.empreinte_mot_de_passe,
      ))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (
      await this.passwordHasher.verify(newPassword, user.empreinte_mot_de_passe)
    ) {
      throw new BadRequestException(
        'New password must be different from the temporary password',
      );
    }

    await this.prisma.utilisateur.update({
      where: { id },
      data: {
        empreinte_mot_de_passe: await this.passwordHasher.hash(newPassword),
        doit_changer_mot_de_passe: false,
      },
    });
    return this.getSafeUser(id);
  }

  async getSafeUser(id: string) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id, supprime_le: null },
      select: userSelect,
    });
    if (!user) {
      throw new UnauthorizedException('Account is unavailable');
    }
    return user;
  }

  async updateProfile(id: string, input: unknown) {
    if (!isRecord(input)) {
      throw new BadRequestException('A JSON object is required');
    }
    const allowedFields = [
      'prenom',
      'nom',
      'nom_utilisateur',
      'telephone',
      'url_image_profil',
      'langue_preferee',
    ] as const;
    const data: Prisma.UtilisateurUpdateManyMutationInput = {};

    for (const field of allowedFields) {
      if (Object.hasOwn(input, field)) {
        const value = input[field];
        if (value !== null && typeof value !== 'string') {
          throw new BadRequestException(`${field} must be a string`);
        }
        Object.assign(data, { [field]: value });
      }
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'No supported profile fields were provided',
      );
    }

    try {
      await this.prisma.utilisateur.updateMany({
        where: { id, supprime_le: null },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('That username is already in use');
      }
      throw error;
    }
    return this.getSafeUser(id);
  }

  async deactivate(id: string) {
    const result = await this.prisma.utilisateur.updateMany({
      where: { id, supprime_le: null },
      data: { supprime_le: new Date(), statut: StatutUtilisateur.DESACTIVE },
    });
    if (result.count === 0) {
      throw new UnauthorizedException('Account is unavailable');
    }
    return { success: true };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(
  value: unknown,
  field: string,
  maximumLength: number,
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length > maximumLength
  ) {
    throw new BadRequestException(
      `${field} must be a non-empty string of at most ${maximumLength} characters`,
    );
  }
  return value.trim();
}

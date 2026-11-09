import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

@Injectable()
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const key = await this.derive(password, salt);
    return `scrypt$${salt}$${key.toString('hex')}`;
  }

  async verify(password: string, encoded: string): Promise<boolean> {
    const [algorithm, salt, hash] = encoded.split('$');
    if (algorithm !== 'scrypt' || !salt || !hash || !/^[\da-f]{128}$/i.test(hash)) {
      return false;
    }

    const expected = Buffer.from(hash, 'hex');
    const actual = await this.derive(password, salt);
    return timingSafeEqual(expected, actual);
  }

  private derive(password: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(password, salt, 64, (error, key) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(key);
      });
    });
  }
}

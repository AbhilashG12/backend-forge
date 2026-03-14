import bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../domain/repos/IAuthService.js';

export class BcryptHasher implements IPasswordHasher {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
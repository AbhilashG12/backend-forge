import jwt from 'jsonwebtoken';
import { ITokenService } from '../../domain/repos/IAuthService.js';

export class JwtTokenService implements ITokenService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET || 'dev-secret';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, this.accessSecret, { expiresIn: '15m' });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.refreshSecret, { expiresIn: '7d' });
  }
}
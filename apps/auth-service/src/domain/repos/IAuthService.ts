export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export interface ITokenService {
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string): string;
}
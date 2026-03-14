import { IUserRepo } from '../../domain/repos/IUserRepo.js';
import { IPasswordHasher, ITokenService } from "../../domain/repos/IAuthService.js"

export class LoginUser {
  constructor(
    private userRepository: IUserRepo,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService
  ) {}

  async execute(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials'); 
    }

    const isPasswordValid = await this.passwordHasher.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken(user.id);
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    };
  }
}
import { IUserRepo } from '../../domain/repos/IUserRepo.js';
import { IPasswordHasher, ITokenService } from '../../domain/repos/IAuthService.js';

export class RegisterUser {
  constructor(
    private userRepository: IUserRepo,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService
  ) {}

  async execute(email: string, password: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email is already in use'); 
    }
    const hashedPassword = await this.passwordHasher.hash(password);
    const newUser = await this.userRepository.save({
      email,
      passwordHash: hashedPassword,
    });
    const accessToken = this.tokenService.generateAccessToken(newUser.id);
    const refreshToken = this.tokenService.generateRefreshToken(newUser.id);

    return {
      user: { id: newUser.id, email: newUser.email },
      accessToken,
      refreshToken,
    };
  }
}
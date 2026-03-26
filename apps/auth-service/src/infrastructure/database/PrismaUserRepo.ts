import { PrismaClient } from '../../../prisma/generated/client/client.js';
import { IUserRepo } from '../../domain/repos/IUserRepo.js';
import { User } from '../../domain/entities/User.js';

export class PrismaUserRepo implements IUserRepo {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async save(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role || 'user',  
        name: user.name || null, 
    }
  });
  }
}
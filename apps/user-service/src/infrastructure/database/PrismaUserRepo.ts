import { PrismaClient } from '../../../prisma/generated/prisma/client.js';
import { IUserRepo,PaginatedResult } from '../../domain/repos/IUserRepo.js';
import { User } from '../../domain/entities/User.js';

export class PrismaUserRepository implements IUserRepo {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async list(page: number, limit: number, roleFilter?: string): Promise<PaginatedResult<User>> {
    const skip = (page - 1) * limit;
    const where = roleFilter ? { role: roleFilter } : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit }),
      this.prisma.user.count({ where })
    ]);

    return { data, total, page, limit };
  }
}
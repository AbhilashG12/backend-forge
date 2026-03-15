import { Redis } from 'ioredis';
import { IUserCache } from '../../domain/repos/IUserCache.js';
import { User } from '../../domain/entities/User.js';

export class RedisUserCache implements IUserCache {
  constructor(private redis: Redis) {}

  private getKey(id: string) {
    return `user:${id}`;
  }

  async get(id: string): Promise<User | null> {
    const data = await this.redis.get(this.getKey(id));
    return data ? JSON.parse(data) : null;
  }

  async set(id: string, user: User, ttlSeconds: number): Promise<void> {
    await this.redis.set(this.getKey(id), JSON.stringify(user), 'EX', ttlSeconds);
  }

  async invalidate(id: string): Promise<void> {
    await this.redis.del(this.getKey(id));
  }
}
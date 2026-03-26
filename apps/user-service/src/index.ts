import 'dotenv/config';
import express from "express";
import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { Redis } from 'ioredis';

import { PrismaUserRepository } from './infrastructure/database/PrismaUserRepo';
import { RedisUserCache } from './infrastructure/cache/RedisUserCache';
import { UserUseCase } from './application/use-cases/UserUseCase';
import { UserController } from './interfaces/controller/UserController';

async function bootstrap(){
    const app = express();
    app.use(express.json());

    const dbUrl = new URL(process.env.DATABASE_URL || 'mysql://root:root@127.0.0.1:3306/backend-forge');
    const adapter = new PrismaMariaDb({
        host: '127.0.0.1', 
        port: Number(dbUrl.port) || 3307,
        user: dbUrl.username || 'root',
        password: dbUrl.password || 'root',
        database: dbUrl.pathname.substring(1) || 'backend-forge', 
        connectionLimit: 10,
    });

    const prisma = new PrismaClient({adapter});
    
    const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

    const userRepo = new PrismaUserRepository(prisma);
    const userCache = new RedisUserCache(redis);
    const useCase = new UserUseCase(userRepo,userCache);
    const controller = new UserController(useCase);

    app.post('/users', controller.create);
    app.get('/users/:id', controller.get);
    app.patch('/users/:id', controller.update);
    app.delete('/users/:id', controller.delete);
    app.get('/users', controller.list);

    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => console.log(`✅ User Service running on http://localhost:${PORT}`));
}

bootstrap().catch(console.error);
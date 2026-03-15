import 'dotenv/config';
import express from "express";
import {PrismaClient} from "../prisma/generated/prisma/client";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { Redis } from 'ioredis';

import { PrismaUserRepository } from './infrastructure/database/PrismaUserRepo';
import { RedisUserCache } from './infrastructure/cache/RedisUserCache';
import { UserUseCase } from './application/use-cases/UserUseCase';
import { UserController } from './interfaces/controller/UserController';

async function bootstrap(){
    const app = express();
    app.use(express.json());

    const dbUrl = new URL(process.env.DATABASE_URL!);
    
    const adapter = new PrismaMariaDb({
        host: dbUrl.hostname,
        port: Number(dbUrl.port) || 3307,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.substring(1), 
        connectionLimit: 10,
    } as any);

    const prisma = new PrismaClient({adapter})
    const redis = new Redis(process.env.REDIS_URL!)

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
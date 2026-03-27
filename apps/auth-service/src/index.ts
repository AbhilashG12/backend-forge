import "dotenv/config"
import express from 'express';
import {createClient} from "redis";
import { PrismaClient } from '../prisma/generated/client/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { BcryptHasher } from './infrastructure/crypography/BcryptHasher.js';
import { JwtTokenService } from './infrastructure/auth/JwtTokenService.js';
import { PrismaUserRepo } from './infrastructure/database/PrismaUserRepo.js';
import { LoginUser } from './application/use-cases/LoginUser.js';
import { AuthController } from './interfaces/Controller/AuthController.js';
import { createAuthRouter } from './interfaces/routes/AuthRoutes.js';
import { RegisterUser } from "./application/use-cases/RegisterUser.js";

async function bootstrap() {
  const app = express();
  
  app.use(express.json());

  const dbUrl = new URL(process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/backend-forge');

    const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 3307,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.substring(1), 
    connectionLimit: 10,
    allowPublicKeyRetrieval : true,
  });

  const prisma = new PrismaClient({adapter});

  const userRepository = new PrismaUserRepo(prisma);
  const passwordHasher = new BcryptHasher();
  const tokenService = new JwtTokenService();

  const registerUserUseCase = new RegisterUser(
    userRepository,
    passwordHasher,
    tokenService
  )

  const loginUserUseCase = new LoginUser(
    userRepository,
    passwordHasher,
    tokenService
  );

  const authController = new AuthController(registerUserUseCase,loginUserUseCase);
  const authRouter = createAuthRouter(authController);
  app.use('/api/auth', authRouter);
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'auth-service' });
  });

  app.get('/health', async (req, res) => {
  const healthStatus = {
    service: 'auth-service',
    status: 'UP',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'DOWN',
      redis: 'DOWN',
    }
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.checks.database = 'UP';
    const ping = await redisClient.ping();
    if (ping === 'PONG') healthStatus.checks.redis = 'UP';

    const isHealthy = Object.values(healthStatus.checks).every(v => v === 'UP');
    
    res.status(isHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({ ...healthStatus, status: 'DEGRADED' });
  }
});

  const PORT = process.env.PORT || 3001;
  
  app.listen(PORT, () => {
    console.log(`✅ Auth Service is running on http://localhost:${PORT}`);
  });

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start Auth Service:', error);
  process.exit(1);
});
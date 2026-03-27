import "dotenv/config";
import express from 'express';
import { createClient } from "redis";
import winston from 'winston';
import { PrismaClient } from '../prisma/generated/client/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { BcryptHasher } from './infrastructure/crypography/BcryptHasher.js';
import { JwtTokenService } from './infrastructure/auth/JwtTokenService.js';
import { PrismaUserRepo } from './infrastructure/database/PrismaUserRepo.js';
import { LoginUser } from './application/use-cases/LoginUser.js';
import { AuthController } from './interfaces/Controller/AuthController.js';
import { createAuthRouter } from './interfaces/routes/AuthRoutes.js';
import { RegisterUser } from "./application/use-cases/RegisterUser.js";

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'auth-service' },
  transports: [new winston.transports.Console()],
});

async function bootstrap() {
  const app = express();
  app.use(express.json());

  
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redisClient.on('error', (err) => logger.error('Redis Client Error', { err }));
  await redisClient.connect();

  const dbUrl = new URL(process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/backend-forge');

  const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 3306,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.substring(1),
    connectionLimit: 10,
    allowPublicKeyRetrieval: true,
  });

  const prisma = new PrismaClient({ adapter });

  const userRepository = new PrismaUserRepo(prisma);
  const passwordHasher = new BcryptHasher();
  const tokenService = new JwtTokenService();

  const registerUserUseCase = new RegisterUser(userRepository, passwordHasher, tokenService);
  const loginUserUseCase = new LoginUser(userRepository, passwordHasher, tokenService);

  const authController = new AuthController(registerUserUseCase, loginUserUseCase);
  const authRouter = createAuthRouter(authController);

  
  app.use('/api/auth', authRouter);
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
      logger.error('Health check failed', { error: error instanceof Error ? error.message : error });
      res.status(503).json({ ...healthStatus, status: 'DEGRADED' });
    }
  });

  const PORT = process.env.PORT || 3001;

  app.listen(PORT, () => {
    logger.info(`✅ Auth Service is running`, { port: PORT, url: `http://localhost:${PORT}` });
  });

  process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    await prisma.$disconnect();
    await redisClient.disconnect();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start Auth Service', { error: error.message });
  process.exit(1);
});
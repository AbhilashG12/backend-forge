import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import { pino } from 'pino';
import helmet from 'helmet';
import cors from 'cors';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      user?: { userId?: string; id?: string; role?: string };
      traceId?: string;
    }
  }
}

async function bootstrap() {
  const app = express();
  const redis = new Redis(process.env.REDIS_URL || 'redis://platform-redis:6379');
  const logger = pino({ 
    level: 'info',
    base: { service: 'api-gateway' }
  });

  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
  }));
  app.use(express.json({ limit: '10kb' }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
    req.traceId = traceId;
    res.setHeader('x-trace-id', traceId);
    logger.info({ traceId, method: req.method, url: req.url, ip: req.ip }, 'Incoming Request');
    next();
  });

  const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (err: any) {
      res.status(400).json({ error: 'Validation Failed', details: err.errors });
    }
  };

  const verifyJwt = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      logger.warn({ traceId: req.traceId }, 'Missing JWT Token');
      res.status(401).json({ error: 'Gateway: Missing JWT Token' });
      return;
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      req.user = decoded;
      next();
    } catch (err) {
      res.status(403).json({ error: 'Gateway: Invalid Token' });
    }
  };

  const rateLimiter = (limit: number, windowSec: number = 60) => 
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const identifier = req.user?.userId || req.user?.id || req.ip || 'anon';
        const key = `rl:${identifier}`;
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, windowSec);
        if (count > limit) {
          res.status(429).json({ error: 'Too many requests' });
          return;
        }
        next();
      } catch (err) {
        next();
      }
    };

  const proxyOptions = (target: string, pathPrefix: string) => ({
    target,
    changeOrigin: true,
    pathRewrite: { [`^/api/${pathPrefix}`]: `/${pathPrefix}/` },
    on: {
      proxyReq: (proxyReq: any, req: Request) => {
        proxyReq.setHeader('x-trace-id', req.traceId || '');
        const userId = req.user?.userId || req.user?.id;
        if (userId) proxyReq.setHeader('x-user-id', String(userId));
        logger.info({ traceId: req.traceId, target: `${target}${proxyReq.path}` }, `➡️ [PROXY] ${pathPrefix}`);
      },
      proxyRes: (proxyRes: any, req: Request) => {
        logger.info({ traceId: req.traceId, status: proxyRes.statusCode }, `⬅️ [PROXY] ${pathPrefix} Res`);
      },
      error: (err: Error, req: any, res: any) => {
        if (!res.headersSent) res.status(502).json({ error: 'Proxy Error' });
      }
    }
  });

  const authSchema = z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(6)
    })
  });

  app.use('/api/auth', validate(authSchema), rateLimiter(10), createProxyMiddleware(proxyOptions('http://auth-service:3001', 'auth')));
  app.use('/api/users', verifyJwt, rateLimiter(50), createProxyMiddleware(proxyOptions('http://user-service:3002', 'users')));
  app.use('/api/jobs', verifyJwt, rateLimiter(20), createProxyMiddleware(proxyOptions('http://job-service:3003', 'jobs')));

  app.get('/health', (req, res) => {
    res.json({ service: 'api-gateway', status: 'UP', traceId: req.traceId });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info({ port: PORT }, '🚀 API Gateway Production Ready');
  });
}

bootstrap().catch((err) => {
  pino().error(err, 'Bootstrap Failed');
});
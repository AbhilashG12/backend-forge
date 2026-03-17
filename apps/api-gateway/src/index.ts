import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import {Redis} from 'ioredis';
import jwt from 'jsonwebtoken';
import { pino } from 'pino';


declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

async function bootstrap() {
  const app = express();
  const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

  const logger = pino({ level: 'info' });
  
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info({ 
      userId: req.user?.id || 'anonymous', 
      method: req.method, 
      url: req.url 
    }, 'Incoming Request');
    next();
  });

  const verifyJwt = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'Gateway: Missing JWT Token' });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
      req.user = decoded; 
      next();
    } catch (err) {
      res.status(403).json({ error: 'Gateway: Invalid or Expired Token' });
      return;
    }
  };

  const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.user?.id || req.ip || 'unknown-ip';
      const redisKey = `rate:user:${identifier}`;
      
      const requests = await redis.incr(redisKey);
      
      if (requests === 1) {
        await redis.expire(redisKey, 60);
      }

      if (requests > 100) {
        res.status(429).json({ error: 'Gateway: Rate limit exceeded. 100 requests per minute allowed.' });
        return;
      }

      next();
    } catch (err) {
      logger.error(err, 'Redis Rate Limiter Error');
      next(); 
    }
  };


  app.use('/api/auth', rateLimiter, createProxyMiddleware({ 
    target: 'http://localhost:3001', 
    changeOrigin: true,
  }));

  app.use('/api/users', verifyJwt, rateLimiter, createProxyMiddleware({ 
    target: 'http://localhost:3002', 
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/users' },
    on: {
      proxyReq: (proxyReq, req: any) => {
        if (req.user) proxyReq.setHeader('x-user-id', req.user.id);
      }
    }
  }));

  app.use('/api/jobs', verifyJwt, rateLimiter, createProxyMiddleware({ 
    target: 'http://localhost:3003', 
    changeOrigin: true,
    pathRewrite: { '^/api/jobs': '/jobs' },
    on: {
      proxyReq: (proxyReq, req: any) => {
        if (req.user) proxyReq.setHeader('x-user-id', req.user.id);
      }
    }
  }));
  app.listen(process.env.PORT || 3000, () => {
    logger.info('🚀 API Gateway locked and loaded on http://localhost:3000');
  });
}

bootstrap().catch(console.error);
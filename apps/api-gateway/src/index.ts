import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import { pino } from 'pino';

declare global {
  namespace Express {
    interface Request {
      user?: { userId?: string; id?: string; role?: string };
    }
  }
}

async function bootstrap() {
  const app = express();
  const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
  const logger = pino({ level: 'info' });

  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info({ 
      userId: req.user?.userId || req.user?.id || 'anonymous', 
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId?: string; id?: string; role?: string };
      console.log('🔍 DECODED JWT PAYLOAD:', decoded);
      req.user = decoded; 
      next();
    } catch (err) {
      res.status(403).json({ error: 'Gateway: Invalid or Expired Token' });
      return;
    }
  };

  const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.user?.userId || req.user?.id || req.ip || 'unknown-ip';
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
    target: 'http://127.0.0.1:3001', 
    changeOrigin: true,
    pathRewrite: { '^/': '/api/auth/' },
    on: {
      proxyReq: (proxyReq, req: any) => {
        console.log(`➡️  [PROXY] Forwarding ${req.method} to target: http://127.0.0.1:3001${proxyReq.path}`);
      },
      proxyRes: (proxyRes) => {
        console.log(`⬅️  [PROXY] Auth Service returned status: ${proxyRes.statusCode}`);
      },
      error: (err, req, res) => {
        console.error('❌ [PROXY ERROR to Auth]', err.message);
        const response = res as Response;
        if (!response.headersSent) {
          response.status(502).json({ error: 'Gateway Proxy Error', details: err.message });
        }
      }
    }
  }));

  app.use('/api/users', verifyJwt, rateLimiter, createProxyMiddleware({ 
    target: 'http://127.0.0.1:3002', 
    changeOrigin: true,
    pathRewrite: { '^/': '/users/' }, 
    on: {
      proxyReq: (proxyReq, req: any) => {
        const userId = req.user?.userId || req.user?.id;
        if (userId) {
          proxyReq.setHeader('x-user-id', String(userId));
        }
      },
      error: (err, req, res) => {
        console.error('❌ [PROXY ERROR to User]', err.message);
        const response = res as Response;
        if (!response.headersSent) {
          response.status(502).json({ error: 'Gateway Proxy Error', details: err.message });
        }
      }
    }
  }));

  app.use('/api/jobs', verifyJwt, rateLimiter, createProxyMiddleware({ 
    target: 'http://127.0.0.1:3003', 
    changeOrigin: true,
    pathRewrite: { '^/': '/jobs/' }, 
    on: {
      proxyReq: (proxyReq, req: any) => {
        const userId = req.user?.userId || req.user?.id;
        if (userId) {
          proxyReq.setHeader('x-user-id', String(userId));
        }
      },
      error: (err, req, res) => {
        console.error('❌ [PROXY ERROR to Job]', err.message);
        const response = res as Response;
        if (!response.headersSent) {
          response.status(502).json({ error: 'Gateway Proxy Error', details: err.message });
        }
      }
    }
  }));

  app.listen(process.env.PORT || 3000, () => {
    logger.info('🚀 API Gateway locked and loaded on http://localhost:3000');
  });
}

bootstrap().catch(console.error);
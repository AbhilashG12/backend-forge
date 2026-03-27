import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: process.env.SERVICE_NAME || 'unknown-service' },
  transports: [
    new winston.transports.Console(),
  ],
});
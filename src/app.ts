import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '@config/index.js';
import { requestLogger } from '@middleware/request-logger.js';
import { errorHandler } from '@middleware/error-handler.js';
import { generalLimiter } from '@middleware/rate-limit.js';
import routes from './routes/index.js';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Disable x-powered-by header
  app.disable('x-powered-by');

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Rate limiting
  app.use(generalLimiter);

  // API routes
  app.use(`/api/${config.apiVersion}`, routes);

  // 404 handler - must be a regular middleware, not a route
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  // Error handling
  app.use(errorHandler);

  return app;
};

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { config } from './config/index.js';
import { errorHandler } from './middleware/error.handler.js';
import { requestLogger } from './middleware/logger.middleware.js';

// Routes
import authRoutes from './api/auth/routes.js';
import courseRoutes from './api/courses/routes.js';
import campaignRoutes from './api/campaigns/routes.js';
import analyticsRoutes from './api/analytics/routes.js';
import userRoutes from './api/users/routes.js';

// Logger
const logger = pino();

// Express app
const app: Express = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(requestLogger);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/users', userRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port || 3001;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;

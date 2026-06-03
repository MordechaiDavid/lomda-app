import express, { Express, Request, Response } from 'express';
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

import authRoutes from './api/auth/routes.js';
import courseRoutes from './api/courses/routes.js';
import campaignRoutes from './api/campaigns/routes.js';
import analyticsRoutes from './api/analytics/routes.js';
import userRoutes from './api/users/routes.js';

const logger = pino();

const app: Express = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(requestLogger);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/users', userRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  });
});

app.use(errorHandler);

export default app;

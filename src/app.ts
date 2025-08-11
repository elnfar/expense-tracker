import express, { Application, Request, Response, NextFunction } from 'express';
import config from './config';
import { errorHandler } from './helpers/middlewares/errorHandler';
import { expensesRouter, systemRouter } from './routes';
import prismaService from './db/prisma.service';
import Logger from './helpers/Logger';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  Logger.http(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check route
app.use('/', systemRouter);

// API routes
app.use('/api', systemRouter);
app.use('/api/expenses', expensesRouter);

app.use('*', (req: Request, res: Response) => {
  Logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: {
      health: 'GET /health',
      api: 'GET /api',
      expenses: 'GET /api/expenses',
    },
  });
});

app.use(errorHandler);

export const startServer = (): void => {
  const server = app.listen(config.port, () => {
    Logger.info(`🚀 Server is running on port ${config.port}`);
    Logger.info(`📍 Environment: ${config.nodeEnv}`);
    Logger.info(`🔗 Health check: http://localhost:${config.port}/health`);
    Logger.info(
      `💰 Expenses API: http://localhost:${config.port}/api/expenses`
    );
  });

  const shutdown = async () => {
    Logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(async () => {
      Logger.info('Server closed.');
      await prismaService.disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

export default app;

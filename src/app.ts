import express, { Application, Request, Response, NextFunction } from 'express';
import config from './config';
import { errorHandler } from './helpers/middlewares/errorHandler';
import { ExpensesController } from './expenses/expenses.controller';
import {
  validateCreateExpense,
  validateUpdateExpense,
  validateExpenseId,
} from './helpers/middlewares/validator';
import prismaService from './db/prisma.service';
import Logger from './helpers/Logger';

const app: Application = express();

try {
  Logger.info('✅ Prisma service initialized');
} catch (error) {
  Logger.error('❌ Failed to initialize Prisma service:', error);
  process.exit(1);
}

const expensesController = new ExpensesController();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  Logger.http(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.get('/api/ping', (_req: Request, res: Response) => {
  Logger.debug('Ping endpoint accessed');
  res.json({ message: 'pong' });
});

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbConnected = await prismaService.isConnected();

    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      port: config.port,
      database: dbConnected ? 'connected' : 'disconnected',
      environment: config.nodeEnv,
    };

    Logger.debug('Health check performed', healthStatus);
    res.json(healthStatus);
  } catch (error) {
    Logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

app.post(
  '/api/expenses',
  validateCreateExpense,
  expensesController.createExpense
);

app.get('/api/expenses', expensesController.getAllExpenses);

app.get('/api/expenses/stats', expensesController.getExpenseStats);

app.get(
  '/api/expenses/search',
  (req: Request, res: Response, next: NextFunction) => {
    const { category, startDate, endDate } = req.query;

    if (category) {
      expensesController.getExpensesByCategory(req, res, next);
    } else if (startDate && endDate) {
      expensesController.getExpensesByDateRange(req, res, next);
    } else {
      Logger.warn('Invalid search parameters provided');
      res.status(400).json({
        success: false,
        error:
          'Please provide either category or both startDate and endDate parameters',
      });
    }
  }
);

app.get(
  '/api/expenses/:id',
  validateExpenseId,
  expensesController.getExpenseById
);

app.put(
  '/api/expenses/:id',
  validateExpenseId,
  validateUpdateExpense,
  expensesController.updateExpense
);

app.patch(
  '/api/expenses/:id',
  validateExpenseId,
  validateUpdateExpense,
  expensesController.updateExpense
);

app.delete(
  '/api/expenses/:id',
  validateExpenseId,
  expensesController.deleteExpense
);

app.get('/api', (_req: Request, res: Response) => {
  Logger.debug('API routes summary accessed');
  res.json({
    success: true,
    message: 'Expense Tracker API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      ping: 'GET /api/ping',
      expenses: {
        create: 'POST /api/expenses',
        getAll: 'GET /api/expenses',
        getById: 'GET /api/expenses/:id',
        update: 'PUT /api/expenses/:id',
        delete: 'DELETE /api/expenses/:id',
        search: 'GET /api/expenses/search',
        stats: 'GET /api/expenses/stats',
      },
    },
  });
});

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

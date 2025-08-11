import { Router, Request, Response } from 'express';
import config from '../config';
import prismaService from '../db/prisma.service';
import Logger from '../helpers/Logger';

const router = Router();

// GET /health - Health check endpoint
router.get('/health', async (_req: Request, res: Response) => {
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

// GET /api/ping - Simple ping endpoint
router.get('/ping', (_req: Request, res: Response) => {
  Logger.debug('Ping endpoint accessed');
  res.json({ message: 'pong' });
});

// GET /api - API routes summary
router.get('/', (_req: Request, res: Response) => {
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

export default router;

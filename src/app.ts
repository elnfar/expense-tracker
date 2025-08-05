import express, { Application, Request, Response } from 'express';
import config from './config';
import { errorHandler } from './helpers/middlewares/errorHandler';
import { ExpensesController } from './expenses/expenses.controller';
import prismaService from './db/prisma.service';

// Create Express application
const app: Application = express();

// Initialize database connection
try {
  // Prisma service is initialized when imported
  console.log('✅ Prisma service initialized');
} catch (error) {
  console.error('❌ Failed to initialize Prisma service:', error);
  process.exit(1);
}

// Initialize controllers
const expensesController = new ExpensesController();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ message: 'pong' });
});

// Health check route
app.get('/health', async (_req: Request, res: Response) => {
  const dbConnected = await prismaService.isConnected();

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: config.port,
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

// Expense routes
// POST /api/expenses - Create a new expense
app.post('/api/expenses', expensesController.createExpense);

// GET /api/expenses - Get all expenses
app.get('/api/expenses', expensesController.getAllExpenses);

// GET /api/expenses/stats - Get expense statistics
app.get('/api/expenses/stats', expensesController.getExpenseStats);

// GET /api/expenses/search - Search expenses by category or date range
app.get('/api/expenses/search', (req: Request, res: Response) => {
  const { category, startDate, endDate } = req.query;

  if (category) {
    expensesController.getExpensesByCategory(req, res);
  } else if (startDate && endDate) {
    expensesController.getExpensesByDateRange(req, res);
  } else {
    res.status(400).json({
      success: false,
      error:
        'Please provide either category or both startDate and endDate parameters',
    });
  }
});

// GET /api/expenses/:id - Get expense by ID
app.get('/api/expenses/:id', expensesController.getExpenseById);

// PUT /api/expenses/:id - Update expense
app.put('/api/expenses/:id', expensesController.updateExpense);

// DELETE /api/expenses/:id - Delete expense
app.delete('/api/expenses/:id', expensesController.deleteExpense);

// 404 handler for unknown routes
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server function
export const startServer = (): void => {
  const server = app.listen(config.port, () => {
    console.log(`🚀 Server is running on port ${config.port}`);
    console.log(`📍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    console.log(
      `💰 Expenses API: http://localhost:${config.port}/api/expenses`
    );
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(async () => {
      console.log('Server closed.');
      await prismaService.disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

export default app;

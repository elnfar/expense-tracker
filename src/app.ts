import express, { Application, Request, Response } from 'express';
import config from './config';
import { errorHandler } from './helpers/middlewares/errorHandler';

// Create Express application
const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({ message: 'pong' });
});

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: config.port
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
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
};

export default app;
  
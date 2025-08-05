import { Request, Response, NextFunction } from 'express';


export const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', error);

  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack })
    }
  });
}; 
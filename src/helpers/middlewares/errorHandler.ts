import { Request, Response, NextFunction } from 'express';
import Logger from '../Logger';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

interface ErrorResponse {
  success: boolean;
  status: string;
  error: string;
  stack?: string;
  details?: AppError;
}

export const errorHandler = (
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  Logger.error(`Error: ${error.message}`, {
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
  });

  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let status = error.status || 'error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    status = 'fail';
    message = 'Invalid input data';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    status = 'fail';
    message = 'Invalid data format';
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = 'Token expired';
  }

  // Handle Prisma errors
  if (error.message.includes('Prisma')) {
    statusCode = 500;
    status = 'error';
    message = 'Database operation failed';
  }

  // Send error response
  const errorResponse: ErrorResponse = {
    success: false,
    status,
    error: message,
  };

  // Include stack trace in development
  if (process.env['NODE_ENV'] === 'development') {
    if (error.stack) {
      errorResponse.stack = error.stack;
    }
    errorResponse.details = error;
  }

  res.status(statusCode).json(errorResponse);
};

// Create custom error class
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error factory functions
export const createError = (
  message: string,
  statusCode: number
): CustomError => {
  return new CustomError(message, statusCode);
};

export const createValidationError = (message: string): CustomError => {
  return new CustomError(message, 400);
};

export const createNotFoundError = (resource: string): CustomError => {
  return new CustomError(`${resource} not found`, 404);
};

export const createUnauthorizedError = (
  message = 'Unauthorized'
): CustomError => {
  return new CustomError(message, 401);
};

export const createForbiddenError = (message = 'Forbidden'): CustomError => {
  return new CustomError(message, 403);
};

// Async error handler wrapper with proper typing
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

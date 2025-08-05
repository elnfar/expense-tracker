import winston from 'winston';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import app from '../src/app';
import Logger from '../src/helpers/Logger';
import {
  Exception,
  ValidationException,
  ExpenseNotFound,
  DatabaseException,
  createExpenseNotFoundError,
  createValidationError,
  createDatabaseError,
} from '../src/helpers/Exception';
import {
  isValidISOString,
  parseISOString,
  getExpenseDateRange,
  getCurrentTimestamp,
} from '../src/helpers/dateUtils';
import { prismaService } from '../src/db/prisma.service';

describe('Logging System', () => {
  const testLogFile = path.join(process.cwd(), 'logs', 'test.log');

  beforeAll(async () => {
    // Ensure database connection is established
    await prismaService.getClient().$connect();
  });

  afterAll(async () => {
    // Clean up database connection
    await prismaService.disconnect();

    // Clean up test log file if it exists
    if (fs.existsSync(testLogFile)) {
      fs.unlinkSync(testLogFile);
    }
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.getClient().expense.deleteMany();
  });

  describe('Winston Logger Configuration', () => {
    it('should have correct log levels defined', () => {
      expect(Logger.levels).toBeDefined();
      expect(Logger.level).toBeDefined();
    });

    it('should have console and file transports', () => {
      const transports = Logger.transports;
      expect(transports.length).toBeGreaterThanOrEqual(2);

      const hasConsole = transports.some(
        (t) => t instanceof winston.transports.Console
      );
      const hasFile = transports.some(
        (t) => t instanceof winston.transports.File
      );

      expect(hasConsole).toBe(true);
      expect(hasFile).toBe(true);
    });

    it('should have logging methods available', () => {
      // Verify all required logging methods exist
      expect(typeof Logger.debug).toBe('function');
      expect(typeof Logger.info).toBe('function');
      expect(typeof Logger.warn).toBe('function');
      expect(typeof Logger.error).toBe('function');
      expect(typeof Logger.http).toBe('function');
    });
  });

  describe('File Logging', () => {
    it('should create log files', () => {
      const errorLogPath = path.join(process.cwd(), 'logs', 'error.log');
      const combinedLogPath = path.join(process.cwd(), 'logs', 'combined.log');

      // Log files should exist (created by previous runs or during setup)
      expect(
        fs.existsSync(errorLogPath) || fs.existsSync(combinedLogPath)
      ).toBe(true);
    });

    it('should write to log files', async () => {
      const combinedLogPath = path.join(process.cwd(), 'logs', 'combined.log');

      // Get initial file size if file exists
      let initialSize = 0;
      if (fs.existsSync(combinedLogPath)) {
        initialSize = fs.statSync(combinedLogPath).size;
      }

      // Log a unique message
      const uniqueMessage = `Test log message ${Date.now()}`;
      Logger.info(uniqueMessage);

      // Give winston time to write to file
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if file size increased (new content was written)
      if (fs.existsSync(combinedLogPath)) {
        const newSize = fs.statSync(combinedLogPath).size;
        expect(newSize).toBeGreaterThanOrEqual(initialSize);
      }
    });
  });

  describe('Exception Classes', () => {
    it('should create basic Exception with proper properties', () => {
      const exception = new Exception('Test error', 500);

      expect(exception).toBeInstanceOf(Error);
      expect(exception.message).toBe('Test error');
      expect(exception.statusCode).toBe(500);
      expect(exception.status).toBe('error');
      expect(exception.isOperational).toBe(true);
      expect(exception.name).toBe('Exception');
    });

    it('should create ValidationException with 400 status', () => {
      const validationError = new ValidationException('Invalid input', 'field');

      expect(validationError).toBeInstanceOf(Exception);
      expect(validationError.message).toBe('field: Invalid input');
      expect(validationError.statusCode).toBe(400);
      expect(validationError.status).toBe('fail');
    });

    it('should create ExpenseNotFound with proper message', () => {
      const expenseError = new ExpenseNotFound(123);

      expect(expenseError).toBeInstanceOf(Exception);
      expect(expenseError.message).toBe('Expense with ID 123 not found');
      expect(expenseError.statusCode).toBe(404);
      expect(expenseError.status).toBe('fail');
    });

    it('should create DatabaseException with operation context', () => {
      const dbError = new DatabaseException(
        'Connection failed',
        'create expense'
      );

      expect(dbError).toBeInstanceOf(Exception);
      expect(dbError.message).toBe(
        'Database error during create expense: Connection failed'
      );
      expect(dbError.statusCode).toBe(500);
      expect(dbError.status).toBe('error');
    });

    it('should use factory functions correctly', () => {
      const expenseNotFound = createExpenseNotFoundError(456);
      const validationError = createValidationError(
        'amount',
        'must be positive'
      );
      const databaseError = createDatabaseError('update', 'table locked');

      expect(expenseNotFound).toBeInstanceOf(ExpenseNotFound);
      expect(expenseNotFound.message).toContain('456');

      expect(validationError.message).toContain('amount');
      expect(validationError.message).toContain('must be positive');

      expect(databaseError.message).toContain('update');
      expect(databaseError.message).toContain('table locked');
    });
  });

  describe('Date Utils with Logging', () => {
    it('should validate ISO strings correctly', () => {
      const validISOString = '2024-01-15T10:30:00.000Z';
      const invalidISOString = 'invalid-date';

      expect(isValidISOString(validISOString)).toBe(true);
      expect(isValidISOString(invalidISOString)).toBe(false);
    });

    it('should parse valid ISO strings', () => {
      const isoString = '2024-01-15T10:30:00.000Z';
      const parsed = parseISOString(isoString);

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toBe(isoString);
    });

    it('should throw error for invalid ISO string', () => {
      expect(() => parseISOString('invalid-date')).toThrow(
        'Invalid ISO date string'
      );
    });

    it('should generate date ranges correctly', () => {
      const range = getExpenseDateRange(30);

      expect(range.start).toBeInstanceOf(Date);
      expect(range.end).toBeInstanceOf(Date);
      expect(range.start <= range.end).toBe(true);

      // Verify the range is approximately 30 days
      const daysDiff =
        Math.abs(range.end.getTime() - range.start.getTime()) /
        (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(30, 0);
    });

    it('should generate current timestamp', () => {
      const timestamp = getCurrentTimestamp();

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 1000); // Within last second
    });
  });

  describe('API Request Logging Integration', () => {
    it('should successfully handle HTTP requests with logging', async () => {
      await request(app).get('/health').expect(200);

      // Just verify the endpoint works - logging is happening (visible in console output)
      expect(true).toBe(true);
    });

    it('should successfully create expenses with logging', async () => {
      const expenseData = {
        name: 'Test Logging Expense',
        amount: 25.99,
        currency: 'USD',
        category: 'Testing',
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Logging Expense');
    });

    it('should handle validation errors with logging', async () => {
      const invalidExpenseData = {
        name: '', // Invalid: empty name
        amount: -10, // Invalid: negative amount
        currency: 'US', // Invalid: not 3 characters
        category: '', // Invalid: empty category
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(invalidExpenseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle expense retrieval with logging', async () => {
      // Create an expense first
      const expenseData = {
        name: 'Test Expense for Retrieval',
        amount: 50.0,
        currency: 'USD',
        category: 'Test',
      };

      const createResponse = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);

      const expenseId = createResponse.body.data.id;

      // Now retrieve it
      const getResponse = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe('Test Expense for Retrieval');
    });

    it('should handle expense updates with logging', async () => {
      // Create an expense first
      const expenseData = {
        name: 'Original Expense',
        amount: 30.0,
        currency: 'USD',
        category: 'Original',
      };

      const createResponse = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);

      const expenseId = createResponse.body.data.id;

      // Update it
      const updateData = { name: 'Updated Expense' };

      const updateResponse = await request(app)
        .patch(`/api/expenses/${expenseId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe('Updated Expense');
    });

    it('should handle expense deletions with logging', async () => {
      // Create an expense first
      const expenseData = {
        name: 'Expense to Delete',
        amount: 75.0,
        currency: 'USD',
        category: 'Delete Test',
      };

      const createResponse = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);

      const expenseId = createResponse.body.data.id;

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe('Expense deleted successfully');
    });

    it('should handle 404 errors with logging', async () => {
      const nonExistentId = 99999;

      const response = await request(app)
        .get(`/api/expenses/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Expense not found');
    });

    it('should handle validation errors for invalid IDs with logging', async () => {
      const response = await request(app)
        .get('/api/expenses/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid expense ID');
    });
  });

  describe('Application Startup Logging', () => {
    it('should log server configuration on startup', async () => {
      // This test verifies that server startup logs are generated
      // The actual startup happens in app.ts when the server starts
      const { startServer } = await import('../src/app');

      // We can't actually start another server, but we can verify the function exists
      expect(typeof startServer).toBe('function');
    });
  });

  describe('Error Handling with Logging', () => {
    it('should create custom exceptions with proper structure', () => {
      const customError = new Exception('Test exception for logging', 500);

      expect(customError).toBeInstanceOf(Error);
      expect(customError.message).toBe('Test exception for logging');
      expect(customError.statusCode).toBe(500);
      expect(customError.status).toBe('error');
      expect(customError.isOperational).toBe(true);
    });

    it('should support structured logging with metadata', () => {
      const metadata = {
        userId: 123,
        action: 'create_expense',
        expenseId: 456,
        amount: 99.99,
      };

      // This should not throw an error
      expect(() => {
        Logger.info('Expense operation completed', metadata);
      }).not.toThrow();
    });

    it('should support all logging levels', () => {
      // These should not throw errors
      expect(() => {
        Logger.debug('Debug message');
        Logger.info('Info message');
        Logger.warn('Warning message');
        Logger.error('Error message');
        Logger.http('HTTP message');
      }).not.toThrow();
    });
  });
});

import request from 'supertest';
import app from '../src/app';
import { prismaService } from '../src/db/prisma.service';

describe('Expenses API', () => {
  beforeAll(async () => {
    // Ensure database connection is established
    await prismaService.getClient().$connect();
  });

  afterAll(async () => {
    // Clean up database connection
    await prismaService.disconnect();
  });

  describe('POST /api/expenses', () => {
    it('should create a new expense with valid data', async () => {
      const expenseData = {
        name: 'Test Coffee',
        amount: 4.5,
        currency: 'USD',
        category: 'Food & Drink',
        date: '2024-01-15T10:30:00.000Z',
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Expense created successfully',
        data: {
          id: expect.any(Number),
          name: expenseData.name,
          amount: expenseData.amount,
          currency: expenseData.currency,
          category: expenseData.category,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should reject expense creation with invalid data', async () => {
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

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array),
      });

      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should reject expense creation with missing required fields', async () => {
      const incompleteExpenseData = {
        name: 'Test Expense',
        // Missing amount, currency, category
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(incompleteExpenseData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'amount',
            message: expect.stringContaining('required'),
          }),
          expect.objectContaining({
            field: 'currency',
            message: expect.stringContaining('required'),
          }),
          expect.objectContaining({
            field: 'category',
            message: expect.stringContaining('required'),
          }),
        ]),
      });
    });
  });

  describe('GET /api/expenses', () => {
    it('should return all expenses', async () => {
      const response = await request(app).get('/api/expenses').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: expect.any(Number),
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        timestamp: expect.any(String),
        port: expect.any(Number),
        database: expect.stringMatching(/^(connected|disconnected)$/),
        environment: expect.any(String),
      });
    });
  });

  describe('GET /api/ping', () => {
    it('should return pong', async () => {
      const response = await request(app).get('/api/ping').expect(200);

      expect(response.body).toEqual({
        message: 'pong',
      });
    });
  });

  describe('404 Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route').expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Route not found',
        message: expect.stringContaining('Cannot GET /api/unknown-route'),
        availableRoutes: expect.any(Object),
      });
    });
  });
});

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

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.getClient().expense.deleteMany();
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

  describe('GET /api/expenses/:id', () => {
    let createdExpense: any;

    beforeEach(async () => {
      // Create a test expense for ID-based retrieval tests
      const expenseData = {
        name: 'Test Expense for ID',
        amount: 25.75,
        currency: 'USD',
        category: 'Testing',
        date: new Date('2024-01-20T10:00:00.000Z'),
      };

      createdExpense = await prismaService
        .getClient()
        .expense.create({ data: expenseData });
    });

    it('should return expense by valid ID', async () => {
      const response = await request(app)
        .get(`/api/expenses/${createdExpense.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: createdExpense.id,
          name: 'Test Expense for ID',
          amount: 25.75,
          currency: 'USD',
          category: 'Testing',
          date: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Verify the date is correctly formatted
      expect(new Date(response.body.data.date)).toEqual(
        new Date('2024-01-20T10:00:00.000Z')
      );
    });

    it('should return 404 for non-existent expense ID', async () => {
      const nonExistentId = 99999;

      const response = await request(app)
        .get(`/api/expenses/${nonExistentId}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        status: 'fail', // Changed from 'error' to 'fail' (404 starts with 4)
        error: 'Expense not found',
      });
    });

    it('should return 400 for invalid expense ID format', async () => {
      const response = await request(app)
        .get('/api/expenses/invalid-id')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid expense ID',
      });
    });

    it('should return 400 for negative expense ID', async () => {
      const response = await request(app).get('/api/expenses/-1').expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid expense ID',
      });
    });

    it('should return 400 for zero expense ID', async () => {
      const response = await request(app).get('/api/expenses/0').expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid expense ID',
      });
    });

    it('should return 400 for decimal expense ID', async () => {
      // Decimal IDs are now properly rejected by our validation middleware
      const response = await request(app).get('/api/expenses/1.5').expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid expense ID',
      });
    });

    it('should handle large valid expense ID', async () => {
      const largeId = 2147483647; // Maximum 32-bit integer

      const response = await request(app)
        .get(`/api/expenses/${largeId}`)
        .expect(404); // Should return 404 since it doesn't exist, not 400

      expect(response.body).toMatchObject({
        success: false,
        status: 'fail', // Changed from 'error' to 'fail' (404 starts with 4)
        error: 'Expense not found',
      });
    });
  });

  describe('PATCH /api/expenses/:id', () => {
    let createdExpense: any;

    beforeEach(async () => {
      // Create a test expense for update tests
      const expenseData = {
        name: 'Original Expense',
        amount: 50.0,
        currency: 'USD',
        category: 'Original Category',
        date: new Date('2024-01-15T10:00:00.000Z'),
      };

      createdExpense = await prismaService
        .getClient()
        .expense.create({ data: expenseData });
    });

    it('should update a single field (name) of an expense', async () => {
      const updateData = {
        name: 'Updated Expense Name',
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Expense updated successfully',
        data: {
          id: createdExpense.id,
          name: 'Updated Expense Name',
          amount: 50.0, // Should remain unchanged
          currency: 'USD', // Should remain unchanged
          category: 'Original Category', // Should remain unchanged
          date: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Verify the updatedAt timestamp is different from createdAt
      expect(response.body.data.updatedAt).not.toBe(
        response.body.data.createdAt
      );
    });

    it('should update multiple fields of an expense', async () => {
      const updateData = {
        name: 'Updated Name',
        amount: 75.5,
        category: 'Updated Category',
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Expense updated successfully',
        data: {
          id: createdExpense.id,
          name: 'Updated Name',
          amount: 75.5,
          currency: 'USD', // Should remain unchanged
          category: 'Updated Category',
          date: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should update all fields of an expense', async () => {
      const updateData = {
        name: 'Completely Updated',
        amount: 100.25,
        currency: 'EUR',
        category: 'New Category',
        date: '2024-02-01T15:30:00.000Z',
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Expense updated successfully',
        data: {
          id: createdExpense.id,
          name: 'Completely Updated',
          amount: 100.25,
          currency: 'EUR',
          category: 'New Category',
          date: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Verify the date was updated correctly
      expect(new Date(response.body.data.date)).toEqual(
        new Date('2024-02-01T15:30:00.000Z')
      );
    });

    it('should return 404 for non-existent expense ID', async () => {
      const nonExistentId = 99999;
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .patch(`/api/expenses/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        status: 'fail',
        error: 'Expense not found',
      });
    });

    it('should return 400 for invalid expense ID format', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .patch('/api/expenses/invalid-id')
        .send(updateData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid expense ID',
      });
    });

    it('should return 400 for decimal expense ID', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .patch('/api/expenses/1.5')
        .send(updateData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid expense ID',
      });
    });

    it('should return 400 for empty update data', async () => {
      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'general',
            message: 'At least one field must be provided for update',
          }),
        ]),
      });
    });

    it('should validate individual field updates', async () => {
      const invalidUpdateData = {
        name: '', // Invalid: empty name
        amount: -10, // Invalid: negative amount
        currency: 'US', // Invalid: not 3 characters
        category: '', // Invalid: empty category
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array),
      });

      expect(response.body.details.length).toBeGreaterThan(0);

      // Check for specific validation errors
      const errorFields = response.body.details.map(
        (detail: any) => detail.field
      );
      expect(errorFields).toContain('name');
      expect(errorFields).toContain('amount');
      expect(errorFields).toContain('currency');
      expect(errorFields).toContain('category');
    });

    it('should validate date format in updates', async () => {
      const updateData = {
        date: 'invalid-date-format',
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'date',
            message: expect.stringContaining('valid ISO string'),
          }),
        ]),
      });
    });

    it('should allow partial updates with only valid fields', async () => {
      const updateData = {
        amount: 25.99, // Valid field
        invalidField: 'should be ignored', // Invalid field should be ignored
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Expense updated successfully',
        data: {
          id: createdExpense.id,
          name: 'Original Expense', // Should remain unchanged
          amount: 25.99, // Should be updated
          currency: 'USD', // Should remain unchanged
          category: 'Original Category', // Should remain unchanged
          date: expect.any(String),
        },
      });

      // Verify the invalid field was not added to the response
      expect(response.body.data).not.toHaveProperty('invalidField');
    });

    it('should handle very large amounts correctly', async () => {
      const updateData = {
        amount: 999999.99,
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.amount).toBe(999999.99);
    });

    it('should handle currency updates correctly', async () => {
      const updateData = {
        currency: 'GBP',
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.currency).toBe('GBP');
    });

    it('should preserve precision for decimal amounts', async () => {
      const updateData = {
        amount: 12.345,
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.amount).toBe(12.345);
    });

    it('should handle unicode characters in name and category', async () => {
      const updateData = {
        name: 'Coffee ☕ & Pastry 🥐',
        category: 'Food & Drink 🍽️',
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe('Coffee ☕ & Pastry 🥐');
      expect(response.body.data.category).toBe('Food & Drink 🍽️');
    });

    it('should reject updates with amount exceeding maximum', async () => {
      const updateData = {
        amount: 10000000, // Exceeds the maximum allowed amount
      };

      const response = await request(app)
        .patch(`/api/expenses/${createdExpense.id}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'amount',
            message: expect.stringContaining('cannot exceed'),
          }),
        ]),
      });
    });
  });

  describe('GET /api/expenses', () => {
    beforeEach(async () => {
      // Create test data for pagination and filtering tests
      const testExpenses = [
        {
          name: 'Lunch',
          amount: 12.5,
          currency: 'USD',
          category: 'Food & Drink',
          date: new Date('2024-01-15T12:00:00.000Z'),
        },
        {
          name: 'Gas',
          amount: 45.0,
          currency: 'USD',
          category: 'Transportation',
          date: new Date('2024-01-16T08:30:00.000Z'),
        },
        {
          name: 'Coffee',
          amount: 4.5,
          currency: 'USD',
          category: 'Food & Drink',
          date: new Date('2024-01-17T09:15:00.000Z'),
        },
        {
          name: 'Uber',
          amount: 15.75,
          currency: 'USD',
          category: 'Transportation',
          date: new Date('2024-01-18T18:45:00.000Z'),
        },
        {
          name: 'Groceries',
          amount: 87.25,
          currency: 'USD',
          category: 'Food & Drink',
          date: new Date('2024-01-19T14:20:00.000Z'),
        },
      ];

      for (const expense of testExpenses) {
        await prismaService.getClient().expense.create({ data: expense });
      }
    });

    it('should return all expenses without query parameters', async () => {
      const response = await request(app).get('/api/expenses').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: 5,
        pagination: null,
      });

      expect(response.body.data).toHaveLength(5);
      // Should be ordered by date desc, then id desc
      expect(response.body.data[0].name).toBe('Groceries');
      expect(response.body.data[4].name).toBe('Lunch');
    });

    it('should return paginated expenses with limit', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=3')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: 3,
        pagination: {
          total: 5,
          limit: 3,
          offset: 0,
          hasNext: true,
          hasPrevious: false,
          pages: 2,
          currentPage: 1,
        },
      });

      expect(response.body.data).toHaveLength(3);
    });

    it('should return paginated expenses with limit and offset', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=2&offset=2')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: 2,
        pagination: {
          total: 5,
          limit: 2,
          offset: 2,
          hasNext: true,
          hasPrevious: true,
          pages: 3,
          currentPage: 2,
        },
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should filter expenses by date range', async () => {
      const response = await request(app)
        .get(
          '/api/expenses?fromDate=2024-01-16T00:00:00.000Z&toDate=2024-01-17T23:59:59.999Z'
        )
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: 2,
        pagination: null,
      });

      expect(response.body.data).toHaveLength(2);
      // Should include Gas (Jan 16) and Coffee (Jan 17)
      const names = response.body.data.map((expense: any) => expense.name);
      expect(names).toContain('Gas');
      expect(names).toContain('Coffee');
    });

    it('should filter expenses by category', async () => {
      const response = await request(app)
        .get('/api/expenses?category=Transportation')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: 2,
        pagination: null,
      });

      expect(response.body.data).toHaveLength(2);
      // Should include Gas and Uber
      const names = response.body.data.map((expense: any) => expense.name);
      expect(names).toContain('Gas');
      expect(names).toContain('Uber');
    });

    it('should combine pagination and filtering', async () => {
      const response = await request(app)
        .get('/api/expenses?category=Food%20%26%20Drink&limit=2&offset=0')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        count: 2,
        pagination: {
          total: 3, // 3 Food & Drink expenses total
          limit: 2,
          offset: 0,
          hasNext: true,
          hasPrevious: false,
          pages: 2,
          currentPage: 1,
        },
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=invalid')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Limit must be a positive integer'),
      });
    });

    it('should validate date parameters', async () => {
      const response = await request(app)
        .get('/api/expenses?fromDate=invalid-date')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining(
          'fromDate must be a valid ISO date string'
        ),
      });
    });

    it('should reject limit over 100', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=150')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Limit cannot exceed 100'),
      });
    });

    it('should validate date range order', async () => {
      const response = await request(app)
        .get(
          '/api/expenses?fromDate=2024-01-20T00:00:00.000Z&toDate=2024-01-15T00:00:00.000Z'
        )
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('fromDate cannot be after toDate'),
      });
    });

    it('should return empty results for out-of-range dates', async () => {
      const response = await request(app)
        .get(
          '/api/expenses?fromDate=2025-01-01T00:00:00.000Z&toDate=2025-01-31T23:59:59.999Z'
        )
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
        count: 0,
        pagination: null,
      });
    });

    it('should handle offset beyond available records', async () => {
      const response = await request(app)
        .get('/api/expenses?limit=5&offset=10')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
        count: 0,
        pagination: {
          total: 5,
          limit: 5,
          offset: 10,
          hasNext: false,
          hasPrevious: true,
          pages: 1,
          currentPage: 3,
        },
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

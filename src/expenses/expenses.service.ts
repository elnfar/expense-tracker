import {
  ExpensesRepository,
  FindAllOptions,
  PaginatedExpensesResult,
} from './expenses.repository';
import { Expense } from '@prisma/client';
import { createValidationError } from '../helpers/middlewares/errorHandler';

export interface CreateExpenseDto {
  name: string;
  amount: number;
  currency: string;
  category: string;
  date?: string;
}

export interface ExpenseStats {
  totalAmount: number;
  totalCount: number;
  categories: Array<{ category: string; total: number; count: number }>;
}

export interface GetExpensesQuery {
  limit?: string;
  offset?: string;
  fromDate?: string;
  toDate?: string;
  category?: string;
}

export interface GetExpensesOptions {
  limit?: number;
  offset?: number;
  fromDate?: Date;
  toDate?: Date;
  category?: string;
  paginated?: boolean;
}

export class ExpensesService {
  private expensesRepository: ExpensesRepository;

  constructor() {
    this.expensesRepository = new ExpensesRepository();
  }

  // Create a new expense
  public async createExpense(
    createExpenseDto: CreateExpenseDto
  ): Promise<Expense> {
    try {
      // Validate required fields
      this.validateCreateExpenseDto(createExpenseDto);

      // Use current date if not provided
      const expenseData = {
        name: createExpenseDto.name,
        amount: createExpenseDto.amount,
        currency: createExpenseDto.currency,
        category: createExpenseDto.category,
        date: createExpenseDto.date
          ? new Date(createExpenseDto.date)
          : new Date(),
      };

      return await this.expensesRepository.create(expenseData);
    } catch (error) {
      console.error('Service error creating expense:', error);
      throw error;
    }
  }

  // Get all expenses with optional pagination and filtering
  public async getAllExpenses(
    query: GetExpensesQuery = {}
  ): Promise<Expense[] | PaginatedExpensesResult> {
    try {
      // Parse and validate query parameters
      const options = this.parseGetExpensesQuery(query);

      // If pagination parameters are provided, return paginated results
      if (options.limit !== undefined || options.offset !== undefined) {
        return await this.expensesRepository.findAllPaginated(options);
      }

      // Otherwise return all matching expenses
      return await this.expensesRepository.findAll(options);
    } catch (error) {
      console.error('Service error fetching expenses:', error);
      throw error;
    }
  }

  // Get paginated expenses with filtering
  public async getPaginatedExpenses(
    query: GetExpensesQuery = {}
  ): Promise<PaginatedExpensesResult> {
    try {
      const options = this.parseGetExpensesQuery(query);
      return await this.expensesRepository.findAllPaginated(options);
    } catch (error) {
      console.error('Service error fetching paginated expenses:', error);
      throw error;
    }
  }

  // Get expense by ID
  public async getExpenseById(id: number): Promise<Expense | null> {
    try {
      if (!Number.isInteger(id) || id <= 0) {
        throw createValidationError('Invalid expense ID');
      }

      return await this.expensesRepository.findById(id);
    } catch (error) {
      console.error('Service error fetching expense by ID:', error);
      throw error;
    }
  }

  // Get expenses by category
  public async getExpensesByCategory(category: string): Promise<Expense[]> {
    try {
      if (!category || category.trim().length === 0) {
        throw createValidationError('Category cannot be empty');
      }

      return await this.expensesRepository.findByCategory(category.trim());
    } catch (error) {
      console.error('Service error fetching expenses by category:', error);
      throw error;
    }
  }

  // Get expenses by date range
  public async getExpensesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Expense[]> {
    try {
      if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
        throw createValidationError(
          'Invalid date format. Use ISO string format.'
        );
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw createValidationError('Start date cannot be after end date');
      }

      return await this.expensesRepository.findByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Service error fetching expenses by date range:', error);
      throw error;
    }
  }

  // Update expense
  public async updateExpense(
    id: number,
    updateData: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Expense | null> {
    try {
      if (!Number.isInteger(id) || id <= 0) {
        throw createValidationError('Invalid expense ID');
      }

      if (Object.keys(updateData).length === 0) {
        throw createValidationError('No update data provided');
      }

      // Validate update data
      if (
        updateData.amount !== undefined &&
        (typeof updateData.amount !== 'number' || updateData.amount <= 0)
      ) {
        throw createValidationError('Amount must be a positive number');
      }

      if (
        updateData.name !== undefined &&
        (!updateData.name || updateData.name.trim().length === 0)
      ) {
        throw createValidationError('Name cannot be empty');
      }

      // Convert string date to Date object if provided
      if (updateData.date && typeof updateData.date === 'string') {
        updateData.date = new Date(updateData.date);
      }

      return await this.expensesRepository.update(id, updateData);
    } catch (error) {
      console.error('Service error updating expense:', error);
      throw error;
    }
  }

  // Delete expense
  public async deleteExpense(id: number): Promise<boolean> {
    try {
      if (!Number.isInteger(id) || id <= 0) {
        throw createValidationError('Invalid expense ID');
      }

      return await this.expensesRepository.delete(id);
    } catch (error) {
      console.error('Service error deleting expense:', error);
      throw error;
    }
  }

  // Get expense statistics
  public async getExpenseStats(): Promise<ExpenseStats> {
    try {
      const [totalAmount, totalCount, categories] = await Promise.all([
        this.expensesRepository.getTotalAmount(),
        this.expensesRepository.getTotalCount(),
        this.expensesRepository.getTotalByCategory(),
      ]);

      return {
        totalAmount,
        totalCount,
        categories,
      };
    } catch (error) {
      console.error('Service error fetching expense stats:', error);
      throw error;
    }
  }

  // Private method to parse and validate query parameters
  private parseGetExpensesQuery(query: GetExpensesQuery): FindAllOptions {
    const options: FindAllOptions = {};

    // Parse limit
    if (query.limit !== undefined) {
      const limit = parseInt(query.limit, 10);
      if (isNaN(limit) || limit <= 0) {
        throw createValidationError('Limit must be a positive integer');
      }
      if (limit > 100) {
        throw createValidationError('Limit cannot exceed 100');
      }
      options.limit = limit;
    }

    // Parse offset
    if (query.offset !== undefined) {
      const offset = parseInt(query.offset, 10);
      if (isNaN(offset) || offset < 0) {
        throw createValidationError('Offset must be a non-negative integer');
      }
      options.offset = offset;
    }

    // Parse fromDate
    if (query.fromDate !== undefined) {
      if (!this.isValidDate(query.fromDate)) {
        throw createValidationError('fromDate must be a valid ISO date string');
      }
      options.fromDate = new Date(query.fromDate);
    }

    // Parse toDate
    if (query.toDate !== undefined) {
      if (!this.isValidDate(query.toDate)) {
        throw createValidationError('toDate must be a valid ISO date string');
      }
      options.toDate = new Date(query.toDate);
    }

    // Validate date range
    if (
      options.fromDate &&
      options.toDate &&
      options.fromDate > options.toDate
    ) {
      throw createValidationError('fromDate cannot be after toDate');
    }

    // Parse category
    if (query.category !== undefined) {
      if (query.category.trim().length === 0) {
        throw createValidationError('Category cannot be empty');
      }
      options.category = query.category.trim();
    }

    return options;
  }

  // Private validation methods
  private validateCreateExpenseDto(dto: CreateExpenseDto): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw createValidationError('Name is required');
    }

    if (typeof dto.amount !== 'number' || dto.amount <= 0) {
      throw createValidationError('Amount must be a positive number');
    }

    if (!dto.currency || dto.currency.trim().length === 0) {
      throw createValidationError('Currency is required');
    }

    if (!dto.category || dto.category.trim().length === 0) {
      throw createValidationError('Category is required');
    }

    if (dto.date && !this.isValidDate(dto.date)) {
      throw createValidationError(
        'Invalid date format. Use ISO string format.'
      );
    }
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}

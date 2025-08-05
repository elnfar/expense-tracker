import { ExpensesRepository } from './expenses.repository';
import { Expense } from '@prisma/client';

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

  // Get all expenses
  public async getAllExpenses(): Promise<Expense[]> {
    try {
      return await this.expensesRepository.findAll();
    } catch (error) {
      console.error('Service error fetching expenses:', error);
      throw error;
    }
  }

  // Get expense by ID
  public async getExpenseById(id: number): Promise<Expense | null> {
    try {
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error('Invalid expense ID');
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
        throw new Error('Category cannot be empty');
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
        throw new Error('Invalid date format. Use ISO string format.');
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('Start date cannot be after end date');
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
        throw new Error('Invalid expense ID');
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No update data provided');
      }

      // Validate update data
      if (
        updateData.amount !== undefined &&
        (typeof updateData.amount !== 'number' || updateData.amount <= 0)
      ) {
        throw new Error('Amount must be a positive number');
      }

      if (
        updateData.name !== undefined &&
        (!updateData.name || updateData.name.trim().length === 0)
      ) {
        throw new Error('Name cannot be empty');
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
        throw new Error('Invalid expense ID');
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

  // Private validation methods
  private validateCreateExpenseDto(dto: CreateExpenseDto): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (typeof dto.amount !== 'number' || dto.amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    if (!dto.currency || dto.currency.trim().length === 0) {
      throw new Error('Currency is required');
    }

    if (!dto.category || dto.category.trim().length === 0) {
      throw new Error('Category is required');
    }

    if (dto.date && !this.isValidDate(dto.date)) {
      throw new Error('Invalid date format. Use ISO string format.');
    }
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}

import { PrismaClient, Expense } from '@prisma/client';
import { prismaService } from '../db/prisma.service';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface DateFilterOptions {
  fromDate?: Date;
  toDate?: Date;
}

export interface FindAllOptions extends PaginationOptions, DateFilterOptions {
  category?: string;
}

export interface PaginatedExpensesResult {
  expenses: Expense[];
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class ExpensesRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaService.getClient();
  }

  // Insert a new expense
  public async create(
    expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> {
    try {
      return await this.prisma.expense.create({
        data: expense,
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      throw new Error(`Failed to create expense: ${error}`);
    }
  }

  // Get all expenses with optional pagination and filtering
  public async findAll(options: FindAllOptions = {}): Promise<Expense[]> {
    try {
      const where: Record<string, unknown> = {};

      // Add date filtering
      if (options.fromDate || options.toDate) {
        const dateFilter: Record<string, Date> = {};
        if (options.fromDate) {
          dateFilter['gte'] = options.fromDate;
        }
        if (options.toDate) {
          dateFilter['lte'] = options.toDate;
        }
        where['date'] = dateFilter;
      }

      // Add category filtering
      if (options.category) {
        where['category'] = options.category;
      }

      // Build query options
      const queryOptions: Parameters<typeof this.prisma.expense.findMany>[0] = {
        where,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      };

      // Add pagination only if values are defined
      if (options.offset !== undefined) {
        queryOptions.skip = options.offset;
      }
      if (options.limit !== undefined) {
        queryOptions.take = options.limit;
      }

      return await this.prisma.expense.findMany(queryOptions);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw new Error(`Failed to fetch expenses: ${error}`);
    }
  }

  // Get paginated expenses with filtering
  public async findAllPaginated(
    options: FindAllOptions = {}
  ): Promise<PaginatedExpensesResult> {
    try {
      const where: Record<string, unknown> = {};

      // Add date filtering
      if (options.fromDate || options.toDate) {
        const dateFilter: Record<string, Date> = {};
        if (options.fromDate) {
          dateFilter['gte'] = options.fromDate;
        }
        if (options.toDate) {
          dateFilter['lte'] = options.toDate;
        }
        where['date'] = dateFilter;
      }

      // Add category filtering
      if (options.category) {
        where['category'] = options.category;
      }

      // Set default pagination values
      const limit = options.limit || 10;
      const offset = options.offset || 0;

      // Get expenses and total count in parallel
      const [expenses, total] = await Promise.all([
        this.prisma.expense.findMany({
          where,
          orderBy: [{ date: 'desc' }, { id: 'desc' }],
          skip: offset,
          take: limit,
        }),
        this.prisma.expense.count({ where }),
      ]);

      return {
        expenses,
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrevious: offset > 0,
      };
    } catch (error) {
      console.error('Error fetching paginated expenses:', error);
      throw new Error(`Failed to fetch paginated expenses: ${error}`);
    }
  }

  // Get expense by ID
  public async findById(id: number): Promise<Expense | null> {
    try {
      return await this.prisma.expense.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error fetching expense by ID:', error);
      throw new Error(`Failed to fetch expense: ${error}`);
    }
  }

  // Get expenses by category
  public async findByCategory(category: string): Promise<Expense[]> {
    try {
      return await this.prisma.expense.findMany({
        where: { category },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      });
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      throw new Error(`Failed to fetch expenses by category: ${error}`);
    }
  }

  // Get expenses by date range
  public async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Expense[]> {
    try {
      return await this.prisma.expense.findMany({
        where: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      });
    } catch (error) {
      console.error('Error fetching expenses by date range:', error);
      throw new Error(`Failed to fetch expenses by date range: ${error}`);
    }
  }

  // Update expense
  public async update(
    id: number,
    expense: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Expense | null> {
    try {
      // First check if expense exists
      const existingExpense = await this.findById(id);
      if (!existingExpense) {
        return null;
      }

      return await this.prisma.expense.update({
        where: { id },
        data: expense,
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      throw new Error(`Failed to update expense: ${error}`);
    }
  }

  // Delete expense
  public async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.expense.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Record to delete does not exist')
      ) {
        return false;
      }
      console.error('Error deleting expense:', error);
      throw new Error(`Failed to delete expense: ${error}`);
    }
  }

  // Get total amount by category
  public async getTotalByCategory(): Promise<
    Array<{ category: string; total: number; count: number }>
  > {
    try {
      const result = await this.prisma.expense.groupBy({
        by: ['category'],
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
      });

      return result.map((item) => ({
        category: item.category,
        total: item._sum.amount || 0,
        count: item._count.id,
      }));
    } catch (error) {
      console.error('Error getting totals by category:', error);
      throw new Error(`Failed to get totals by category: ${error}`);
    }
  }

  // Get total expenses count
  public async getTotalCount(): Promise<number> {
    try {
      return await this.prisma.expense.count();
    } catch (error) {
      console.error('Error getting total count:', error);
      throw new Error(`Failed to get total count: ${error}`);
    }
  }

  // Get total amount
  public async getTotalAmount(): Promise<number> {
    try {
      const result = await this.prisma.expense.aggregate({
        _sum: {
          amount: true,
        },
      });
      return result._sum.amount || 0;
    } catch (error) {
      console.error('Error getting total amount:', error);
      throw new Error(`Failed to get total amount: ${error}`);
    }
  }

  // Get total count with filters
  public async getTotalCountWithFilters(
    options: DateFilterOptions & { category?: string }
  ): Promise<number> {
    try {
      const where: Record<string, unknown> = {};

      // Add date filtering
      if (options.fromDate || options.toDate) {
        const dateFilter: Record<string, Date> = {};
        if (options.fromDate) {
          dateFilter['gte'] = options.fromDate;
        }
        if (options.toDate) {
          dateFilter['lte'] = options.toDate;
        }
        where['date'] = dateFilter;
      }

      // Add category filtering
      if (options.category) {
        where['category'] = options.category;
      }

      return await this.prisma.expense.count({ where });
    } catch (error) {
      console.error('Error getting filtered count:', error);
      throw new Error(`Failed to get filtered count: ${error}`);
    }
  }
}

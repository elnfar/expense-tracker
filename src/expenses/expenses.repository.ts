import { PrismaClient, Expense } from '@prisma/client';
import { prismaService } from '../db/prisma.service';

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

  // Get all expenses
  public async findAll(): Promise<Expense[]> {
    try {
      return await this.prisma.expense.findMany({
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw new Error(`Failed to fetch expenses: ${error}`);
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
}

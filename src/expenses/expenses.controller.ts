import { Request, Response } from 'express';
import { ExpensesService, CreateExpenseDto } from './expenses.service';
import {
  catchAsync,
  createNotFoundError,
} from '../helpers/middlewares/errorHandler';
import Logger from '../helpers/Logger';

// Extend Request interface to include our custom properties
interface RequestWithExpenseId extends Request {
  expenseId: number;
}

export class ExpensesController {
  private expensesService: ExpensesService;

  constructor() {
    this.expensesService = new ExpensesService();
  }

  // Create a new expense
  public createExpense = catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      const createExpenseDto: CreateExpenseDto = req.body;
      Logger.info('Creating new expense', {
        name: createExpenseDto.name,
        amount: createExpenseDto.amount,
      });

      const expense =
        await this.expensesService.createExpense(createExpenseDto);

      Logger.info('Expense created successfully', { id: expense.id });
      res.status(201).json({
        success: true,
        data: expense,
        message: 'Expense created successfully',
      });
    }
  );

  // Get all expenses
  public getAllExpenses = catchAsync(
    async (_req: Request, res: Response): Promise<void> => {
      Logger.debug('Fetching all expenses');
      const expenses = await this.expensesService.getAllExpenses();

      Logger.debug(`Retrieved ${expenses.length} expenses`);
      res.status(200).json({
        success: true,
        data: expenses,
        count: expenses.length,
      });
    }
  );

  // Get expense by ID
  public getExpenseById = catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      const id = (req as RequestWithExpenseId).expenseId; // Set by validation middleware
      Logger.debug('Fetching expense by ID', { id });

      const expense = await this.expensesService.getExpenseById(id);

      if (!expense) {
        Logger.warn('Expense not found', { id });
        throw createNotFoundError('Expense');
      }

      Logger.debug('Expense retrieved successfully', { id });
      res.status(200).json({
        success: true,
        data: expense,
      });
    }
  );

  // Get expenses by category
  public getExpensesByCategory = catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      const { category } = req.query;
      Logger.debug('Fetching expenses by category', { category });

      if (!category || typeof category !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Category query parameter is required',
        });
        return;
      }

      const expenses =
        await this.expensesService.getExpensesByCategory(category);

      Logger.debug(
        `Retrieved ${expenses.length} expenses for category: ${category}`
      );
      res.status(200).json({
        success: true,
        data: expenses,
        count: expenses.length,
        category,
      });
    }
  );

  // Get expenses by date range
  public getExpensesByDateRange = catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      const { startDate, endDate } = req.query;
      Logger.debug('Fetching expenses by date range', { startDate, endDate });

      if (
        !startDate ||
        !endDate ||
        typeof startDate !== 'string' ||
        typeof endDate !== 'string'
      ) {
        res.status(400).json({
          success: false,
          error: 'Both startDate and endDate query parameters are required',
        });
        return;
      }

      const expenses = await this.expensesService.getExpensesByDateRange(
        startDate,
        endDate
      );

      Logger.debug(
        `Retrieved ${expenses.length} expenses for date range: ${startDate} to ${endDate}`
      );
      res.status(200).json({
        success: true,
        data: expenses,
        count: expenses.length,
        dateRange: { startDate, endDate },
      });
    }
  );

  // Update expense
  public updateExpense = catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      const id = (req as RequestWithExpenseId).expenseId; // Set by validation middleware
      const updateData = req.body;
      Logger.info('Updating expense', { id, updateData });

      const expense = await this.expensesService.updateExpense(id, updateData);

      if (!expense) {
        Logger.warn('Expense not found for update', { id });
        throw createNotFoundError('Expense');
      }

      Logger.info('Expense updated successfully', { id });
      res.status(200).json({
        success: true,
        data: expense,
        message: 'Expense updated successfully',
      });
    }
  );

  // Delete expense
  public deleteExpense = catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      const id = (req as RequestWithExpenseId).expenseId; // Set by validation middleware
      Logger.info('Deleting expense', { id });

      const deleted = await this.expensesService.deleteExpense(id);

      if (!deleted) {
        Logger.warn('Expense not found for deletion', { id });
        throw createNotFoundError('Expense');
      }

      Logger.info('Expense deleted successfully', { id });
      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully',
        deletedId: id,
      });
    }
  );

  // Get expense statistics
  public getExpenseStats = catchAsync(
    async (_req: Request, res: Response): Promise<void> => {
      Logger.debug('Fetching expense statistics');
      const stats = await this.expensesService.getExpenseStats();

      Logger.debug('Expense statistics retrieved', {
        totalAmount: stats.totalAmount,
        totalCount: stats.totalCount,
        categoriesCount: stats.categories.length,
      });
      res.status(200).json({
        success: true,
        data: stats,
      });
    }
  );
}

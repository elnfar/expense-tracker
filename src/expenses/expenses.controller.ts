import { Request, Response } from 'express';
import {
  ExpensesService,
  CreateExpenseDto,
  GetExpensesQuery,
} from './expenses.service';
import {
  catchAsync,
  createNotFoundError,
} from '../helpers/middlewares/errorHandler';
import Logger from '../helpers/Logger';
import { PaginatedExpensesResult } from './expenses.repository';

interface RequestWithExpenseId extends Request {
  expenseId: number;
}

export class ExpensesController {
  private expensesService: ExpensesService;

  constructor() {
    this.expensesService = new ExpensesService();
  }

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

  // Get all expenses with optional pagination and filtering
  public getAllExpenses = catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      const query: GetExpensesQuery = {
        limit: req.query['limit'] as string,
        offset: req.query['offset'] as string,
        fromDate: req.query['fromDate'] as string,
        toDate: req.query['toDate'] as string,
        category: req.query['category'] as string,
      };

      Object.keys(query).forEach((key) => {
        if (query[key as keyof GetExpensesQuery] === undefined) {
          delete query[key as keyof GetExpensesQuery];
        }
      });

      Logger.debug('Fetching expenses with query parameters', query);

      const result = await this.expensesService.getAllExpenses(query);

      // Check if result is paginated or simple array
      if (Array.isArray(result)) {
        Logger.debug(`Retrieved ${result.length} expenses`);
        res.status(200).json({
          success: true,
          data: result,
          count: result.length,
          pagination: null,
        });
      } else {
        // Paginated response
        const paginatedResult = result as PaginatedExpensesResult;
        Logger.debug(
          `Retrieved ${paginatedResult.expenses.length} expenses (paginated)`,
          {
            total: paginatedResult.total,
            limit: paginatedResult.limit,
            offset: paginatedResult.offset,
          }
        );

        res.status(200).json({
          success: true,
          data: paginatedResult.expenses,
          count: paginatedResult.expenses.length,
          pagination: {
            total: paginatedResult.total,
            limit: paginatedResult.limit,
            offset: paginatedResult.offset,
            hasNext: paginatedResult.hasNext,
            hasPrevious: paginatedResult.hasPrevious,
            pages: Math.ceil(paginatedResult.total / paginatedResult.limit),
            currentPage:
              Math.floor(paginatedResult.offset / paginatedResult.limit) + 1,
          },
        });
      }
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

  // Search expenses with branching logic
  public searchExpenses = catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      const { category, startDate, endDate } = req.query;
      Logger.debug('Searching expenses', { category, startDate, endDate });

      if (category && typeof category === 'string') {
        // Search by category
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
      } else if (
        startDate &&
        endDate &&
        typeof startDate === 'string' &&
        typeof endDate === 'string'
      ) {
        // Search by date range
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
      } else {
        // Invalid parameters
        Logger.warn('Invalid search parameters provided');
        res.status(400).json({
          success: false,
          error:
            'Please provide either category or both startDate and endDate parameters',
        });
      }
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

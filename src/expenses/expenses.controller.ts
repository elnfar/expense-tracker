import { Request, Response } from 'express';
import { ExpensesService, CreateExpenseDto } from './expenses.service';

export class ExpensesController {
  private expensesService: ExpensesService;

  constructor() {
    this.expensesService = new ExpensesService();
  }

  // Create a new expense
  public createExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const createExpenseDto: CreateExpenseDto = req.body;
      const expense =
        await this.expensesService.createExpense(createExpenseDto);

      res.status(201).json({
        success: true,
        data: expense,
        message: 'Expense created successfully',
      });
    } catch (error) {
      console.error('Controller error creating expense:', error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create expense',
      });
    }
  };

  // Get all expenses
  public getAllExpenses = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const expenses = await this.expensesService.getAllExpenses();

      res.status(200).json({
        success: true,
        data: expenses,
        count: expenses.length,
      });
    } catch (error) {
      console.error('Controller error fetching expenses:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch expenses',
      });
    }
  };

  // Get expense by ID
  public getExpenseById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const idParam = req.params['id'];

      if (!idParam) {
        res.status(400).json({
          success: false,
          error: 'Expense ID is required',
        });
        return;
      }

      const id = parseInt(idParam, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid expense ID',
        });
        return;
      }

      const expense = await this.expensesService.getExpenseById(id);

      if (!expense) {
        res.status(404).json({
          success: false,
          error: 'Expense not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: expense,
      });
    } catch (error) {
      console.error('Controller error fetching expense by ID:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch expense',
      });
    }
  };

  // Get expenses by category
  public getExpensesByCategory = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { category } = req.query;

      if (!category || typeof category !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Category query parameter is required',
        });
        return;
      }

      const expenses =
        await this.expensesService.getExpensesByCategory(category);

      res.status(200).json({
        success: true,
        data: expenses,
        count: expenses.length,
        category,
      });
    } catch (error) {
      console.error('Controller error fetching expenses by category:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch expenses by category',
      });
    }
  };

  // Get expenses by date range
  public getExpensesByDateRange = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

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

      res.status(200).json({
        success: true,
        data: expenses,
        count: expenses.length,
        dateRange: { startDate, endDate },
      });
    } catch (error) {
      console.error('Controller error fetching expenses by date range:', error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch expenses by date range',
      });
    }
  };

  // Update expense
  public updateExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const idParam = req.params['id'];

      if (!idParam) {
        res.status(400).json({
          success: false,
          error: 'Expense ID is required',
        });
        return;
      }

      const id = parseInt(idParam, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid expense ID',
        });
        return;
      }

      const updateData = req.body;
      const expense = await this.expensesService.updateExpense(id, updateData);

      if (!expense) {
        res.status(404).json({
          success: false,
          error: 'Expense not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: expense,
        message: 'Expense updated successfully',
      });
    } catch (error) {
      console.error('Controller error updating expense:', error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update expense',
      });
    }
  };

  // Delete expense
  public deleteExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const idParam = req.params['id'];

      if (!idParam) {
        res.status(400).json({
          success: false,
          error: 'Expense ID is required',
        });
        return;
      }

      const id = parseInt(idParam, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid expense ID',
        });
        return;
      }

      const deleted = await this.expensesService.deleteExpense(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Expense not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      console.error('Controller error deleting expense:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete expense',
      });
    }
  };

  // Get expense statistics
  public getExpenseStats = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const stats = await this.expensesService.getExpenseStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Controller error fetching expense stats:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch expense statistics',
      });
    }
  };
}

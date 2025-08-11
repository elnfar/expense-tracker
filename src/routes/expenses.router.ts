import { Router } from 'express';
import { ExpensesController } from '../expenses/expenses.controller';
import {
  validateCreateExpense,
  validateUpdateExpense,
  validateExpenseId,
} from '../helpers/middlewares/validator';

const router = Router();
const expensesController = new ExpensesController();

// POST /api/expenses - Create a new expense
router.post('/', validateCreateExpense, expensesController.createExpense);

// GET /api/expenses - Get all expenses (with optional filtering)
router.get('/', expensesController.getAllExpenses);

// GET /api/expenses/stats - Get expense statistics
router.get('/stats', expensesController.getExpenseStats);

// GET /api/expenses/search - Search expenses by category or date range
router.get('/search', expensesController.searchExpenses);

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', validateExpenseId, expensesController.getExpenseById);

// PUT /api/expenses/:id - Update expense (full update)
router.put(
  '/:id',
  validateExpenseId,
  validateUpdateExpense,
  expensesController.updateExpense
);

// PATCH /api/expenses/:id - Update expense (partial update)
router.patch(
  '/:id',
  validateExpenseId,
  validateUpdateExpense,
  expensesController.updateExpense
);

// DELETE /api/expenses/:id - Delete expense by ID
router.delete('/:id', validateExpenseId, expensesController.deleteExpense);

export default router;

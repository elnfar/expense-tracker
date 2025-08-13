import { Request, Response, NextFunction } from 'express';
import { ExpenseValidationRules } from '../../expenses/entity/expense.entity';
import Logger from '../Logger';

// Validation middleware for creating expenses
export const validateCreateExpense = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: Array<{ field: string; message: string }> = [];

  if (
    !req.body.name ||
    typeof req.body.name !== 'string' ||
    req.body.name.trim().length === 0
  ) {
    errors.push({ field: 'name', message: 'name is required' });
  } else if (req.body.name.length > ExpenseValidationRules.name.maxLength) {
    errors.push({
      field: 'name',
      message: `name must be at most ${ExpenseValidationRules.name.maxLength} characters long`,
    });
  }

  // Validate amount
  if (req.body.amount === undefined || req.body.amount === null) {
    errors.push({ field: 'amount', message: 'amount is required' });
  } else if (typeof req.body.amount !== 'number' || isNaN(req.body.amount)) {
    errors.push({ field: 'amount', message: 'amount must be a number' });
  } else if (req.body.amount < ExpenseValidationRules.amount.min) {
    errors.push({
      field: 'amount',
      message: `amount must be at least ${ExpenseValidationRules.amount.min}`,
    });
  } else if (req.body.amount > ExpenseValidationRules.amount.max) {
    errors.push({
      field: 'amount',
      message: `amount cannot exceed ${ExpenseValidationRules.amount.max}`,
    });
  }

  // Validate currency
  if (!req.body.currency || typeof req.body.currency !== 'string') {
    errors.push({ field: 'currency', message: 'currency is required' });
  } else if (
    req.body.currency.length < ExpenseValidationRules.currency.minLength
  ) {
    errors.push({
      field: 'currency',
      message: `currency must be at least ${ExpenseValidationRules.currency.minLength} characters long`,
    });
  } else if (
    req.body.currency.length > ExpenseValidationRules.currency.maxLength
  ) {
    errors.push({
      field: 'currency',
      message: `currency must be at most ${ExpenseValidationRules.currency.maxLength} characters long`,
    });
  } else if (!ExpenseValidationRules.currency.pattern.test(req.body.currency)) {
    errors.push({ field: 'currency', message: 'currency format is invalid' });
  }

  // Validate category
  if (
    !req.body.category ||
    typeof req.body.category !== 'string' ||
    req.body.category.trim().length === 0
  ) {
    errors.push({ field: 'category', message: 'category is required' });
  } else if (
    req.body.category.length > ExpenseValidationRules.category.maxLength
  ) {
    errors.push({
      field: 'category',
      message: `category must be at most ${ExpenseValidationRules.category.maxLength} characters long`,
    });
  }

  // Validate date (optional)
  if (req.body.date !== undefined) {
    if (typeof req.body.date !== 'string') {
      errors.push({
        field: 'date',
        message: 'date must be a valid ISO string',
      });
    } else {
      const date = new Date(req.body.date);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'date',
          message: 'date must be a valid ISO string',
        });
      }
    }
  }

  if (errors.length > 0) {
    Logger.warn('Validation failed:', errors);
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  Logger.debug('Validation passed for POST /api/expenses');
  next();
};

// Validation middleware for updating expenses
export const validateUpdateExpense = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: Array<{ field: string; message: string }> = [];

  // At least one field should be provided for update
  const updateableFields = ['name', 'amount', 'currency', 'category', 'date'];
  const providedFields = updateableFields.filter(
    (field) => req.body[field] !== undefined
  );

  if (providedFields.length === 0) {
    errors.push({
      field: 'general',
      message: 'At least one field must be provided for update',
    });
  }

  // Validate name (if provided)
  if (req.body.name !== undefined) {
    if (
      typeof req.body.name !== 'string' ||
      req.body.name.trim().length === 0
    ) {
      errors.push({ field: 'name', message: 'name cannot be empty' });
    } else if (req.body.name.length > ExpenseValidationRules.name.maxLength) {
      errors.push({
        field: 'name',
        message: `name must be at most ${ExpenseValidationRules.name.maxLength} characters long`,
      });
    }
  }

  // Validate amount (if provided)
  if (req.body.amount !== undefined) {
    if (typeof req.body.amount !== 'number' || isNaN(req.body.amount)) {
      errors.push({ field: 'amount', message: 'amount must be a number' });
    } else if (req.body.amount < ExpenseValidationRules.amount.min) {
      errors.push({
        field: 'amount',
        message: `amount must be at least ${ExpenseValidationRules.amount.min}`,
      });
    } else if (req.body.amount > ExpenseValidationRules.amount.max) {
      errors.push({
        field: 'amount',
        message: `amount cannot exceed ${ExpenseValidationRules.amount.max}`,
      });
    }
  }

  // Validate currency (if provided)
  if (req.body.currency !== undefined) {
    if (typeof req.body.currency !== 'string') {
      errors.push({ field: 'currency', message: 'currency must be a string' });
    } else if (
      req.body.currency.length < ExpenseValidationRules.currency.minLength
    ) {
      errors.push({
        field: 'currency',
        message: `currency must be at least ${ExpenseValidationRules.currency.minLength} characters long`,
      });
    } else if (
      req.body.currency.length > ExpenseValidationRules.currency.maxLength
    ) {
      errors.push({
        field: 'currency',
        message: `currency must be at most ${ExpenseValidationRules.currency.maxLength} characters long`,
      });
    } else if (
      !ExpenseValidationRules.currency.pattern.test(req.body.currency)
    ) {
      errors.push({ field: 'currency', message: 'currency format is invalid' });
    }
  }

  // Validate category (if provided)
  if (req.body.category !== undefined) {
    if (
      typeof req.body.category !== 'string' ||
      req.body.category.trim().length === 0
    ) {
      errors.push({ field: 'category', message: 'category cannot be empty' });
    } else if (
      req.body.category.length > ExpenseValidationRules.category.maxLength
    ) {
      errors.push({
        field: 'category',
        message: `category must be at most ${ExpenseValidationRules.category.maxLength} characters long`,
      });
    }
  }

  // Validate date (if provided)
  if (req.body.date !== undefined) {
    if (typeof req.body.date !== 'string') {
      errors.push({
        field: 'date',
        message: 'date must be a valid ISO string',
      });
    } else {
      const date = new Date(req.body.date);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'date',
          message: 'date must be a valid ISO string',
        });
      }
    }
  }

  if (errors.length > 0) {
    Logger.warn('Validation failed:', errors);
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  Logger.debug('Validation passed for PUT /api/expenses/:id');
  next();
};

export const validateExpenseId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const idParam = req.params['id'] || '';

  // Check if the ID contains a decimal point (reject decimal numbers)
  if (idParam.includes('.')) {
    Logger.warn(`Decimal expense ID provided: ${idParam}`);
    res.status(400).json({
      success: false,
      error: 'Invalid expense ID',
    });
    return;
  }

  const id = parseInt(idParam, 10);

  if (isNaN(id) || id <= 0) {
    Logger.warn(`Invalid expense ID provided: ${idParam}`);
    res.status(400).json({
      success: false,
      error: 'Invalid expense ID',
    });
    return;
  }

  // Add parsed ID to request for controllers to use
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req as any).expenseId = id;
  next();
};

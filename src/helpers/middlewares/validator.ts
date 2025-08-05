import { Request, Response, NextFunction } from 'express';
import { ExpenseValidationRules } from '../../expenses/entity/expense.entity';
import Logger from '../Logger';

interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'boolean';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

interface ValidationError {
  field: string;
  message: string;
}

export class ValidationService {
  static validate(
    data: Record<string, unknown>,
    schema: ValidationSchema
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];

      // Check required fields
      if (
        rule.required &&
        (value === undefined || value === null || value === '')
      ) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push({ field, message: `${field} must be a string` });
            }
            break;
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push({
                field,
                message: `${field} must be a valid number`,
              });
            }
            break;
          case 'date':
            if (!(value instanceof Date) && !this.isValidDateString(value)) {
              errors.push({ field, message: `${field} must be a valid date` });
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push({ field, message: `${field} must be a boolean` });
            }
            break;
        }
      }

      // String length validation
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({
            field,
            message: `${field} must be at least ${rule.minLength} characters long`,
          });
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field,
            message: `${field} must be no more than ${rule.maxLength} characters long`,
          });
        }
      }

      // Number range validation
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field,
            message: `${field} must be at least ${rule.min}`,
          });
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field,
            message: `${field} must be no more than ${rule.max}`,
          });
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push({ field, message: `${field} format is invalid` });
        }
      }
    }

    return errors;
  }

  private static isValidDateString(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
}

// Generic validation middleware factory
export const validator = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors = ValidationService.validate(
        req.body as Record<string, unknown>,
        schema
      );

      if (errors.length > 0) {
        Logger.warn(`Validation failed: ${JSON.stringify(errors)}`);
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      Logger.debug(`Validation passed for ${req.method} ${req.path}`);
      next();
    } catch (error) {
      Logger.error(`Validation middleware error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
};

// Specific validators for expenses
export const validateCreateExpense = validator(ExpenseValidationRules);

export const validateUpdateExpense = validator({
  name: { ...ExpenseValidationRules.name, required: false },
  amount: { ...ExpenseValidationRules.amount, required: false },
  currency: { ...ExpenseValidationRules.currency, required: false },
  category: { ...ExpenseValidationRules.category, required: false },
  date: ExpenseValidationRules.date,
});

export const validateExpenseId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const id = parseInt(req.params['id'] || '', 10);

  if (isNaN(id) || id <= 0) {
    Logger.warn(`Invalid expense ID provided: ${req.params['id']}`);
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

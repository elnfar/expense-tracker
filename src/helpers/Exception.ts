export class Exception extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation related exceptions
export class ValidationException extends Exception {
  constructor(message: string, field?: string) {
    super(field ? `${field}: ${message}` : message, 400);
  }
}

export class InvalidInputException extends ValidationException {
  constructor(field: string, value: unknown, expectedType: string) {
    super(
      `Invalid ${field}. Expected ${expectedType}, received: ${value}`,
      field
    );
  }
}

// Resource related exceptions
export class ResourceNotFoundException extends Exception {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with ID ${identifier} not found`
      : `${resource} not found`;
    super(message, 404);
  }
}

export class ResourceAlreadyExistsException extends Exception {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with ID ${identifier} already exists`
      : `${resource} already exists`;
    super(message, 409);
  }
}

// Business logic exceptions
export class ExpenseException extends Exception {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode);
  }
}

export class ExpenseNotFound extends ResourceNotFoundException {
  constructor(expenseId?: number) {
    super('Expense', expenseId);
  }
}

export class InvalidExpenseDataException extends ValidationException {
  constructor(field: string, message: string) {
    super(`Invalid expense data - ${field}: ${message}`, field);
  }
}

export class ExpenseOperationException extends Exception {
  constructor(operation: string, reason: string) {
    super(`Failed to ${operation} expense: ${reason}`, 500);
  }
}

// Database related exceptions
export class DatabaseException extends Exception {
  constructor(message: string, operation?: string) {
    const fullMessage = operation
      ? `Database error during ${operation}: ${message}`
      : `Database error: ${message}`;
    super(fullMessage, 500);
  }
}

// Authentication/Authorization exceptions
export class UnauthorizedException extends Exception {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenException extends Exception {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
  }
}

// Configuration exceptions
export class ConfigurationException extends Exception {
  constructor(configKey: string, message?: string) {
    const fullMessage = message
      ? `Configuration error for ${configKey}: ${message}`
      : `Missing or invalid configuration: ${configKey}`;
    super(fullMessage, 500);
  }
}

// External service exceptions
export class ExternalServiceException extends Exception {
  constructor(service: string, message: string) {
    super(`External service error (${service}): ${message}`, 502);
  }
}

// Rate limiting exceptions
export class RateLimitException extends Exception {
  constructor(limit: number, window: string) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`, 429);
  }
}

// Export factory functions for common use cases
export const createExpenseNotFoundError = (id?: number) =>
  new ExpenseNotFound(id);
export const createValidationError = (field: string, message: string) =>
  new InvalidExpenseDataException(field, message);
export const createDatabaseError = (operation: string, message: string) =>
  new DatabaseException(message, operation);
export const createResourceNotFoundError = (
  resource: string,
  id?: string | number
) => new ResourceNotFoundException(resource, id);

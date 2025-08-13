export interface ExpenseEntity {
  id: number;
  name: string;
  amount: number;
  currency: string;
  category: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseEntity {
  name: string;
  amount: number;
  currency: string;
  category: string;
  date: Date;
}

export interface UpdateExpenseEntity {
  name?: string;
  amount?: number;
  currency?: string;
  category?: string;
  date?: Date;
}

export const ExpenseValidationRules = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  amount: {
    required: true,
    type: 'number',
    min: 0.01,
    max: 999999.99,
  },
  currency: {
    required: true,
    minLength: 3,
    maxLength: 3,
    pattern: /^[A-Z]{3}$/,
  },
  category: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  date: {
    required: false,
    type: 'date',
  },
} as const;

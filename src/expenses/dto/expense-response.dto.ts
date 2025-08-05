import { Expense } from '../../db/db.service';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ExpenseListResponse extends ApiResponse<Expense[]> {
  count?: number;
  category?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface ExpenseStats {
  totalAmount: number;
  totalCount: number;
  categories: Array<{
    category: string;
    total: number;
    count: number;
  }>;
}

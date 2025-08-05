export interface CreateExpenseDto {
  name: string;
  amount: number;
  currency: string;
  category: string;
  date?: string;
}

export interface UpdateExpenseDto {
  name?: string;
  amount?: number;
  currency?: string;
  category?: string;
  date?: string;
}

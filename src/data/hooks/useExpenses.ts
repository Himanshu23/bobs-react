import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Expense } from '../../types';
import { ENDPOINTS } from '../../config/api';
import { getHeaders } from '../../utils/authHelpers';

const fetchExpenses = async (
  filters: Partial<{
    fromDate: string;
    toDate: string;
    categoryId: string;
    madeBy: string;
  }>
): Promise<Expense[]> => {
  const params = new URLSearchParams();
  if (filters.fromDate) params.append('startDate', filters.fromDate);
  if (filters.toDate) params.append('endDate', filters.toDate);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.madeBy) params.append('madeBy', filters.madeBy);

  const url = `${ENDPOINTS.EXPENSES}?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load expenses: ${response.statusText}`);
  }

  return response.json();
};

const createExpense = async (
  expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'categoryName'>
): Promise<Expense> => {
  const response = await fetch(ENDPOINTS.EXPENSES, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(expense),
  });

  if (!response.ok) {
    throw new Error(`Failed to create expense: ${response.statusText}`);
  }

  return response.json();
};

const updateExpense = async (expense: Expense): Promise<Expense> => {
  const response = await fetch(`${ENDPOINTS.EXPENSES}/${expense.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(expense),
  });

  if (!response.ok) {
    throw new Error(`Failed to update expense: ${response.statusText}`);
  }

  return response.json();
};

const deleteExpense = async (expenseId: string): Promise<void> => {
  const response = await fetch(`${ENDPOINTS.EXPENSES}/${expenseId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete expense: ${response.statusText}`);
  }
};

export const useExpenses = (filters: {
  fromDate?: string;
  toDate?: string;
  categoryId?: string;
  madeBy?: string;
}) => {
  return useQuery<Expense[], Error>({
    queryKey: [
      'expenses',
      filters.fromDate,
      filters.toDate,
      filters.categoryId,
      filters.madeBy,
    ],
    queryFn: () => fetchExpenses(filters),
    staleTime: 1000 * 30,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Expense,
    Error,
    Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'categoryName'>
  >({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, Expense>({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

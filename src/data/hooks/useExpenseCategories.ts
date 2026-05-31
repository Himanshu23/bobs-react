import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExpenseCategory } from '../../types';
import { ENDPOINTS } from '../../config/api';
import { getHeaders } from '../../utils/authHelpers';

const fetchExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  const response = await fetch(ENDPOINTS.CATEGORIES, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load expense categories: ${response.statusText}`
    );
  }

  return response.json();
};

const createExpenseCategory = async (payload: {
  name: string;
  recurring?: boolean;
}): Promise<ExpenseCategory> => {
  const response = await fetch(ENDPOINTS.CATEGORIES, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create expense category: ${response.statusText}`
    );
  }

  return response.json();
};

const updateExpenseCategory = async (
  id: string,
  payload: { name?: string; recurring?: boolean }
): Promise<ExpenseCategory> => {
  const response = await fetch(`${ENDPOINTS.CATEGORIES}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to update expense category: ${response.statusText}`
    );
  }

  return response.json();
};

const deleteExpenseCategory = async (id: string): Promise<void> => {
  const response = await fetch(`${ENDPOINTS.CATEGORIES}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to delete expense category: ${response.statusText}`
    );
  }
};

export const useExpenseCategories = () => {
  return useQuery<ExpenseCategory[], Error>({
    queryKey: ['expenseCategories'],
    queryFn: fetchExpenseCategories,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ExpenseCategory,
    Error,
    { name: string; recurring?: boolean }
  >({
    mutationFn: createExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    },
  });
};

export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ExpenseCategory,
    Error,
    { id: string; name?: string; recurring?: boolean }
  >({
    mutationFn: ({ id, name, recurring }) =>
      updateExpenseCategory(id, { name, recurring }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    },
  });
};

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FoodItem } from '../../types';
import { getAuthState } from '../../admin/auth';
import { ENDPOINTS } from '../../config/api';

const FOOD_ITEMS_API_URL = ENDPOINTS.FOOD_ITEMS;

const fetchFoodItems = async (): Promise<FoodItem[]> => {
  const authState = getAuthState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authState.token) {
    headers['Authorization'] = `Bearer ${authState.token}`;
  }

  const response = await fetch(FOOD_ITEMS_API_URL, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch food items: ${response.statusText}`);
  }

  const data: FoodItem[] = await response.json();
  console.log({ data });
  return data;
};

const updateFoodItem = async (
  id: string,
  foodItem: FoodItem
): Promise<FoodItem> => {
  const authState = getAuthState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authState.token) {
    headers['Authorization'] = `Bearer ${authState.token}`;
  }

  const response = await fetch(`${FOOD_ITEMS_API_URL}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(foodItem),
  });

  if (!response.ok) {
    throw new Error(`Failed to update food item: ${response.statusText}`);
  }

  const data: FoodItem = await response.json();
  return data;
};

export const useFoodItems = () => {
  return useQuery<FoodItem[], Error>({
    queryKey: ['foodItems'],
    queryFn: fetchFoodItems,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

export const useUpdateFoodItem = () => {
  const queryClient = useQueryClient();

  return useMutation<FoodItem, Error, { id: string; foodItem: FoodItem }>({
    mutationFn: ({ id, foodItem }) => updateFoodItem(id, foodItem),
    onSuccess: (updatedItem) => {
      // Invalidate the foodItems list to refetch
      queryClient.invalidateQueries({ queryKey: ['foodItems'] });
      console.log('Item updated successfully:', updatedItem);
    },
    onError: (error) => {
      console.error('Error updating item:', error);
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FoodItem } from '../../types';
import { getAuthState } from '../../admin/auth';
import { ENDPOINTS } from '../../config/api';
import { fetchWithAdminAuth } from '../../utils/authHelpers';
import { toApiError } from '../../admin/api/apiError';
import { AdminFoodItem } from '../../admin/types/marketplace';

const FOOD_ITEMS_API_URL = ENDPOINTS.FOOD_ITEMS;

export interface UseFoodItemsOptions {
  /** Admin-only view that includes unavailable items. */
  includeUnavailable?: boolean;
}

const fetchFoodItems = async (
  options: UseFoodItemsOptions = {}
): Promise<FoodItem[]> => {
  const authState = getAuthState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authState.token) {
    headers['Authorization'] = `Bearer ${authState.token}`;
  }

  const params = new URLSearchParams({
    includeUnavailable: String(options.includeUnavailable ?? false),
  });
  const response = await fetch(`${FOOD_ITEMS_API_URL}?${params}`, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch food items: ${response.statusText}`);
  }

  const data: FoodItem[] = await response.json();
  return data;
};

/**
 * Admin menu list (§5.3). Sends the admin token only (fetchWithAdminAuth →
 * getAdminHeaders) and:
 * - `includeInactiveRestaurants=true`, so items of inactive restaurants or
 *   markets stay visible to the admin;
 * - no `available` param: the backend keeps only available items for ANY value
 *   of `available`, so omitting it is how the admin also sees unavailable items.
 */
const fetchAdminFoodItems = async (): Promise<AdminFoodItem[]> => {
  const params = new URLSearchParams({ includeInactiveRestaurants: 'true' });
  const response = await fetchWithAdminAuth(`${FOOD_ITEMS_API_URL}?${params}`);

  if (!response.ok) {
    throw await toApiError(response, 'Failed to fetch food items');
  }

  return response.json();
};

const createFoodItem = async (foodItem: FoodItem): Promise<FoodItem> => {
  const response = await fetchWithAdminAuth(FOOD_ITEMS_API_URL, {
    method: 'POST',
    body: JSON.stringify(foodItem),
  });

  if (!response.ok) {
    throw await toApiError(response, 'Failed to create food item');
  }

  const data: FoodItem = await response.json();
  return data;
};

const deleteFoodItem = async (foodItem: FoodItem): Promise<boolean> => {
  const response = await fetchWithAdminAuth(
    `${FOOD_ITEMS_API_URL}/${foodItem.id}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw await toApiError(response, 'Failed to delete food item');
  }

  // The backend answers 204 No Content.
  return true;
};

const updateFoodItem = async (
  id: string,
  foodItem: FoodItem
): Promise<FoodItem> => {
  const response = await fetchWithAdminAuth(`${FOOD_ITEMS_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(foodItem),
  });

  if (!response.ok) {
    throw await toApiError(response, 'Failed to update food item');
  }

  const data: FoodItem = await response.json();
  return data;
};

export const useFoodItems = (options: UseFoodItemsOptions = {}) => {
  const includeUnavailable = options.includeUnavailable ?? false;

  return useQuery<FoodItem[], Error>({
    queryKey: ['foodItems', { includeUnavailable }],
    queryFn: () => fetchFoodItems({ includeUnavailable }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

/** Admin Menu tab list: all items, incl. unavailable and inactive restaurants. */
export const useAdminFoodItems = () =>
  useQuery<AdminFoodItem[], Error>({
    queryKey: ['foodItems', 'admin'],
    queryFn: fetchAdminFoodItems,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

export const useCreateFoodItem = () => {
  const queryClient = useQueryClient();

  return useMutation<FoodItem, Error, FoodItem>({
    mutationFn: (foodItem) => createFoodItem(foodItem),
    // Never retry a write: a retried POST can create a duplicate item.
    retry: false,
    onSuccess: (createdItem) => {
      queryClient.invalidateQueries({ queryKey: ['foodItems'] });
      console.log('Item created successfully:', createdItem);
    },
    onError: (error) => {
      console.error('Error creating item:', error);
    },
  });
};

export const useDeleteFoodItem = () => {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, FoodItem>({
    mutationFn: (foodItem) => deleteFoodItem(foodItem),
    // Never retry a write: a retried POST can create a duplicate item.
    retry: false,
    onSuccess: (createdItem) => {
      queryClient.invalidateQueries({ queryKey: ['foodItems'] });
      console.log('Item deleted successfully:', createdItem);
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
    },
  });
};

export const useUpdateFoodItem = () => {
  const queryClient = useQueryClient();

  return useMutation<FoodItem, Error, { id: string; foodItem: FoodItem }>({
    mutationFn: ({ id, foodItem }) => updateFoodItem(id, foodItem),
    // Never retry a write: a retried POST can create a duplicate item.
    retry: false,
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

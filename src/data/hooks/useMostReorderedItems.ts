import { useQuery } from '@tanstack/react-query';
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
  return data;
};

/**
 * Calculate most reordered items based on order count
 * Sorts items by reorderCount (order count), then by rating
 * Returns top 6 items
 */
const calculateMostReorderedItems = (items: FoodItem[]): FoodItem[] => {
  if (items.length === 0) {
    return [];
  }

  return [...items]
    .sort((a, b) => {
      // Primary sort: order count (reorderCount)
      const leftOrderCount = a.reorderCount ?? 0;
      const rightOrderCount = b.reorderCount ?? 0;

      if (rightOrderCount !== leftOrderCount) {
        return rightOrderCount - leftOrderCount;
      }

      // Secondary sort: rating if order count is the same
      return (b.rating ?? 0) - (a.rating ?? 0);
    })
    .slice(0, 6);
};

/**
 * Fetch and cache most reordered items
 * Uses TanStack Query for caching with 10-minute stale time
 */
export const useMostReorderedItems = () => {
  return useQuery<FoodItem[], Error>({
    queryKey: ['mostReorderedItems'],
    queryFn: async () => {
      const items = await fetchFoodItems();
      return calculateMostReorderedItems(items);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
    retry: 2,
  });
};

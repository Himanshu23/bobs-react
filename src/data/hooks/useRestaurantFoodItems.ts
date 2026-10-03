import { useQuery } from '@tanstack/react-query';
import { FoodItem } from '../../types';
import { ENDPOINTS } from '../../config/api';
import { fetchPublicJson } from './marketplaceFetch';

export interface UseRestaurantFoodItemsOptions {
  /** Only this restaurant's items (`bobs` also returns legacy items). */
  restaurantId?: string;
  /** Only items whose restaurant is in this market. */
  marketId?: string;
}

/**
 * Customer menu scoped to one restaurant (D11: menus are never mixed).
 * Kept separate from `useFoodItems` so the unfiltered/admin call is unchanged.
 * The query key starts with `foodItems`, so admin menu mutations that
 * invalidate `['foodItems']` refresh it too.
 */
export const useRestaurantFoodItems = (
  options: UseRestaurantFoodItemsOptions
) => {
  const { restaurantId, marketId } = options;

  return useQuery<FoodItem[], Error>({
    queryKey: [
      'foodItems',
      { restaurantId: restaurantId ?? null, marketId: marketId ?? null },
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (restaurantId) params.set('restaurantId', restaurantId);
      if (marketId) params.set('marketId', marketId);
      return fetchPublicJson<FoodItem[]>(
        `${ENDPOINTS.FOOD_ITEMS}?${params.toString()}`
      );
    },
    enabled: Boolean(restaurantId || marketId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../../config/api';
import {
  FALLBACK_DEFAULT_RESTAURANT,
  Restaurant,
} from '../../types/marketplace';
import { CartRestaurantRef } from '../../utils/cartUtils';
import { fetchPublicJson } from './marketplaceFetch';

const RESTAURANTS_STALE_TIME = 1000 * 60 * 5; // 5 minutes

/**
 * Active restaurants in active markets, sorted by displayOrder then name.
 * Without `marketId`, restaurants of all active markets are returned.
 */
export const useRestaurants = (
  marketId?: string,
  options: { enabled?: boolean } = {}
) =>
  useQuery<Restaurant[], Error>({
    queryKey: ['restaurants', { marketId: marketId ?? null }],
    queryFn: () => {
      const url = marketId
        ? `${ENDPOINTS.RESTAURANTS}?${new URLSearchParams({ marketId })}`
        : ENDPOINTS.RESTAURANTS;
      return fetchPublicJson<Restaurant[]>(url);
    },
    enabled: options.enabled ?? true,
    staleTime: RESTAURANTS_STALE_TIME,
    retry: 2,
  });

/** One active restaurant by id, falling back to slug on the server. 404 → error. */
export const useRestaurant = (idOrSlug: string | undefined) =>
  useQuery<Restaurant, Error>({
    queryKey: ['restaurant', idOrSlug],
    queryFn: () =>
      fetchPublicJson<Restaurant>(
        `${ENDPOINTS.RESTAURANTS}/${encodeURIComponent(idOrSlug as string)}`
      ),
    enabled: Boolean(idOrSlug),
    staleTime: RESTAURANTS_STALE_TIME,
    retry: (failureCount, error) =>
      (error as Error & { status?: number }).status !== 404 && failureCount < 2,
  });

/**
 * Restaurants of all active markets by id, for display (phone) and to stamp
 * restaurant data on cart items. Bob's is always present: from the API when
 * its record exists, else the built-in fallback.
 */
export const useRestaurantDirectory = () => {
  const { data: restaurants } = useRestaurants();
  return useMemo(() => {
    const byId = new Map<string, Restaurant>([
      [FALLBACK_DEFAULT_RESTAURANT.id, FALLBACK_DEFAULT_RESTAURANT],
    ]);
    (restaurants ?? []).forEach((restaurant) =>
      byId.set(restaurant.id, restaurant)
    );
    const refs = new Map<string, CartRestaurantRef>();
    byId.forEach((restaurant, id) =>
      refs.set(id, {
        id,
        name: restaurant.name,
        marketId: restaurant.marketId,
      })
    );
    return { restaurantsById: byId, restaurantRefsById: refs };
  }, [restaurants]);
};

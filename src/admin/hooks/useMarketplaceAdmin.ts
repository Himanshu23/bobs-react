/**
 * React Query hooks for the ADMIN market and restaurant endpoints (§5.1, §5.2).
 * Every call goes through fetchWithAdminAuth (401/403 → admin login), and
 * 400/404 `{"error"}` bodies surface as the Error message.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config/api';
import { fetchWithAdminAuth } from '../../utils/authHelpers';
import { toApiError } from '../api/apiError';
import {
  MarketAdmin,
  MarketRequest,
  RestaurantAdmin,
  RestaurantRequest,
} from '../types/marketplace';

const ADMIN_MARKETS_URL = `${API_BASE_URL}/admin/markets`;
const ADMIN_RESTAURANTS_URL = `${API_BASE_URL}/admin/restaurants`;

export const ADMIN_MARKETS_KEY = ['admin', 'markets'] as const;
export const ADMIN_RESTAURANTS_KEY = ['admin', 'restaurants'] as const;

/**
 * Storefront query keys (customer hooks useMarkets/useRestaurants). Prefix
 * matches, so an admin save also refreshes the storefront in the same tab.
 */
const STOREFRONT_KEYS = [['markets'], ['restaurants'], ['restaurant']];

const invalidateMarketplace = (
  queryClient: ReturnType<typeof useQueryClient>
) => {
  queryClient.invalidateQueries({ queryKey: ADMIN_MARKETS_KEY });
  queryClient.invalidateQueries({ queryKey: ADMIN_RESTAURANTS_KEY });
  // Market/restaurant active state changes which items are visible.
  queryClient.invalidateQueries({ queryKey: ['foodItems'] });
  STOREFRONT_KEYS.forEach((queryKey) =>
    queryClient.invalidateQueries({ queryKey })
  );
};

const requestJson = async <T>(
  url: string,
  fallbackError: string,
  init: { method?: string; body?: string } = {}
): Promise<T> => {
  const response = await fetchWithAdminAuth(url, init);
  if (!response.ok) {
    throw await toApiError(response, fallbackError);
  }
  return response.json();
};

// ---------------------------------------------------------------- markets

export const useAdminMarkets = () =>
  useQuery<MarketAdmin[], Error>({
    queryKey: ADMIN_MARKETS_KEY,
    queryFn: () =>
      requestJson<MarketAdmin[]>(ADMIN_MARKETS_URL, 'Failed to load markets'),
    staleTime: 1000 * 60,
  });

export const useSaveMarket = () => {
  const queryClient = useQueryClient();
  return useMutation<
    MarketAdmin,
    Error,
    { id?: string; market: MarketRequest }
  >({
    mutationFn: ({ id, market }) =>
      requestJson<MarketAdmin>(
        id
          ? `${ADMIN_MARKETS_URL}/${encodeURIComponent(id)}`
          : ADMIN_MARKETS_URL,
        'Failed to save market',
        { method: id ? 'PUT' : 'POST', body: JSON.stringify(market) }
      ),
    retry: false,
    onSuccess: () => invalidateMarketplace(queryClient),
  });
};

// ------------------------------------------------------------ restaurants

export const useAdminRestaurants = () =>
  useQuery<RestaurantAdmin[], Error>({
    queryKey: ADMIN_RESTAURANTS_KEY,
    queryFn: () =>
      requestJson<RestaurantAdmin[]>(
        ADMIN_RESTAURANTS_URL,
        'Failed to load restaurants'
      ),
    staleTime: 1000 * 60,
  });

export const useSaveRestaurant = () => {
  const queryClient = useQueryClient();
  return useMutation<
    RestaurantAdmin,
    Error,
    { id?: string; restaurant: RestaurantRequest }
  >({
    mutationFn: ({ id, restaurant }) =>
      requestJson<RestaurantAdmin>(
        id
          ? `${ADMIN_RESTAURANTS_URL}/${encodeURIComponent(id)}`
          : ADMIN_RESTAURANTS_URL,
        'Failed to save restaurant',
        { method: id ? 'PUT' : 'POST', body: JSON.stringify(restaurant) }
      ),
    retry: false,
    onSuccess: () => invalidateMarketplace(queryClient),
  });
};

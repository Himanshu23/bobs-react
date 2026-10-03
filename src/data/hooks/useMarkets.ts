import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../../config/api';
import { DEFAULT_MARKET_ID, Market } from '../../types/marketplace';
import { DeliveryArea, resolveDeliveryArea } from '../../utils/geo';
import { fetchPublicJson } from './marketplaceFetch';

const MARKETS_STALE_TIME = 1000 * 60 * 10; // 10 minutes

/** Active markets, sorted by displayOrder then name (server order). */
export const useMarkets = () =>
  useQuery<Market[], Error>({
    queryKey: ['markets'],
    queryFn: () => fetchPublicJson<Market[]>(ENDPOINTS.MARKETS),
    staleTime: MARKETS_STALE_TIME,
    retry: 2,
  });

/**
 * Market 1 only for now: the market is implicit. Returns the requested market
 * id if given, else the first active market, else `market1` (when there are
 * no active markets, or the call failed or is still loading). Callers that
 * must not fetch with the fallback id while the markets are loading should
 * wait for `isResolved`.
 */
export const useCurrentMarketId = (requestedMarketId?: string) => {
  const { data: markets, isPending } = useMarkets();
  if (requestedMarketId) {
    return { marketId: requestedMarketId, isResolved: true };
  }
  return {
    marketId: markets?.[0]?.id ?? DEFAULT_MARKET_ID,
    isResolved: !isPending,
  };
};

/** One active market (`GET /api/markets/{id}`): delivery area and flat fee. */
export const useMarket = (marketId: string | undefined) =>
  useQuery<Market, Error>({
    queryKey: ['market', marketId],
    queryFn: () =>
      fetchPublicJson<Market>(
        `${ENDPOINTS.MARKETS}/${encodeURIComponent(marketId as string)}`
      ),
    enabled: Boolean(marketId),
    staleTime: MARKETS_STALE_TIME,
    retry: (failureCount, error) =>
      (error as Error & { status?: number }).status !== 404 && failureCount < 2,
  });

/**
 * The delivery area of a market (default: the current market). Falls back to
 * the built-in constants only while loading or when the market call fails
 * (`area.isFallback`).
 */
export const useDeliveryArea = (
  marketId?: string
): {
  area: DeliveryArea;
  market: Market | undefined;
  isLoading: boolean;
  isError: boolean;
} => {
  const { marketId: currentMarketId, isResolved } =
    useCurrentMarketId(marketId);
  const query = useMarket(isResolved ? currentMarketId : undefined);
  const area = useMemo(() => resolveDeliveryArea(query.data), [query.data]);
  return {
    area,
    market: query.data,
    isLoading: !isResolved || query.isPending,
    isError: query.isError,
  };
};

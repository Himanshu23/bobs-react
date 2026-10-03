import { DEFAULT_MARKET_ID } from '../types/marketplace';

/**
 * Fallback delivery area, used ONLY when `GET /api/markets/{id}` fails (or
 * while it is loading). The real area is the market's `center`/`radiusKm`
 * from the API. These values match `market1` as created by migration 001.
 */
export const FALLBACK_DELIVERY_AREA = {
  marketId: DEFAULT_MARKET_ID,
  name: 'Market 1',
  center: { lat: 28.639909, lng: 77.376881 },
  radiusKm: 6,
} as const;

/** Fallback flat delivery fee (D3), used only when the market call fails. */
export const FALLBACK_DELIVERY_FEE = 20;

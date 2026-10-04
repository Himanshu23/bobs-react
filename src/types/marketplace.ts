// Public marketplace types. They mirror the backend `MarketPublic` and
// `RestaurantPublic` DTOs (docs/PLAN-multi-restaurant.md §5.1 and §5.2).

/** Fixed id of the default market (config `app.default-market-id`). */
export const DEFAULT_MARKET_ID = 'market1';
/** Fixed id (and slug) of the default restaurant (config `app.default-restaurant-id`). */
export const DEFAULT_RESTAURANT_ID = 'bobs';
/** Display name used for legacy data that predates restaurants. */
export const DEFAULT_RESTAURANT_NAME = "Bob's";

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** `GET /api/markets` and `GET /api/markets/{id}` (active markets only). */
export interface Market {
  id: string;
  name: string;
  center: GeoPoint;
  radiusKm: number;
  /** Flat delivery fee per order, in rupees. */
  deliveryFee: number;
  displayOrder: number;
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/** One day of a restaurant's week (D15). Times are 24h "HH:mm", India time. */
export interface DaySchedule {
  day: DayOfWeek;
  open: string;
  close: string;
  /** Closed all day (open/close ignored). */
  closed: boolean;
}

/** Why `openNow` is false (D15). */
export type RestaurantClosedReason = 'PAUSED' | 'SCHEDULE';

/**
 * `GET /api/restaurants?marketId=` and `GET /api/restaurants/{idOrSlug}`.
 * `phone` is always present (D6). Commission fields are never sent publicly.
 */
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  marketId: string;
  phone: string;
  address?: string | null;
  location?: GeoPoint | null;
  imageUrl?: string | null;
  cuisineTags?: string[] | null;
  displayOrder: number;
  /** Card carousel images; `imageUrl` is used when this is empty. */
  imageUrls?: string[] | null;
  /** One-line offer shown on the restaurant card (hidden when blank). */
  promoText?: string | null;
  /** Shown in the restaurant info sheet. */
  description?: string | null;
  /** Free text, e.g. "11 AM – 11 PM". Shown in the info sheet. */
  openingHours?: string | null;
  /** FSSAI licence number, shown in the info sheet. */
  fssaiNumber?: string | null;
  // Opening hours (D15). The server computes the open/closed fields in India
  // time; the client never works out hours or timezones itself.
  /** 7 entries MONDAY..SUNDAY; null/absent = always open. */
  weeklySchedule?: DaySchedule[] | null;
  /** False = paused by the admin (closed regardless of the schedule). */
  acceptingOrders?: boolean | null;
  /** Server-computed. Missing (older backend) is treated as open. */
  openNow?: boolean | null;
  closedReason?: RestaurantClosedReason | null;
  /** ISO-8601 with offset, e.g. "2026-10-04T11:00:00+05:30". */
  nextOpensAt?: string | null;
  /** e.g. "Opens tomorrow at 11:00 AM", "Not accepting orders right now", "Closed". */
  nextOpensLabel?: string | null;
}

/** Bob's public number (also in the app header). */
export const DEFAULT_RESTAURANT_PHONE = '9643310092';

/**
 * Bob's, for when `/api/restaurants/bobs` has no record yet (before the
 * migration creates it), so legacy `/bobs/*` links, the cart group phone and
 * restaurant data on cart items still work.
 */
export const FALLBACK_DEFAULT_RESTAURANT: Restaurant = {
  id: DEFAULT_RESTAURANT_ID,
  name: DEFAULT_RESTAURANT_NAME,
  slug: DEFAULT_RESTAURANT_ID,
  marketId: DEFAULT_MARKET_ID,
  phone: DEFAULT_RESTAURANT_PHONE,
  displayOrder: 0,
  // Optional display fields are absent until set on the restaurant record.
  imageUrls: undefined,
  promoText: undefined,
  description: undefined,
  openingHours: undefined,
  fssaiNumber: undefined,
  // Always orderable: no schedule means always open (D15).
  weeklySchedule: undefined,
  acceptingOrders: true,
  openNow: true,
  closedReason: null,
  nextOpensAt: null,
  nextOpensLabel: null,
};

/** `{ "error": "..." }` body sent with 400/404 by the marketplace endpoints. */
export interface ApiErrorBody {
  error?: string;
}

/**
 * Admin-side marketplace types. Mirror the backend DTOs in
 * backend/.../dto/marketplace (MarketDTO, MarketRequestDTO, RestaurantDTO,
 * RestaurantRequestDTO). See docs/PLAN-multi-restaurant.md §5.1–5.2.
 */
import { FoodItem } from '../../types';

/** Default ids fixed by the backend (§5). */
export const DEFAULT_MARKET_ID = 'market1';
export const DEFAULT_RESTAURANT_ID = 'bobs';

export interface AdminGeoPoint {
  lat: number;
  lng: number;
}

/** Response of GET/POST/PUT /api/admin/markets. */
export interface MarketAdmin {
  id: string;
  name: string;
  center: AdminGeoPoint;
  radiusKm: number;
  deliveryFee: number;
  active: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Body of POST/PUT /api/admin/markets. */
export interface MarketRequest {
  name: string;
  center: AdminGeoPoint;
  radiusKm: number;
  deliveryFee?: number | null;
  active?: boolean | null;
  displayOrder?: number | null;
}

/** Days of `weeklySchedule`, in the required order (D15). */
export const WEEK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

/**
 * One day of a restaurant's opening hours (D15). Times are 24h "HH:mm" in
 * India time. `closed` = closed all day; `close < open` = closes after
 * midnight; `open == close` = open 24 hours.
 */
export interface DaySchedule {
  day: WeekDay;
  open: string;
  close: string;
  closed: boolean;
}

/** Why a restaurant is closed now (computed by the server). */
export type ClosedReason = 'PAUSED' | 'SCHEDULE';

/** Response of GET/POST/PUT /api/admin/restaurants. */
export interface RestaurantAdmin {
  id: string;
  name: string;
  slug: string;
  marketId: string;
  phone: string;
  address?: string | null;
  location?: AdminGeoPoint | null;
  imageUrl?: string | null;
  cuisineTags?: string[] | null;
  commissionPercent: number;
  discountSharePercent: number;
  active: boolean;
  displayOrder: number;
  /** 7 entries MONDAY..SUNDAY; null/absent = always open. */
  weeklySchedule?: DaySchedule[] | null;
  /** false = paused (closed regardless of the schedule). Default true. */
  acceptingOrders?: boolean | null;
  // Read-only, computed by the server at response time (D15):
  openNow?: boolean;
  closedReason?: ClosedReason | null;
  /** ISO-8601 with offset, e.g. "2026-10-04T11:00:00+05:30". */
  nextOpensAt?: string | null;
  /** e.g. "Opens tomorrow at 11:00 AM", "Not accepting orders right now". */
  nextOpensLabel?: string | null;
  /** Server-generated summary when weeklySchedule is set. */
  openingHours?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Body of POST/PUT /api/admin/restaurants. A blank slug is auto-generated/kept. */
export interface RestaurantRequest {
  name: string;
  slug?: string;
  marketId: string;
  phone: string;
  address?: string | null;
  location?: AdminGeoPoint | null;
  imageUrl?: string | null;
  cuisineTags?: string[];
  commissionPercent?: number | null;
  discountSharePercent?: number | null;
  active?: boolean | null;
  displayOrder?: number | null;
  /**
   * Omitted (undefined) on PUT = keep the stored value. On POST, null =
   * always open.
   */
  weeklySchedule?: DaySchedule[] | null;
  /** Omitted/null on PUT = keep the stored value. */
  acceptingOrders?: boolean | null;
}

/**
 * Food item as the admin sees it. The backend always returns `restaurantId`
 * (legacy items resolve to `bobs`, §5.3). Kept as an alias so admin code has
 * one place to extend admin-only item fields.
 */
export type AdminFoodItem = FoodItem;

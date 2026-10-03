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
}

/**
 * Food item as the admin sees it. The backend always returns `restaurantId`
 * (legacy items resolve to `bobs`, §5.3). Kept as an alias so admin code has
 * one place to extend admin-only item fields.
 */
export type AdminFoodItem = FoodItem;

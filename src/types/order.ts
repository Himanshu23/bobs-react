// Public order types for the customer flow. They mirror the backend
// `POST /api/orders` request and the `PublicOrderDTO` /
// `PublicRestaurantOrderDTO` response (docs/PLAN-multi-restaurant.md §5.5–5.6).
// The admin (full) order shape lives in `types/index.ts` (`Order`).

import { OrderFulfillmentType, OrderStatus } from './index';
import { GeoPoint } from './marketplace';

/**
 * One item in the `POST /orders` body. Only what the server reads: it prices
 * the item from the catalogue (`unitPrice`), sets `itemName` and the
 * restaurant fields itself, and drops unknown fields such as
 * `isPromotionalAddon`/`originalPrice`.
 */
export interface CreateOrderItemRequest {
  foodItemId: string;
  quantity: number;
  size?: string;
  style?: string;
  base?: string;
  isFreeClaim: boolean;
}

/**
 * `POST /orders` body. Server-owned fields (`marketId`, `restaurantOrders`,
 * `subtotal`, `totalAmount`, `deliveryFee`, item prices and restaurants) are
 * deliberately absent: the server ignores them (§5.6).
 */
export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  /** Selected address coordinates; sent for DELIVERY/SCHEDULED only. */
  deliveryLocation?: GeoPoint;
  fulfillmentType: OrderFulfillmentType;
  scheduledTime?: string;
  items: CreateOrderItemRequest[];
  /** Stored as sent, not verified (discount codes are frontend-only). */
  discountAmount?: number;
  discountCode?: string;
  discountName?: string;
  promotionalSavings?: number;
  /** Informational only (5% of subtotal − discount); never charged. */
  taxAmount?: number;
  isPaidOnline: boolean;
}

/** An item as returned by the server (catalogue price, restaurant stamped). */
export interface PublicOrderItem {
  foodItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  size?: string | null;
  style?: string | null;
  base?: string | null;
  isFreeClaim?: boolean | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
}

/** `PublicRestaurantOrderDTO`: no commission/payout fields. */
export interface PublicRestaurantOrder {
  restaurantId: string;
  restaurantName: string;
  restaurantPhone?: string | null;
  items: PublicOrderItem[];
  /** Σ unitPrice × quantity at catalogue prices (free claims/promos at full price). */
  subtotal: number;
  status: OrderStatus;
  statusUpdatedAt?: string | null;
}

/** `PublicOrderDTO`: response of `POST /orders` and `GET /orders/get/{id}`. */
export interface PublicOrder {
  id: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLocation?: GeoPoint | null;
  fulfillmentType: OrderFulfillmentType;
  scheduledTime?: string | null;
  items: PublicOrderItem[];
  /** Items gross at catalogue prices. Not what the customer pays (§5.5). */
  totalAmount: number;
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  isPaidOnline?: boolean | null;
  subtotal?: number | null;
  discountAmount?: number | null;
  discountCode?: string | null;
  discountName?: string | null;
  promotionalSavings?: number | null;
  /** Server fee rule: market fee for DELIVERY/SCHEDULED, 0 for PICKUP. */
  deliveryFee?: number | null;
  taxAmount?: number | null;
  marketId?: string | null;
  /** Missing on legacy orders, `[]` for an order with no items. */
  restaurantOrders?: PublicRestaurantOrder[] | null;
  /**
   * D12: set on every order of a split pickup checkout (PICKUP from two or
   * more restaurants → one order per restaurant). Absent otherwise.
   */
  checkoutGroupId?: string | null;
  /**
   * D12, `POST /orders` response only: every order of a split pickup, in cart
   * order, this (the first) one included. Each has one `restaurantOrders`
   * entry and `deliveryFee` 0; the server allocates the discount, promo
   * savings and tax across them. Absent when the checkout wasn't split.
   * Entries never carry their own `groupOrders`.
   */
  groupOrders?: PublicOrder[] | null;
}

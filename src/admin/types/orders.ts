/**
 * Admin-side order, payout and sales-report types. They mirror the backend's
 * full (admin) Order shape and the dto/payout + dto/reporting classes. See
 * docs/PLAN-multi-restaurant.md §5.5–5.10.
 *
 * Money is a JSON number (BigDecimal/double on the server). Timestamps are
 * ISO-8601 UTC strings. Dates (`from`, `to`, `day`) are ISO dates = UTC days.
 */
import { Order, OrderItem, OrderStatus } from '../../types';

export type PayoutStatus = 'UNPAID' | 'PAID';

/** An order line as the admin endpoints return it (§5.5). */
export type AdminOrderItem = OrderItem & {
  restaurantId?: string | null;
  restaurantName?: string | null;
};

/** One restaurant's sub-order (`Order.restaurantOrders[]`, full admin shape). */
export interface AdminRestaurantOrder {
  restaurantId: string;
  restaurantName: string;
  restaurantPhone?: string | null;
  items: AdminOrderItem[];
  subtotal: number;
  status: OrderStatus;
  statusUpdatedAt?: string | null;
  commissionPercent?: number | null;
  commissionAmount?: number | null;
  discountShareAmount?: number | null;
  payoutAmount?: number | null;
  payoutStatus?: PayoutStatus | null;
  payoutRef?: string | null;
  paidAt?: string | null;
}

/**
 * The full order returned by the ADMIN endpoints (`GET /orders`, `PUT
 * /orders/{id}`, both `PATCH …/status`). `restaurantOrders` is missing/null on
 * legacy orders that migration 003 hasn't converted, and `[]` on an order with
 * no items.
 */
export type AdminFullOrder = Omit<
  Order,
  'items' | 'restaurantOrders' | 'marketId' | 'deliveryLocation'
> & {
  items: AdminOrderItem[];
  marketId?: string | null;
  deliveryLocation?: { lat: number; lng: number } | null;
  restaurantOrders?: AdminRestaurantOrder[] | null;
};

/** `GET /orders` (OrderResponseDTO). `totalAmount` = Σ order `totalAmount`. */
export interface AdminOrderListResponse {
  orders: AdminFullOrder[];
  totalAmount: number;
}

// ----------------------------------------------------------------- payouts

/** One sub-order as a payout line (PayoutLineDTO). Never CANCELLED. */
export interface PayoutLine {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  createdAt: string;
  status: OrderStatus | string;
  subtotal: number;
  commissionAmount: number;
  discountShareAmount: number;
  payoutAmount: number;
  payoutStatus: PayoutStatus;
  payoutRef?: string | null;
  paidAt?: string | null;
}

/** RestaurantPayoutSummaryDTO. */
export interface RestaurantPayoutSummary {
  restaurantId: string;
  restaurantName: string;
  /** Σ payoutAmount of UNPAID sub-orders. */
  owedAmount: number;
  /** Σ payoutAmount of PAID sub-orders. */
  paidAmount: number;
  unpaidCount: number;
  paidCount: number;
}

/** Response of `GET /admin/payouts` (PayoutReportDTO). */
export interface PayoutReport {
  from?: string | null;
  to?: string | null;
  restaurantId?: string | null;
  status?: string | null;
  totalOwed: number;
  totalPaid: number;
  restaurants: RestaurantPayoutSummary[];
  lines: PayoutLine[];
}

/** Query of `GET /admin/payouts`. Empty values are left out. */
export interface PayoutFilters {
  from?: string;
  to?: string;
  restaurantId?: string;
  status?: PayoutStatus | '';
}

/** Body of `POST /admin/payouts/mark-paid` (MarkPaidRequestDTO). */
export interface MarkPaidRequest {
  restaurantId: string;
  payoutRef: string;
  orderIds?: string[];
  from?: string;
  to?: string;
}

/** Response of mark-paid: only the lines this call changed. */
export interface MarkPaidResponse {
  restaurantId: string;
  payoutRef: string;
  paidAt: string;
  linesMarkedPaid: number;
  amountMarkedPaid: number;
}

// ----------------------------------------------------------- sales report

export type SalesGroupBy = 'restaurant' | 'day';

/** SalesRowDTO: a restaurant (groupBy=restaurant) or a UTC day (groupBy=day). */
export interface SalesRow {
  restaurantId?: string | null;
  restaurantName?: string | null;
  day?: string | null;
  orders: number;
  items: number;
  grossSubtotal: number;
  commission: number;
  discountShare: number;
  payout: number;
  freeClaimValue: number;
}

/** PlatformTotalsDTO. Always covers every restaurant. */
export interface PlatformTotals {
  orders: number;
  grossSubtotal: number;
  deliveryFees: number;
  commission: number;
  discountShare: number;
  payout: number;
  discounts: number;
  promotionalSavings: number;
  freeClaimValue: number;
  promoAndDiscountCost: number;
}

/** Response of `GET /reporting/sales` (SalesReportDTO). */
export interface SalesReport {
  from?: string | null;
  to?: string | null;
  groupBy: SalesGroupBy;
  restaurantId?: string | null;
  rows: SalesRow[];
  platform: PlatformTotals;
}

export interface SalesFilters {
  from?: string;
  to?: string;
  groupBy?: SalesGroupBy;
  restaurantId?: string;
}

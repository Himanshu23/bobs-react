/**
 * Pure helpers for the admin order screens (task 5.3, contract §5.5/§5.8).
 * Kept free of React so they can be unit tested.
 */
import { OrderStatus } from '../../types';
import { isConflictError } from '../api/apiError';
import {
  DEFAULT_RESTAURANT_ID,
  DEFAULT_RESTAURANT_NAME,
} from '../../types/marketplace';
import {
  AdminFullOrder,
  AdminOrderItem,
  AdminRestaurantOrder,
  PayoutStatus,
} from '../types/orders';
import { getSizeLabel } from '../../utils/sizeLabels';

// ------------------------------------------------------------- formatting

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `1200` → `₹1,200.00`. null/undefined/NaN show as `₹0.00`. */
export const formatRupees = (value: number | null | undefined): string => {
  const amount =
    typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const text = rupeeFormatter.format(Math.abs(amount));
  return amount < 0 ? `-₹${text}` : `₹${text}`;
};

/** Rounds to 2 decimals, HALF_UP like the server (for positive amounts). */
export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/** `tel:` link for a phone number (spaces and dashes removed). */
export const telHref = (phone?: string | null): string | null => {
  const cleaned = (phone ?? '').replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : null;
};

/**
 * `(Full, Dry)` for an item's size/style/base, or '' when it has none. Coffee
 * and Shakes sizes read Large/Medium/Small (`category` is on newer orders).
 */
export const formatItemVariant = (
  item: Pick<AdminOrderItem, 'size' | 'style' | 'base' | 'category'>
): string => {
  const parts = [
    getSizeLabel(item.size, item.category),
    item.style,
    item.base,
  ].filter((part): part is string => Boolean(part));
  return parts.length ? ` (${parts.join(', ')})` : '';
};

// ---------------------------------------------------------------- status

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

export type StatusChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

export const getStatusChipColor = (
  status?: OrderStatus | string | null
): StatusChipColor => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'warning';
    case OrderStatus.CONFIRMED:
    case OrderStatus.PREPARING:
      return 'info';
    case OrderStatus.READY:
    case OrderStatus.COMPLETED:
      return 'success';
    case OrderStatus.CANCELLED:
      return 'error';
    default:
      return 'default';
  }
};

export const getPayoutChipColor = (
  status?: PayoutStatus | null
): StatusChipColor => (status === 'PAID' ? 'success' : 'warning');

/**
 * Mirror of the backend's `OrderStatusRules.derive` (§5.8). The UI shows the
 * overall `status` exactly as returned; this is only used to explain it (e.g.
 * when the admin set the overall status by hand). A null status counts as
 * PENDING; no statuses → null.
 */
export const deriveOverallStatus = (
  subStatuses: (OrderStatus | null | undefined)[]
): OrderStatus | null => {
  if (!subStatuses.length) return null;
  const active = subStatuses
    .map((status) => status ?? OrderStatus.PENDING)
    .filter((status) => status !== OrderStatus.CANCELLED);
  if (!active.length) return OrderStatus.CANCELLED;
  if (active.every((s) => s === OrderStatus.COMPLETED)) {
    return OrderStatus.COMPLETED;
  }
  if (
    active.every((s) => s === OrderStatus.READY || s === OrderStatus.COMPLETED)
  ) {
    return OrderStatus.READY;
  }
  if (
    active.some(
      (s) =>
        s === OrderStatus.PREPARING ||
        s === OrderStatus.READY ||
        s === OrderStatus.COMPLETED
    )
  ) {
    return OrderStatus.PREPARING;
  }
  if (active.some((s) => s === OrderStatus.CONFIRMED)) {
    return OrderStatus.CONFIRMED;
  }
  return OrderStatus.PENDING;
};

/**
 * Short progress text for a multi-restaurant order, e.g. `1 of 2 restaurants
 * ready`. Cancelled sub-orders are left out of the count. Null for legacy or
 * single-restaurant orders, where it adds nothing.
 */
export const subOrderProgressText = (
  order: Pick<AdminFullOrder, 'restaurantOrders'>
): string | null => {
  const subOrders = order.restaurantOrders ?? [];
  if (subOrders.length < 2) return null;
  const active = subOrders.filter((s) => s.status !== OrderStatus.CANCELLED);
  const cancelled = subOrders.length - active.length;
  const ready = active.filter(
    (s) => s.status === OrderStatus.READY || s.status === OrderStatus.COMPLETED
  ).length;
  const base = `${ready} of ${active.length} restaurant${active.length === 1 ? '' : 's'} ready`;
  return cancelled ? `${base}, ${cancelled} cancelled` : base;
};

/**
 * Explains an overall status that differs from what the sub-orders give (the
 * overall PATCH sets it verbatim, §5.8). Null when they agree or for legacy.
 */
export const overallStatusNote = (
  order: Pick<AdminFullOrder, 'status' | 'restaurantOrders'>
): string | null => {
  const subOrders = order.restaurantOrders;
  if (!subOrders || subOrders.length === 0) return null;
  const derived = deriveOverallStatus(subOrders.map((s) => s.status));
  if (!derived || !order.status || derived === order.status) return null;
  return `Overall status was set directly; restaurant statuses suggest ${derived}.`;
};

/** Which Active Orders sub-tab an overall status belongs in (null = none). */
export type CurrentOrdersBucket = 'new' | 'preparing' | 'done';

export const currentOrdersBucket = (
  status?: OrderStatus | null
): CurrentOrdersBucket | null => {
  switch (status ?? OrderStatus.PENDING) {
    case OrderStatus.PENDING:
    case OrderStatus.CONFIRMED:
      return 'new';
    // READY is derived once every restaurant is ready (§5.8); keep it with
    // "Preparing" so it doesn't drop out of the board before "Mark done".
    case OrderStatus.PREPARING:
    case OrderStatus.READY:
      return 'preparing';
    case OrderStatus.COMPLETED:
      return 'done';
    default:
      return null;
  }
};

// ---------------------------------------------------- restaurant sections

/** One restaurant block on the order card. */
export interface RestaurantSection {
  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string | null;
  items: AdminOrderItem[];
  subtotal: number;
  status: OrderStatus;
  payoutStatus: PayoutStatus | null;
  payoutAmount: number | null;
  /** True for the synthetic Bob's group of a legacy order. */
  legacy: boolean;
}

/** Legacy = not yet converted by migration 003 (`restaurantOrders` missing/null). */
export const isLegacyOrder = (
  order: Pick<AdminFullOrder, 'restaurantOrders'>
): boolean => !Array.isArray(order.restaurantOrders);

export const itemsGross = (items: AdminOrderItem[]): number =>
  roundMoney(
    items.reduce(
      (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 0),
      0
    )
  );

const fromSubOrder = (sub: AdminRestaurantOrder): RestaurantSection => ({
  restaurantId: sub.restaurantId,
  restaurantName: sub.restaurantName || sub.restaurantId,
  restaurantPhone: sub.restaurantPhone ?? null,
  items: sub.items ?? [],
  subtotal: sub.subtotal ?? itemsGross(sub.items ?? []),
  status: sub.status ?? OrderStatus.PENDING,
  payoutStatus: sub.payoutStatus ?? null,
  payoutAmount: sub.payoutAmount ?? null,
  legacy: false,
});

/**
 * The restaurant sections of an order, in server order. A legacy order is one
 * Bob's group built from `items` with the order's `status` (§5.5); an order
 * with `restaurantOrders: []` has no sections.
 */
export const getRestaurantSections = (
  order: Pick<AdminFullOrder, 'restaurantOrders' | 'items' | 'status'>
): RestaurantSection[] => {
  if (Array.isArray(order.restaurantOrders)) {
    return order.restaurantOrders.map(fromSubOrder);
  }
  const items = order.items ?? [];
  if (!items.length) return [];
  return [
    {
      restaurantId: DEFAULT_RESTAURANT_ID,
      restaurantName: DEFAULT_RESTAURANT_NAME,
      restaurantPhone: null,
      items,
      subtotal: itemsGross(items),
      status: order.status ?? OrderStatus.PENDING,
      payoutStatus: null,
      payoutAmount: null,
      legacy: true,
    },
  ];
};

/** Restaurant ids on an order (legacy → `bobs`). */
export const orderRestaurantIds = (
  order: Pick<AdminFullOrder, 'restaurantOrders' | 'items' | 'status'>
): string[] => {
  if (isLegacyOrder(order)) return [DEFAULT_RESTAURANT_ID];
  return getRestaurantSections(order).map((s) => s.restaurantId);
};

/** Client-side restaurant filter (§5.8). '' = all restaurants. */
export const filterOrdersByRestaurant = <
  T extends Pick<AdminFullOrder, 'restaurantOrders' | 'items' | 'status'>,
>(
  orders: T[],
  restaurantId: string
): T[] =>
  restaurantId
    ? orders.filter((order) => orderRestaurantIds(order).includes(restaurantId))
    : orders;

export interface RestaurantFilterOption {
  id: string;
  name: string;
}

/**
 * Options for a restaurant filter: the admin restaurant list, plus any
 * restaurant seen on the given orders that has no record (e.g. `bobs` before
 * migration 001), sorted by name.
 */
export const buildRestaurantFilterOptions = (
  restaurants: { id: string; name: string }[],
  orders: Pick<AdminFullOrder, 'restaurantOrders' | 'items' | 'status'>[] = []
): RestaurantFilterOption[] => {
  const byId = new Map<string, string>();
  restaurants.forEach((r) => byId.set(r.id, r.name));
  orders.forEach((order) =>
    getRestaurantSections(order).forEach((section) => {
      if (!byId.has(section.restaurantId)) {
        byId.set(section.restaurantId, section.restaurantName);
      }
    })
  );
  if (!byId.has(DEFAULT_RESTAURANT_ID)) {
    byId.set(DEFAULT_RESTAURANT_ID, DEFAULT_RESTAURANT_NAME);
  }
  return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

// ------------------------------------------------------------------ money

export interface OrderMoneySummary {
  /** Items gross at catalogue prices (`subtotal`, §5.5). */
  itemsSubtotal: number;
  promotionalSavings: number;
  discount: number;
  deliveryFee: number;
  /** `totalAmount`: items gross, excludes the delivery fee (§5.5 Totals). */
  total: number;
}

/**
 * The money lines of an order card, taken from the server fields (§5.5):
 * `subtotal` (falls back to Σ items for very old orders), client-reported
 * promo savings and discount, the server's `deliveryFee`, and `totalAmount`.
 */
export const getOrderMoneySummary = (
  order: Pick<
    AdminFullOrder,
    | 'items'
    | 'subtotal'
    | 'totalAmount'
    | 'deliveryFee'
    | 'discountAmount'
    | 'promotionalSavings'
  >
): OrderMoneySummary => {
  const items = order.items ?? [];
  const promoFromItems = items.reduce(
    (sum, item) =>
      sum +
      (item.isPromotionalAddon && item.originalPrice
        ? (item.originalPrice - item.unitPrice) * item.quantity
        : 0),
    0
  );
  return {
    itemsSubtotal: order.subtotal ?? itemsGross(items),
    promotionalSavings: roundMoney(order.promotionalSavings ?? promoFromItems),
    discount: order.discountAmount ?? 0,
    deliveryFee: order.deliveryFee ?? 0,
    total: order.totalAmount ?? 0,
  };
};

/** Replaces an order (by id) in a list response, for cache updates. */
export const replaceOrderInList = <T extends { orders: AdminFullOrder[] }>(
  data: T | undefined,
  updated: AdminFullOrder
): T | undefined => {
  if (!data || !updated.id) return data;
  let found = false;
  const orders = data.orders.map((order) => {
    if (order.id !== updated.id) return order;
    found = true;
    return updated;
  });
  return found ? { ...data, orders } : data;
};

/**
 * Message for a failed status change. A 409 means the order changed since it
 * was loaded (§5): the hooks refetch it, so tell the admin to check and retry.
 */
export const statusErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (isConflictError(error)) {
    return `Order changed, refreshed. Check it and try again. (${message})`;
  }
  return message;
};

/** Σ of one restaurant's section subtotals over the given orders (legacy → bobs). */
export const restaurantItemsTotal = (
  orders: Pick<AdminFullOrder, 'restaurantOrders' | 'items' | 'status'>[],
  restaurantId: string
): number =>
  roundMoney(
    orders.reduce(
      (sum, order) =>
        sum +
        getRestaurantSections(order)
          .filter((section) => section.restaurantId === restaurantId)
          .reduce((acc, section) => acc + section.subtotal, 0),
      0
    )
  );

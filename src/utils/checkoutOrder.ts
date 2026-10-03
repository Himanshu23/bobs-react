// Pure checkout logic (PLAN §5.5–5.6, task 4.4): fee display rule, what the
// customer pays, the POST /orders payload, and the placing errors.

import { FALLBACK_DELIVERY_FEE } from '../config/restaurantLocation';
import { CartItem, FoodItem, OrderFulfillmentType } from '../types';
import { GeoPoint } from '../types/marketplace';
import {
  CreateOrderItemRequest,
  CreateOrderRequest,
  PublicOrder,
} from '../types/order';
import {
  CartRestaurantRef,
  getCartItemMarketId,
  resolveCartRestaurant,
} from './cartUtils';
import {
  buildRestaurantSectionsFromOrder,
  buildSplitOrderSections,
  RestaurantContactLookup,
  WhatsAppRestaurantSection,
} from './whatsappService';

export type DeliveryMethod = 'delivery' | 'pickup';
export type OrderTiming = 'asap' | 'scheduled';

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/** Pickup wins over scheduling, as before: pickup + scheduled → PICKUP. */
export const getFulfillmentType = (
  deliveryMethod: DeliveryMethod,
  orderTiming: OrderTiming
): OrderFulfillmentType => {
  if (deliveryMethod === 'pickup') {
    return OrderFulfillmentType.PICKUP;
  }
  return orderTiming === 'scheduled'
    ? OrderFulfillmentType.SCHEDULED
    : OrderFulfillmentType.DELIVERY;
};

/** DELIVERY and SCHEDULED are delivered; PICKUP isn't (server rule). */
export const isDeliveryFulfillment = (type: OrderFulfillmentType): boolean =>
  type === OrderFulfillmentType.DELIVERY ||
  type === OrderFulfillmentType.SCHEDULED;

/**
 * Fee shown before placing, mirroring the server: the market's flat fee for
 * DELIVERY/SCHEDULED and ₹0 for PICKUP, for every customer (D3). When the
 * market call failed (no fee), the fallback flat fee is shown; the server's
 * value replaces it once the order is created.
 */
export const getDisplayDeliveryFee = (
  fulfillmentType: OrderFulfillmentType,
  marketDeliveryFee: number | null | undefined
): number => {
  if (!isDeliveryFulfillment(fulfillmentType)) {
    return 0;
  }
  return typeof marketDeliveryFee === 'number' &&
    Number.isFinite(marketDeliveryFee) &&
    marketDeliveryFee >= 0
    ? marketDeliveryFee
    : FALLBACK_DELIVERY_FEE;
};

/**
 * What the customer pays (the WhatsApp total): cart at cart prices (free
 * claims 0, promo add-ons at the promo price) − discount + delivery fee. The
 * server doesn't compute this in Phase 3 (§5.5 "Totals").
 */
export const computePayableTotal = (
  cartTotal: number,
  discountAmount: number,
  deliveryFee: number
): number =>
  roundMoney(
    Math.max(0, cartTotal - Math.max(0, discountAmount)) +
      Math.max(0, deliveryFee)
  );

/**
 * After the order is created the server's `deliveryFee` is authoritative.
 * Returns the fee to use and whether it differs from what was shown.
 */
export const reconcileDeliveryFee = (
  displayedFee: number,
  serverFee: number | null | undefined
): { fee: number; changed: boolean } => {
  if (typeof serverFee !== 'number' || !Number.isFinite(serverFee)) {
    return { fee: displayedFee, changed: false };
  }
  return {
    fee: serverFee,
    changed: roundMoney(serverFee) !== roundMoney(displayedFee),
  };
};

/**
 * D12: a PICKUP checkout with items from two or more restaurants is split by
 * the server into one order per restaurant. Used for the note shown before
 * placing; the response (`groupOrders`) has the final say.
 */
export const willSplitPickup = (
  fulfillmentType: OrderFulfillmentType,
  restaurantCount: number
): boolean =>
  fulfillmentType === OrderFulfillmentType.PICKUP && restaurantCount >= 2;

/** D12: the response has `groupOrders`, i.e. the checkout became N orders. */
export const isSplitCheckout = (response: PublicOrder): boolean =>
  Array.isArray(response.groupOrders) && response.groupOrders.length > 0;

/**
 * Every order a checkout created: all of `groupOrders` for a split pickup
 * (the first one included), otherwise just the response.
 */
export const getCheckoutOrders = (response: PublicOrder): PublicOrder[] =>
  isSplitCheckout(response)
    ? (response.groupOrders as PublicOrder[])
    : [response];

/**
 * The server's delivery fee for the whole checkout: the sum over its orders
 * (0 for a split pickup). `undefined` when no order carries a fee.
 */
export const getCheckoutDeliveryFee = (
  orders: PublicOrder[]
): number | undefined => {
  const fees = orders
    .map((order) => order.deliveryFee)
    .filter(
      (fee): fee is number => typeof fee === 'number' && Number.isFinite(fee)
    );
  return fees.length > 0
    ? roundMoney(fees.reduce((sum, fee) => sum + fee, 0))
    : undefined;
};

/** What the confirmation and the WhatsApp message show for a saved checkout. */
export interface PlacedCheckout {
  /** D12 split pickup: one order per restaurant. */
  split: boolean;
  /** Ids of every order created, in cart order. */
  orderIds: string[];
  /**
   * One row per restaurant, at cart prices. For a split pickup each row is
   * its own order and carries its `orderId`.
   */
  restaurants: WhatsAppRestaurantSection[];
  deliveryFee: number;
  /** The server's fee differs from the one shown before placing. */
  feeChanged: boolean;
  /** What the customer pays for everything (all orders). */
  total: number;
}

export interface SummarizePlacedCheckoutInput {
  response: PublicOrder;
  cartItems: CartItem[];
  contacts?: RestaurantContactLookup;
  /** Fee shown before placing. */
  displayedFee: number;
  /** Cart total at cart prices. */
  cartTotal: number;
  discountAmount: number;
}

/**
 * Turns the `POST /orders` response into the confirmation rows and totals:
 * split (from `groupOrders`) or consolidated, with the server's fee.
 */
export const summarizePlacedCheckout = ({
  response,
  cartItems,
  contacts,
  displayedFee,
  cartTotal,
  discountAmount,
}: SummarizePlacedCheckoutInput): PlacedCheckout => {
  const split = isSplitCheckout(response);
  const orders = getCheckoutOrders(response);
  const { fee, changed } = reconcileDeliveryFee(
    displayedFee,
    getCheckoutDeliveryFee(orders)
  );
  const restaurants = split
    ? buildSplitOrderSections(orders, cartItems, contacts)
    : buildRestaurantSectionsFromOrder(
        response.restaurantOrders,
        cartItems,
        contacts
      );
  return {
    split,
    orderIds: orders.map((order) => order.id).filter(Boolean),
    restaurants,
    deliveryFee: fee,
    feeChanged: changed,
    total: computePayableTotal(cartTotal, discountAmount, fee),
  };
};

const isValidPoint = (point: GeoPoint | null | undefined): point is GeoPoint =>
  !!point &&
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  Math.abs(point.lat) <= 90 &&
  Math.abs(point.lng) <= 180;

export const toCreateOrderItem = (item: CartItem): CreateOrderItemRequest => {
  const orderItem: CreateOrderItemRequest = {
    foodItemId: item.id,
    quantity: item.quantity,
    isFreeClaim: Boolean(item.isFreeClaim),
  };
  if (item.option?.size) orderItem.size = item.option.size;
  if (item.option?.style) orderItem.style = item.option.style;
  if (item.option?.base) orderItem.base = item.option.base;
  return orderItem;
};

export interface BuildCreateOrderInput {
  cartItems: CartItem[];
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  /** Selected address coordinates; only sent for delivery orders. */
  deliveryLocation?: GeoPoint | null;
  fulfillmentType: OrderFulfillmentType;
  scheduledTime?: string;
  discountAmount: number;
  discountCode?: string;
  discountName?: string;
  promotionalSavings: number;
  taxAmount: number;
  isPaidOnline: boolean;
}

/**
 * `POST /orders` body (§5.6). Server-owned fields are not sent: `marketId`,
 * `restaurantOrders`, `subtotal`, `totalAmount`, `deliveryFee`, and per item
 * `unitPrice`, `itemName`, `restaurantId/Name`. `isPromotionalAddon` and
 * `originalPrice` are dropped by the server too. The client-verified fields
 * the server stores as sent (discount, promo savings, tax) are kept.
 */
export const buildCreateOrderRequest = (
  input: BuildCreateOrderInput
): CreateOrderRequest => {
  const hasDiscount = input.discountAmount > 0;
  const request: CreateOrderRequest = {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    deliveryAddress: input.deliveryAddress,
    fulfillmentType: input.fulfillmentType,
    items: input.cartItems.map(toCreateOrderItem),
    taxAmount: input.taxAmount,
    isPaidOnline: input.isPaidOnline,
  };
  if (
    isDeliveryFulfillment(input.fulfillmentType) &&
    isValidPoint(input.deliveryLocation)
  ) {
    request.deliveryLocation = {
      lat: input.deliveryLocation.lat,
      lng: input.deliveryLocation.lng,
    };
  }
  if (
    input.fulfillmentType === OrderFulfillmentType.SCHEDULED &&
    input.scheduledTime
  ) {
    request.scheduledTime = input.scheduledTime;
  }
  if (hasDiscount) {
    request.discountAmount = input.discountAmount;
    request.discountCode = input.discountCode;
    request.discountName = input.discountName;
  }
  if (input.promotionalSavings > 0) {
    request.promotionalSavings = input.promotionalSavings;
  }
  return request;
};

/** Error from `POST /orders`. `status` 0 means the request never got an answer. */
export class PlaceOrderError extends Error {
  readonly status: number;

  readonly serverMessage?: string;

  constructor(status: number, serverMessage?: string) {
    super(
      serverMessage ||
        (status ? `Failed to create order (${status})` : 'Network error')
    );
    this.name = 'PlaceOrderError';
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

/**
 * The server looked at the order and refused it (4xx: outside the area, mixed
 * markets, inactive restaurant or item, bad options…). Such an order must not
 * be sent on WhatsApp: it can't be fulfilled as is and isn't recorded. Network
 * failures and 5xx are not rejections.
 */
export const isOrderRejected = (error: unknown): boolean =>
  error instanceof PlaceOrderError && error.status >= 400 && error.status < 500;

const withStop = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);

/** What the customer can do about a refused order. */
export type PlaceOrderErrorAction =
  | 'change-address'
  | 'review-cart'
  | 'dismiss';

export interface PlaceOrderErrorInfo {
  message: string;
  action: PlaceOrderErrorAction;
}

/**
 * Customer-facing text and next step for a failed order, based on the
 * server's `{"error"}` text (§5.6 error table).
 */
export const describePlaceOrderError = (
  error: unknown
): PlaceOrderErrorInfo => {
  if (!isOrderRejected(error)) {
    return {
      message: 'We could not reach our server to save your order.',
      action: 'dismiss',
    };
  }
  const message = (error as PlaceOrderError).serverMessage?.trim();
  if (!message) {
    return {
      message:
        'We could not place this order. Please check your cart and try again.',
      action: 'review-cart',
    };
  }
  if (/outside .*delivery area/i.test(message)) {
    return {
      message: `${withStop(message)} Choose another address or switch to pickup.`,
      action: 'change-address',
    };
  }
  if (/deliveryLocation needs/i.test(message)) {
    return {
      message:
        'Your saved address has no valid map location. Edit the address and pick it on the map again.',
      action: 'change-address',
    };
  }
  if (/same market/i.test(message)) {
    return {
      message: `${withStop(message)} Remove the items from the other area or start a new cart.`,
      action: 'review-cart',
    };
  }
  if (/not taking orders right now|is not available right now/i.test(message)) {
    return {
      message: `${withStop(message)} Remove it from your cart to continue.`,
      action: 'review-cart',
    };
  }
  if (/^Invalid order item options$/i.test(message)) {
    return {
      message:
        'Some items in your cart have changed on the menu. Remove them and add them again.',
      action: 'review-cart',
    };
  }
  if (/^Restaurant '.*' not found$/i.test(message)) {
    return {
      message:
        'A restaurant in your cart is no longer available. Remove its items to continue.',
      action: 'review-cart',
    };
  }
  if (/scheduledTime is required/i.test(message)) {
    return {
      message: 'Choose a time for your scheduled order.',
      action: 'dismiss',
    };
  }
  return { message: withStop(message), action: 'dismiss' };
};

/**
 * A free-claim cart line for `foodItem`, stamped with the product's own
 * restaurant and market from the restaurants cache (not a market1 default).
 */
export const createFreeClaimCartItem = (
  foodItem: FoodItem,
  knownRestaurants?: ReadonlyMap<string, CartRestaurantRef>
): CartItem => {
  const freeClaimSize = foodItem.freeClaimPortion || 'Full';
  const restaurant = resolveCartRestaurant(foodItem, null, knownRestaurants);
  return {
    id: foodItem.id,
    name: foodItem.name,
    price: 0,
    image: foodItem.image,
    description: `Free ${freeClaimSize} portion`,
    product: foodItem,
    quantity: 1,
    option: { size: freeClaimSize },
    isFreeClaim: true,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    marketId: restaurant.marketId,
  };
};

/**
 * Menu items that can still be claimed free: they have a free portion, aren't
 * already claimed, and belong to the cart's market (D5), so claiming one
 * never triggers the "start a new cart?" prompt.
 */
export const getFreeClaimOptions = (
  menuItems: FoodItem[],
  cartItems: CartItem[],
  knownRestaurants?: ReadonlyMap<string, CartRestaurantRef>
): FoodItem[] => {
  const cartMarketId =
    cartItems.length > 0 ? getCartItemMarketId(cartItems[0]) : undefined;
  return menuItems.filter((item) => {
    if (!item.freeClaimPortion) {
      return false;
    }
    if (
      cartMarketId &&
      resolveCartRestaurant(item, null, knownRestaurants).marketId !==
        cartMarketId
    ) {
      return false;
    }
    return !cartItems.some(
      (cartItem) =>
        cartItem.isFreeClaim &&
        cartItem.id === item.id &&
        cartItem.option?.size === item.freeClaimPortion
    );
  });
};

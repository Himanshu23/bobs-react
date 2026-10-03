// GA4 ecommerce payloads (pure, unit-tested in analyticsItems.test.ts).
//
// Every item carries the restaurant as the standard `item_brand` (and
// `affiliation`), so GA's built-in ecommerce reports break down per
// restaurant without a custom dimension. Prices are cart prices: what the
// customer pays (free claims 0, ₹9 add-ons 9).

import { CartItem, FoodItem, ItemOptions } from '../types';
import { PublicOrder } from '../types/order';
import { getCartItemRestaurantId, normalizeCartItem } from './cartUtils';
import { getCheckoutOrders, isSplitCheckout } from './checkoutOrder';
import { getLowestNowPrice } from './priceUtils';

export const ANALYTICS_CURRENCY = 'INR';
/** GA4 accepts up to 200 items per event; keep menu lists light. */
export const MAX_ITEM_LIST_ITEMS = 50;

/** One GA4 ecommerce item. A type alias (not an interface) so it fits `AnalyticsParams`. */
export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  affiliation?: string;
  index?: number;
  item_list_id?: string;
  item_list_name?: string;
};

export type AnalyticsParamValue = string | number | boolean | undefined;

export type AnalyticsParams = Record<
  string,
  AnalyticsParamValue | AnalyticsItem[]
>;

/** Restaurant fields used for brand and event params. */
export interface AnalyticsRestaurant {
  id: string;
  name: string;
  marketId?: string;
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const withoutUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as T;

/** Drops undefined params, including inside each `items[]` entry. */
export const removeUndefinedParams = (
  params: AnalyticsParams
): AnalyticsParams =>
  Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map(withoutUndefined) : value,
      ])
  );

/** "Half / Gravy / Paratha": size, style, base that are set. */
export const getItemVariant = (
  option: Partial<ItemOptions> | undefined
): string | undefined => {
  const parts = [option?.size, option?.style, option?.base].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : undefined;
};

/** Event params naming the restaurant (event-scoped custom dimensions). */
export const restaurantParams = (
  restaurant: AnalyticsRestaurant | null | undefined
): AnalyticsParams =>
  restaurant
    ? {
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        market_id: restaurant.marketId,
      }
    : {};

/** A cart line as a GA item, at the price the customer pays. */
export const cartItemToAnalyticsItem = (
  cartItem: CartItem,
  quantity: number = cartItem.quantity
): AnalyticsItem => {
  const item = normalizeCartItem(cartItem);
  return withoutUndefined<AnalyticsItem>({
    item_id: item.id,
    item_name: item.name,
    item_brand: item.restaurantName,
    affiliation: item.restaurantName,
    item_category: item.product?.category,
    item_variant: getItemVariant(item.option),
    price: Number.isFinite(item.price) ? item.price : 0,
    quantity,
  });
};

/** A menu item as a GA item, at its lowest current price. */
export const foodItemToAnalyticsItem = (
  foodItem: FoodItem,
  restaurant: AnalyticsRestaurant,
  index?: number
): AnalyticsItem =>
  withoutUndefined<AnalyticsItem>({
    item_id: foodItem.id,
    item_name: foodItem.name,
    item_brand: restaurant.name,
    affiliation: restaurant.name,
    item_category: foodItem.category,
    price: getLowestNowPrice(foodItem) ?? 0,
    quantity: 1,
    index,
  });

export const getItemsValue = (items: AnalyticsItem[]) =>
  roundMoney(
    items.reduce(
      (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1),
      0
    )
  );

/** Only when every item is from one restaurant (else the items say it). */
const singleRestaurantParams = (cartItems: CartItem[]): AnalyticsParams => {
  const restaurants = new Map(
    cartItems.map((cartItem) => {
      const item = normalizeCartItem(cartItem);
      return [
        item.restaurantId as string,
        {
          id: item.restaurantId as string,
          name: item.restaurantName as string,
          marketId: item.marketId,
        },
      ];
    })
  );
  return restaurants.size === 1
    ? restaurantParams(Array.from(restaurants.values())[0])
    : {};
};

/**
 * `add_to_cart` / `remove_from_cart` / `begin_checkout`: currency, value and
 * items for cart lines (`quantity` overrides the line's quantity, e.g. one
 * line removed of three), plus the restaurant when there is only one.
 */
export const buildCartItemsParams = (
  cartItems: CartItem[],
  quantity?: number
): AnalyticsParams => {
  const items = cartItems.map((cartItem) =>
    cartItemToAnalyticsItem(cartItem, quantity ?? cartItem.quantity)
  );
  return {
    currency: ANALYTICS_CURRENCY,
    value: getItemsValue(items),
    ...singleRestaurantParams(cartItems),
    items,
  };
};

/** `view_item_list` for one restaurant's menu (capped at 50 items). */
export const buildViewItemListParams = (
  restaurant: AnalyticsRestaurant,
  foodItems: FoodItem[]
): AnalyticsParams => {
  const items = foodItems
    .slice(0, MAX_ITEM_LIST_ITEMS)
    .map((foodItem, index) => ({
      ...foodItemToAnalyticsItem(foodItem, restaurant, index),
      item_list_id: restaurant.id,
      item_list_name: restaurant.name,
    }));
  return {
    item_list_id: restaurant.id,
    item_list_name: restaurant.name,
    ...restaurantParams(restaurant),
    item_count: foodItems.length,
    items,
  };
};

/** `view_item` for a menu item opened from a restaurant's menu. */
export const buildViewItemParams = (
  foodItem: FoodItem,
  restaurant: AnalyticsRestaurant
): AnalyticsParams => {
  const item = foodItemToAnalyticsItem(foodItem, restaurant);
  return {
    currency: ANALYTICS_CURRENCY,
    value: getItemsValue([item]),
    ...restaurantParams(restaurant),
    items: [item],
  };
};

/** The cart lines that became one order of a split pickup checkout. */
export interface CheckoutOrderItems {
  order: PublicOrder;
  cartItems: CartItem[];
}

const getOrderRestaurantIds = (order: PublicOrder): Set<string> => {
  const ids = new Set<string>();
  order.restaurantOrders?.forEach((restaurantOrder) => {
    if (restaurantOrder.restaurantId) ids.add(restaurantOrder.restaurantId);
  });
  order.items?.forEach((item) => {
    if (item.restaurantId) ids.add(item.restaurantId);
  });
  return ids;
};

/**
 * D12 split pickup: the cart lines of each order, matched by restaurant.
 * A restaurant belongs to the first order that names it. Not split: one
 * entry with the whole cart.
 */
export const groupCartItemsByCheckoutOrder = (
  response: PublicOrder,
  cartItems: CartItem[]
): CheckoutOrderItems[] => {
  if (!isSplitCheckout(response)) {
    return [{ order: response, cartItems }];
  }
  const claimed = new Set<string>();
  return getCheckoutOrders(response).map((order) => {
    const restaurantIds = Array.from(getOrderRestaurantIds(order)).filter(
      (id) => !claimed.has(id)
    );
    restaurantIds.forEach((id) => claimed.add(id));
    return {
      order,
      cartItems: cartItems.filter((item) =>
        restaurantIds.includes(getCartItemRestaurantId(item))
      ),
    };
  });
};

export interface BuildPurchaseEventsInput {
  /** `POST /orders` response (with `groupOrders` for a split pickup). */
  response: PublicOrder;
  cartItems: CartItem[];
  /** Discount applied to the whole checkout, at cart prices. */
  discountAmount: number;
  discountCode?: string;
  /** Delivery fee of the (consolidated) order; split pickups ship free. */
  deliveryFee: number;
}

/**
 * GA4 `purchase` params for a saved checkout: one per order. `value` is the
 * items at cart prices minus the discount (shipping is sent separately). A
 * split pickup's orders each get their own transaction id, shipping 0 and
 * their share of the discount (the server's, else pro rata).
 */
export const buildPurchaseEvents = ({
  response,
  cartItems,
  discountAmount,
  discountCode,
  deliveryFee,
}: BuildPurchaseEventsInput): AnalyticsParams[] => {
  const split = isSplitCheckout(response);
  const cartTotal = getItemsValue(
    cartItems.map((item) => cartItemToAnalyticsItem(item))
  );
  return groupCartItemsByCheckoutOrder(response, cartItems)
    .filter(
      ({ order, cartItems: orderItems }) =>
        Boolean(order.id) && orderItems.length > 0
    )
    .map(({ order, cartItems: orderItems }) => {
      const {
        items,
        value: itemsValue,
        ...rest
      } = buildCartItemsParams(orderItems);
      const subtotal = itemsValue as number;
      let discount = discountAmount;
      if (split) {
        discount =
          typeof order.discountAmount === 'number' &&
          Number.isFinite(order.discountAmount)
            ? order.discountAmount
            : cartTotal > 0
              ? (discountAmount * subtotal) / cartTotal
              : 0;
      }
      return {
        transaction_id: order.id,
        ...rest,
        value: roundMoney(Math.max(0, subtotal - discount)),
        shipping: split ? 0 : roundMoney(deliveryFee),
        coupon: discount > 0 ? discountCode : undefined,
        discount: discount > 0 ? roundMoney(discount) : undefined,
        items,
      };
    });
};

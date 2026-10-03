import { CartItem, FoodItem, ItemOptions } from '../types';
import { PromotionalAddonItemDTO } from '../types/promotionalAddons';
import {
  DEFAULT_MARKET_ID,
  DEFAULT_RESTAURANT_ID,
  DEFAULT_RESTAURANT_NAME,
} from '../types/marketplace';

/** Restaurant data copied onto each cart item when it is added. */
export interface CartRestaurantRef {
  id: string;
  name: string;
  marketId: string;
}

/**
 * Restaurant for a product, in order of preference:
 * 1. the restaurant being browsed, when it owns the product;
 * 2. the product's restaurant from `knownRestaurants` (the restaurants cache);
 * 3. the product's `restaurantId` (legacy → `bobs`) with the name falling back
 *    to the id (or "Bob's") and the market to `market1`, the only market today.
 */
export const resolveCartRestaurant = (
  product: Pick<FoodItem, 'restaurantId'> | undefined,
  restaurant?: CartRestaurantRef | null,
  knownRestaurants?: ReadonlyMap<string, CartRestaurantRef>
): CartRestaurantRef => {
  const productRestaurantId = product?.restaurantId || undefined;
  if (
    restaurant &&
    (!productRestaurantId || productRestaurantId === restaurant.id)
  ) {
    return restaurant;
  }
  const id = productRestaurantId ?? DEFAULT_RESTAURANT_ID;
  const known = knownRestaurants?.get(id);
  if (known) {
    return known;
  }
  return {
    id,
    name: id === DEFAULT_RESTAURANT_ID ? DEFAULT_RESTAURANT_NAME : id,
    marketId: DEFAULT_MARKET_ID,
  };
};

/** The saved product's restaurant id, ignoring malformed (non-string) values. */
const getProductRestaurantId = (item: CartItem): string | undefined => {
  const id = item.product?.restaurantId;
  return typeof id === 'string' && id ? id : undefined;
};

const toRestaurantFields = (owner: CartRestaurantRef) => ({
  restaurantId: owner.id,
  restaurantName: owner.name,
  marketId: owner.marketId,
});

/**
 * Fills the restaurant fields of a cart item that lacks them: items saved
 * before multi-restaurant (and any caller that didn't set them) belong to
 * Bob's in market1, or to the product's own restaurant when it is known.
 */
export const normalizeCartItem = (item: CartItem): CartItem => {
  if (item.restaurantId && item.restaurantName && item.marketId) {
    return item;
  }
  const restaurantId =
    item.restaurantId || getProductRestaurantId(item) || DEFAULT_RESTAURANT_ID;
  return {
    ...item,
    restaurantId,
    restaurantName:
      item.restaurantName ||
      (restaurantId === DEFAULT_RESTAURANT_ID
        ? DEFAULT_RESTAURANT_NAME
        : restaurantId),
    marketId: item.marketId || DEFAULT_MARKET_ID,
  };
};

export const getCartItemRestaurantId = (item: CartItem): string =>
  item.restaurantId || getProductRestaurantId(item) || DEFAULT_RESTAURANT_ID;

export const getCartItemMarketId = (item: CartItem): string =>
  item.marketId || DEFAULT_MARKET_ID;

/**
 * Identifies one cart line. `isFreeClaim`, `isPromotionalAddon` and
 * `restaurantId` act as wildcards when undefined, so older callers that only
 * pass id + option keep matching as before. A stored flag that is missing
 * counts as `false`, so passing `false` targets the regular line.
 */
export interface CartLineKey {
  id: string;
  option: ItemOptions;
  isFreeClaim?: boolean;
  isPromotionalAddon?: boolean;
  restaurantId?: string;
}

export const isSameCartLine = (cartItem: CartItem, key: CartLineKey) => {
  const { id, option, isFreeClaim, isPromotionalAddon, restaurantId } = key;
  return (
    cartItem.id === id &&
    cartItem.option?.base === option?.base &&
    cartItem.option?.size === option?.size &&
    cartItem.option?.style === option?.style &&
    (isFreeClaim === undefined || !!cartItem.isFreeClaim === isFreeClaim) &&
    (isPromotionalAddon === undefined ||
      !!cartItem.isPromotionalAddon === isPromotionalAddon) &&
    (restaurantId === undefined ||
      getCartItemRestaurantId(cartItem) === restaurantId)
  );
};

export const findCartLineIndex = (items: CartItem[], key: CartLineKey) =>
  items.findIndex((cartItem) => isSameCartLine(cartItem, key));

/** Stable React key for a cart line. */
export const getCartLineKey = (item: CartItem) =>
  [
    getCartItemRestaurantId(item),
    item.id,
    JSON.stringify(item.option),
    item.isPromotionalAddon ? 'promo' : '',
    item.isFreeClaim ? 'free' : '',
  ].join('-');

export type MarketGuardDecision =
  | { type: 'allow' }
  | { type: 'conflict'; cartMarketId: string };

/**
 * D5: the cart is locked to the market of its items. Adding from another
 * market needs the customer to confirm starting a new cart.
 */
export const getMarketGuardDecision = (
  cartItems: CartItem[],
  incomingMarketId: string | undefined
): MarketGuardDecision => {
  if (cartItems.length === 0) {
    return { type: 'allow' };
  }
  const cartMarketId = getCartItemMarketId(cartItems[0]);
  const targetMarketId = incomingMarketId || DEFAULT_MARKET_ID;
  return cartMarketId === targetMarketId
    ? { type: 'allow' }
    : { type: 'conflict', cartMarketId };
};

export const getCartItemsTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export interface CartRestaurantGroup {
  restaurantId: string;
  restaurantName: string;
  marketId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

/** Groups cart lines by restaurant, in the order restaurants were first added. */
export const groupCartByRestaurant = (
  items: CartItem[]
): CartRestaurantGroup[] => {
  const groups = new Map<string, CartRestaurantGroup>();

  items.forEach((rawItem) => {
    const item = normalizeCartItem(rawItem);
    const restaurantId = item.restaurantId as string;
    let group = groups.get(restaurantId);
    if (!group) {
      group = {
        restaurantId,
        restaurantName: item.restaurantName as string,
        marketId: item.marketId as string,
        items: [],
        itemCount: 0,
        subtotal: 0,
      };
      groups.set(restaurantId, group);
    }
    group.items.push(rawItem);
    group.itemCount += item.quantity;
    group.subtotal += item.price * item.quantity;
  });

  return Array.from(groups.values());
};

export const createCartItem = (
  product: FoodItem,
  quantity: number,
  selectedSize: ItemOptions['size'],
  selectedType?: ItemOptions['style'],
  selectedBase?: ItemOptions['base'],
  restaurant?: CartRestaurantRef | null,
  knownRestaurants?: ReadonlyMap<string, CartRestaurantRef>
): CartItem => {
  const restaurantFields = toRestaurantFields(
    resolveCartRestaurant(product, restaurant, knownRestaurants)
  );
  const price =
    (selectedSize
      ? product.priceOptions.nowPrice.size?.[selectedSize] || 0
      : 0) +
    (selectedType
      ? product.priceOptions.nowPrice.type?.[selectedType] || 0
      : 0) +
    (selectedBase
      ? product.priceOptions.nowPrice.base?.[selectedBase] || 0
      : 0);

  return {
    id: product.id,
    name: product.name,
    price,
    image: product.image,
    quantity,
    option: {
      size: selectedSize,
      style: selectedType,
      base: selectedBase,
    },
    product,
    description: product.description,
    ...restaurantFields,
  };
};

export const createPromotionalAddonCartItem = (
  promoItem: PromotionalAddonItemDTO,
  product: FoodItem,
  quantity = 1,
  restaurant?: CartRestaurantRef | null,
  knownRestaurants?: ReadonlyMap<string, CartRestaurantRef>
): CartItem => ({
  ...toRestaurantFields(
    resolveCartRestaurant(product, restaurant, knownRestaurants)
  ),
  id: promoItem.foodItemId,
  name: promoItem.name,
  price: promoItem.promotionalPrice,
  originalPrice: promoItem.originalPrice,
  image: promoItem.image,
  description: promoItem.description,
  product,
  quantity,
  option: {
    size: promoItem.size,
    style: promoItem.style,
    base: promoItem.base,
  },
  isPromotionalAddon: true,
});

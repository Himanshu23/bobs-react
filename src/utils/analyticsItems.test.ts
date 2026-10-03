import { describe, expect, it } from 'vitest';
import { OrderFulfillmentType, OrderStatus } from '../types';
import { PublicOrder, PublicRestaurantOrder } from '../types/order';
import {
  buildCartItemsParams,
  buildPurchaseEvents,
  buildViewItemListParams,
  buildViewItemParams,
  cartItemToAnalyticsItem,
  foodItemToAnalyticsItem,
  getItemVariant,
  groupCartItemsByCheckoutOrder,
  MAX_ITEM_LIST_ITEMS,
  removeUndefinedParams,
} from './analyticsItems';
import { makeCartItem, makeFoodItem } from './cartTestFixtures';
import { createFreeClaimCartItem } from './checkoutOrder';
import { createPromotionalAddonCartItem } from './cartUtils';

const mutka = { id: 'mutka-king', name: 'Mutka King', marketId: 'market1' };
const chai = makeFoodItem({
  id: 'kulhad-chai',
  name: 'Kulhad Chai',
  restaurantId: mutka.id,
  priceOptions: {
    wasPrice: { size: { Full: 50 } },
    nowPrice: { size: { Full: 40 } },
  },
});

const paneerLine = makeCartItem({
  quantity: 2,
  option: { size: 'Half', style: 'Gravy', base: 'Paratha' },
  price: 150,
});
const chaiLine = makeCartItem({
  id: chai.id,
  name: chai.name,
  product: chai,
  price: 40,
  restaurantId: mutka.id,
  restaurantName: mutka.name,
});

describe('getItemVariant', () => {
  it('joins the set options in size / style / base order', () => {
    expect(
      getItemVariant({ size: 'Half', style: 'Gravy', base: 'Paratha' })
    ).toBe('Half / Gravy / Paratha');
    expect(getItemVariant({ size: 'Full' })).toBe('Full');
    expect(getItemVariant(undefined)).toBeUndefined();
  });
});

describe('cartItemToAnalyticsItem', () => {
  it('uses the restaurant as item_brand and affiliation, at the cart price', () => {
    expect(cartItemToAnalyticsItem(paneerLine)).toEqual({
      item_id: 'dish-1',
      item_name: 'Paneer Tikka',
      item_brand: "Bob's",
      affiliation: "Bob's",
      item_category: 'Starters',
      item_variant: 'Half / Gravy / Paratha',
      price: 150,
      quantity: 2,
    });
  });

  it("falls back to Bob's for legacy lines without restaurant data", () => {
    const legacy = makeCartItem({
      restaurantId: undefined,
      restaurantName: undefined,
      marketId: undefined,
    });
    expect(cartItemToAnalyticsItem(legacy).item_brand).toBe("Bob's");
  });

  it('prices a free claim at 0', () => {
    const free = createFreeClaimCartItem(
      makeFoodItem({ freeClaimPortion: 'Half' }),
      new Map([['bobs', { id: 'bobs', name: "Bob's", marketId: 'market1' }]])
    );
    const item = cartItemToAnalyticsItem(free);
    expect(item.price).toBe(0);
    expect(item.item_variant).toBe('Half');
    expect(item.item_brand).toBe("Bob's");
  });

  it('prices a ₹9 add-on at 9, branded with its own restaurant', () => {
    const addon = createPromotionalAddonCartItem(
      {
        foodItemId: chai.id,
        name: chai.name,
        image: '',
        veg: true,
        originalPrice: 40,
        promotionalPrice: 9,
        size: 'Full',
        disabled: false,
      },
      chai,
      1,
      null,
      new Map([[mutka.id, mutka]])
    );
    expect(cartItemToAnalyticsItem(addon)).toMatchObject({
      item_id: 'kulhad-chai',
      item_brand: 'Mutka King',
      price: 9,
      quantity: 1,
    });
  });

  it('can override the quantity', () => {
    expect(cartItemToAnalyticsItem(paneerLine, 1).quantity).toBe(1);
  });
});

describe('foodItemToAnalyticsItem', () => {
  it('uses the lowest current price and the given restaurant', () => {
    expect(foodItemToAnalyticsItem(makeFoodItem(), mutka, 3)).toEqual({
      item_id: 'dish-1',
      item_name: 'Paneer Tikka',
      item_brand: 'Mutka King',
      affiliation: 'Mutka King',
      item_category: 'Starters',
      price: 150,
      quantity: 1,
      index: 3,
    });
  });
});

describe('buildCartItemsParams', () => {
  it('adds currency, value and the restaurant for one restaurant', () => {
    expect(buildCartItemsParams([paneerLine])).toMatchObject({
      currency: 'INR',
      value: 300,
      restaurant_id: 'bobs',
      restaurant_name: "Bob's",
      market_id: 'market1',
    });
  });

  it('leaves the restaurant to the items for a mixed cart', () => {
    const params = buildCartItemsParams([paneerLine, chaiLine]);
    expect(params.value).toBe(340);
    expect(params.restaurant_id).toBeUndefined();
    expect(
      (params.items as { item_brand?: string }[]).map((i) => i.item_brand)
    ).toEqual(["Bob's", 'Mutka King']);
  });
});

describe('view events', () => {
  it('view_item_list uses the restaurant as the list and caps items', () => {
    const many = Array.from({ length: 60 }, (_, index) =>
      makeFoodItem({ id: `dish-${index}` })
    );
    const params = buildViewItemListParams(mutka, many);
    expect(params).toMatchObject({
      item_list_id: 'mutka-king',
      item_list_name: 'Mutka King',
      restaurant_id: 'mutka-king',
      restaurant_name: 'Mutka King',
      item_count: 60,
    });
    const items = params.items as { index?: number; item_brand?: string }[];
    expect(items).toHaveLength(MAX_ITEM_LIST_ITEMS);
    expect(items[1]).toMatchObject({ index: 1, item_brand: 'Mutka King' });
  });

  it('view_item has one item and its value', () => {
    expect(buildViewItemParams(chai, mutka)).toMatchObject({
      currency: 'INR',
      value: 40,
      restaurant_name: 'Mutka King',
      items: [{ item_id: 'kulhad-chai', item_brand: 'Mutka King' }],
    });
  });
});

describe('removeUndefinedParams', () => {
  it('drops undefined values, including inside items', () => {
    expect(
      removeUndefinedParams({
        a: 1,
        b: undefined,
        items: [{ item_id: 'x', item_name: 'X', item_variant: undefined }],
      })
    ).toEqual({ a: 1, items: [{ item_id: 'x', item_name: 'X' }] });
  });
});

describe('purchase events', () => {
  const part = (
    restaurantId: string,
    restaurantName: string,
    foodItemId: string
  ): PublicRestaurantOrder => ({
    restaurantId,
    restaurantName,
    items: [
      {
        foodItemId,
        itemName: foodItemId,
        quantity: 1,
        unitPrice: 1,
        restaurantId,
      },
    ],
    subtotal: 1,
    status: OrderStatus.PENDING,
  });
  const order = (
    id: string,
    parts: PublicRestaurantOrder[],
    extra: Partial<PublicOrder> = {}
  ): PublicOrder => ({
    id,
    customerName: 'Asha',
    customerPhone: '+919812345678',
    deliveryAddress: 'Pickup',
    fulfillmentType: OrderFulfillmentType.PICKUP,
    items: parts.flatMap((p) => p.items),
    totalAmount: 0,
    status: OrderStatus.PENDING,
    restaurantOrders: parts,
    ...extra,
  });
  const bobsPart = part('bobs', "Bob's", 'dish-1');
  const mutkaPart = part('mutka-king', 'Mutka King', 'kulhad-chai');
  const first = order('order-bobs', [bobsPart], { deliveryFee: 0 });
  const second = order('order-mutka', [mutkaPart], { deliveryFee: 0 });
  const split: PublicOrder = { ...first, groupOrders: [first, second] };
  const cart = [paneerLine, chaiLine];

  it('groups cart lines per split order by restaurant', () => {
    const groups = groupCartItemsByCheckoutOrder(split, cart);
    expect(groups.map((g) => g.order.id)).toEqual([
      'order-bobs',
      'order-mutka',
    ]);
    expect(groups[0].cartItems).toEqual([paneerLine]);
    expect(groups[1].cartItems).toEqual([chaiLine]);
  });

  it('keeps the whole cart in one group when not split', () => {
    const consolidated = order('order-all', [bobsPart, mutkaPart]);
    expect(groupCartItemsByCheckoutOrder(consolidated, cart)).toEqual([
      { order: consolidated, cartItems: cart },
    ]);
  });

  it('sends one purchase for a consolidated order with shipping', () => {
    const consolidated = order('order-all', [bobsPart, mutkaPart], {
      fulfillmentType: OrderFulfillmentType.DELIVERY,
    });
    const events = buildPurchaseEvents({
      response: consolidated,
      cartItems: cart,
      discountAmount: 34,
      discountCode: 'TEN',
      deliveryFee: 20,
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      transaction_id: 'order-all',
      currency: 'INR',
      value: 306,
      shipping: 20,
      coupon: 'TEN',
      discount: 34,
    });
    expect(events[0].items).toHaveLength(2);
    expect(events[0].restaurant_id).toBeUndefined();
  });

  it('sends one purchase per split pickup order, shipping 0', () => {
    const events = buildPurchaseEvents({
      response: split,
      cartItems: cart,
      discountAmount: 0,
      deliveryFee: 0,
    });
    expect(events.map((e) => e.transaction_id)).toEqual([
      'order-bobs',
      'order-mutka',
    ]);
    expect(events[0]).toMatchObject({
      value: 300,
      shipping: 0,
      restaurant_id: 'bobs',
      items: [{ item_brand: "Bob's", quantity: 2, price: 150 }],
    });
    expect(events[1]).toMatchObject({
      value: 40,
      shipping: 0,
      restaurant_name: 'Mutka King',
      items: [{ item_brand: 'Mutka King' }],
    });
    expect(events[0].coupon).toBeUndefined();
  });

  it('uses the server discount share of a split order, else pro rata', () => {
    const withServerShare: PublicOrder = {
      ...first,
      groupOrders: [{ ...first, discountAmount: 30 }, second],
    };
    const events = buildPurchaseEvents({
      response: withServerShare,
      cartItems: cart,
      discountAmount: 34,
      deliveryFee: 0,
    });
    expect(events[0].value).toBe(270);
    // 34 × 40 / 340 = 4
    expect(events[1].value).toBe(36);
  });

  it('skips orders without an id', () => {
    const events = buildPurchaseEvents({
      response: order('', [bobsPart]),
      cartItems: [paneerLine],
      discountAmount: 0,
      deliveryFee: 0,
    });
    expect(events).toEqual([]);
  });
});

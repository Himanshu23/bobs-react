import { describe, expect, it } from 'vitest';
import { OrderFulfillmentType, OrderStatus } from '../types';
import { PublicOrder, PublicRestaurantOrder } from '../types/order';
import {
  buildCreateOrderRequest,
  BuildCreateOrderInput,
  computePayableTotal,
  createFreeClaimCartItem,
  describePlaceOrderError,
  getDisplayDeliveryFee,
  getFreeClaimOptions,
  getFulfillmentType,
  isOrderRejected,
  PlaceOrderError,
  reconcileDeliveryFee,
  getCheckoutDeliveryFee,
  getCheckoutOrders,
  isSplitCheckout,
  summarizePlacedCheckout,
  willSplitPickup,
} from './checkoutOrder';
import { makeCartItem, makeFoodItem } from './cartTestFixtures';
import { CartRestaurantRef } from './cartUtils';
import {
  buildPromotionalAddonsResponse,
  getQualifyingCartSubtotal,
} from './promotionalAddonStrategy';
import { createPromotionalAddonCartItem } from './cartUtils';
import { PromotionalAddonItemDTO } from '../types/promotionalAddons';

const kulfiDeal: PromotionalAddonItemDTO = {
  foodItemId: 'kulfi',
  name: 'Kulfi',
  image: '',
  veg: true,
  originalPrice: 60,
  promotionalPrice: 9,
  size: 'Full',
  disabled: false,
};

const mutkaKing: CartRestaurantRef = {
  id: 'mutka-king',
  name: 'Mutka King',
  marketId: 'market1',
};
const farAway: CartRestaurantRef = {
  id: 'far-away',
  name: 'Far Away',
  marketId: 'market2',
};
const directory = new Map<string, CartRestaurantRef>([
  ['bobs', { id: 'bobs', name: "Bob's", marketId: 'market1' }],
  [mutkaKing.id, mutkaKing],
  [farAway.id, farAway],
]);

describe('getFulfillmentType', () => {
  it('maps delivery method and timing like the old checkout', () => {
    expect(getFulfillmentType('delivery', 'asap')).toBe(
      OrderFulfillmentType.DELIVERY
    );
    expect(getFulfillmentType('delivery', 'scheduled')).toBe(
      OrderFulfillmentType.SCHEDULED
    );
    expect(getFulfillmentType('pickup', 'scheduled')).toBe(
      OrderFulfillmentType.PICKUP
    );
  });
});

describe('getDisplayDeliveryFee (server fee rule)', () => {
  it('uses the market fee for DELIVERY and SCHEDULED, for every customer', () => {
    expect(getDisplayDeliveryFee(OrderFulfillmentType.DELIVERY, 20)).toBe(20);
    expect(getDisplayDeliveryFee(OrderFulfillmentType.SCHEDULED, 35)).toBe(35);
  });

  it('is 0 for PICKUP', () => {
    expect(getDisplayDeliveryFee(OrderFulfillmentType.PICKUP, 20)).toBe(0);
    expect(getDisplayDeliveryFee(OrderFulfillmentType.PICKUP, undefined)).toBe(
      0
    );
  });

  it('allows a free market (fee 0)', () => {
    expect(getDisplayDeliveryFee(OrderFulfillmentType.DELIVERY, 0)).toBe(0);
  });

  it('falls back to the flat ₹20 when the market is unavailable', () => {
    expect(
      getDisplayDeliveryFee(OrderFulfillmentType.DELIVERY, undefined)
    ).toBe(20);
    expect(getDisplayDeliveryFee(OrderFulfillmentType.DELIVERY, null)).toBe(20);
    expect(getDisplayDeliveryFee(OrderFulfillmentType.DELIVERY, NaN)).toBe(20);
  });
});

describe('computePayableTotal', () => {
  it('is cart − discount + fee', () => {
    expect(computePayableTotal(540, 50, 20)).toBe(510);
  });

  it('never goes below the fee when the discount exceeds the cart', () => {
    expect(computePayableTotal(100, 150, 20)).toBe(20);
  });

  it('rounds to paise', () => {
    expect(computePayableTotal(299.999, 0, 0)).toBe(300);
    expect(computePayableTotal(10.1, 0.2, 0)).toBe(9.9);
  });
});

describe('reconcileDeliveryFee', () => {
  it('uses the server fee and flags a difference', () => {
    expect(reconcileDeliveryFee(0, 20)).toEqual({ fee: 20, changed: true });
    expect(reconcileDeliveryFee(20, 20)).toEqual({ fee: 20, changed: false });
    expect(reconcileDeliveryFee(20, 0)).toEqual({ fee: 0, changed: true });
  });

  it('keeps the displayed fee when the response has none', () => {
    expect(reconcileDeliveryFee(20, null)).toEqual({ fee: 20, changed: false });
    expect(reconcileDeliveryFee(20, undefined)).toEqual({
      fee: 20,
      changed: false,
    });
  });
});

describe('buildCreateOrderRequest', () => {
  const bobsLine = makeCartItem({ quantity: 2 });
  const mutkaLine = makeCartItem({
    id: 'kulhad-chai',
    name: 'Kulhad Chai',
    price: 40,
    option: { size: 'Full', style: 'Dry' },
    restaurantId: 'mutka-king',
    restaurantName: 'Mutka King',
  });
  const promoLine = makeCartItem({
    id: 'gulab-jamun',
    name: 'Gulab Jamun',
    price: 9,
    originalPrice: 60,
    isPromotionalAddon: true,
  });
  const freeLine = makeCartItem({
    id: 'dal',
    name: 'Dal',
    price: 0,
    option: { size: 'Half' },
    isFreeClaim: true,
  });

  const baseInput: BuildCreateOrderInput = {
    cartItems: [bobsLine, mutkaLine, promoLine, freeLine],
    customerName: 'Asha',
    customerPhone: '+919812345678',
    deliveryAddress: 'Tower 3, Flat 1204',
    deliveryLocation: { lat: 28.6421, lng: 77.3712 },
    fulfillmentType: OrderFulfillmentType.DELIVERY,
    discountAmount: 0,
    promotionalSavings: 51,
    taxAmount: 14.95,
    isPaidOnline: false,
  };

  it('sends only what the server reads per item', () => {
    const request = buildCreateOrderRequest(baseInput);
    expect(request.items).toEqual([
      { foodItemId: 'dish-1', quantity: 2, size: 'Full', isFreeClaim: false },
      {
        foodItemId: 'kulhad-chai',
        quantity: 1,
        size: 'Full',
        style: 'Dry',
        isFreeClaim: false,
      },
      {
        foodItemId: 'gulab-jamun',
        quantity: 1,
        size: 'Full',
        isFreeClaim: false,
      },
      { foodItemId: 'dal', quantity: 1, size: 'Half', isFreeClaim: true },
    ]);
  });

  it('does not send server-owned fields', () => {
    const request = buildCreateOrderRequest(baseInput) as unknown as Record<
      string,
      unknown
    >;
    [
      'marketId',
      'restaurantOrders',
      'subtotal',
      'totalAmount',
      'deliveryFee',
      'status',
    ].forEach((field) => expect(request).not.toHaveProperty(field));
    (request.items as Record<string, unknown>[]).forEach((item) => {
      [
        'unitPrice',
        'itemName',
        'restaurantId',
        'restaurantName',
        'isPromotionalAddon',
        'originalPrice',
      ].forEach((field) => expect(item).not.toHaveProperty(field));
    });
  });

  it('keeps the client-owned fields the server stores', () => {
    const request = buildCreateOrderRequest({
      ...baseInput,
      discountAmount: 50,
      discountCode: 'WELCOME50',
      discountName: 'Welcome',
    });
    expect(request).toMatchObject({
      customerName: 'Asha',
      customerPhone: '+919812345678',
      deliveryAddress: 'Tower 3, Flat 1204',
      fulfillmentType: 'DELIVERY',
      discountAmount: 50,
      discountCode: 'WELCOME50',
      discountName: 'Welcome',
      promotionalSavings: 51,
      taxAmount: 14.95,
      isPaidOnline: false,
    });
  });

  it('omits discount and promo savings when there are none', () => {
    const request = buildCreateOrderRequest({
      ...baseInput,
      promotionalSavings: 0,
      discountCode: 'IGNORED',
    });
    expect(request).not.toHaveProperty('discountAmount');
    expect(request).not.toHaveProperty('discountCode');
    expect(request).not.toHaveProperty('promotionalSavings');
  });

  it('sends deliveryLocation for DELIVERY and SCHEDULED only', () => {
    expect(buildCreateOrderRequest(baseInput).deliveryLocation).toEqual({
      lat: 28.6421,
      lng: 77.3712,
    });
    const scheduled = buildCreateOrderRequest({
      ...baseInput,
      fulfillmentType: OrderFulfillmentType.SCHEDULED,
      scheduledTime: '19:30',
    });
    expect(scheduled.deliveryLocation).toEqual({ lat: 28.6421, lng: 77.3712 });
    expect(scheduled.scheduledTime).toBe('19:30');
    const pickup = buildCreateOrderRequest({
      ...baseInput,
      fulfillmentType: OrderFulfillmentType.PICKUP,
      scheduledTime: '19:30',
    });
    expect(pickup).not.toHaveProperty('deliveryLocation');
    expect(pickup).not.toHaveProperty('scheduledTime');
  });

  it('drops a missing or invalid location instead of sending a bad one', () => {
    expect(
      buildCreateOrderRequest({ ...baseInput, deliveryLocation: null })
    ).not.toHaveProperty('deliveryLocation');
    expect(
      buildCreateOrderRequest({
        ...baseInput,
        deliveryLocation: { lat: 120, lng: 77 },
      })
    ).not.toHaveProperty('deliveryLocation');
  });
});

describe('place-order errors', () => {
  it('treats 4xx as a rejection and network/5xx as a failure', () => {
    expect(isOrderRejected(new PlaceOrderError(400, 'x'))).toBe(true);
    expect(isOrderRejected(new PlaceOrderError(409, 'x'))).toBe(true);
    expect(isOrderRejected(new PlaceOrderError(0))).toBe(false);
    expect(isOrderRejected(new PlaceOrderError(500))).toBe(false);
    expect(isOrderRejected(new Error('boom'))).toBe(false);
  });

  it('explains the outside-area error and offers to change the address', () => {
    expect(
      describePlaceOrderError(
        new PlaceOrderError(
          400,
          'Delivery address is outside Market 1 delivery area'
        )
      )
    ).toEqual({
      message:
        'Delivery address is outside Market 1 delivery area. Choose another address or switch to pickup.',
      action: 'change-address',
    });
  });

  it('sends cart problems back to the cart', () => {
    const cases = [
      'All items in an order must come from restaurants in the same market',
      'Mutka King is not taking orders right now',
      "'Kulhad Chai' is not available right now",
      'Invalid order item options',
      "Restaurant 'mutka-king' not found",
    ];
    cases.forEach((serverMessage) => {
      const info = describePlaceOrderError(
        new PlaceOrderError(400, serverMessage)
      );
      expect(info.action).toBe('review-cart');
      expect(info.message.length).toBeGreaterThan(0);
    });
    expect(
      describePlaceOrderError(
        new PlaceOrderError(400, 'Mutka King is not taking orders right now')
      ).message
    ).toBe(
      'Mutka King is not taking orders right now. Remove it from your cart to continue.'
    );
  });

  it('handles the location, schedule, empty-body and unknown cases', () => {
    expect(
      describePlaceOrderError(
        new PlaceOrderError(
          400,
          'deliveryLocation needs lat between -90 and 90 and lng between -180 and 180'
        )
      ).action
    ).toBe('change-address');
    expect(
      describePlaceOrderError(
        new PlaceOrderError(
          400,
          'scheduledTime is required when fulfillmentType is SCHEDULED'
        )
      )
    ).toEqual({
      message: 'Choose a time for your scheduled order.',
      action: 'dismiss',
    });
    expect(describePlaceOrderError(new PlaceOrderError(400)).action).toBe(
      'review-cart'
    );
    expect(
      describePlaceOrderError(new PlaceOrderError(400, 'Something else'))
    ).toEqual({ message: 'Something else.', action: 'dismiss' });
    expect(describePlaceOrderError(new PlaceOrderError(0)).action).toBe(
      'dismiss'
    );
  });
});

describe('free-claim items (4.7 carry-over)', () => {
  const kulfi = makeFoodItem({
    id: 'kulfi',
    name: 'Kulfi',
    restaurantId: 'mutka-king',
    freeClaimPortion: 'Half',
  });

  it("takes the dish's own restaurant and market from the directory", () => {
    const item = createFreeClaimCartItem(kulfi, directory);
    expect(item).toMatchObject({
      id: 'kulfi',
      price: 0,
      quantity: 1,
      option: { size: 'Half' },
      isFreeClaim: true,
      restaurantId: 'mutka-king',
      restaurantName: 'Mutka King',
      marketId: 'market1',
    });
  });

  it('uses the market from the directory, not market1', () => {
    const item = createFreeClaimCartItem(
      makeFoodItem({ restaurantId: 'far-away', freeClaimPortion: 'Full' }),
      directory
    );
    expect(item.marketId).toBe('market2');
  });

  it("defaults legacy dishes to Bob's", () => {
    const item = createFreeClaimCartItem(
      makeFoodItem({ restaurantId: undefined, freeClaimPortion: 'Full' }),
      directory
    );
    expect(item.restaurantId).toBe('bobs');
  });

  it('lists only unclaimed dishes of the cart market', () => {
    const bobsDal = makeFoodItem({
      id: 'dal',
      restaurantId: 'bobs',
      freeClaimPortion: 'Half',
    });
    const otherMarket = makeFoodItem({
      id: 'far',
      restaurantId: 'far-away',
      freeClaimPortion: 'Full',
    });
    const noFree = makeFoodItem({ id: 'plain', restaurantId: 'bobs' });
    const cart = [
      makeCartItem(),
      makeCartItem({
        id: 'dal',
        price: 0,
        option: { size: 'Half' },
        isFreeClaim: true,
      }),
    ];
    expect(
      getFreeClaimOptions(
        [bobsDal, kulfi, otherMarket, noFree],
        cart,
        directory
      ).map((item) => item.id)
    ).toEqual(['kulfi']);
  });
});

describe('promotions on a multi-restaurant cart (4.7)', () => {
  it('unlocks on the whole-cart subtotal across restaurants', () => {
    const cart = [
      makeCartItem({ price: 400 }),
      makeCartItem({
        id: 'thali',
        price: 250,
        restaurantId: 'mutka-king',
        restaurantName: 'Mutka King',
      }),
    ];
    // Bob's alone (400) is below the ₹599 minimum; both restaurants (650) aren't.
    expect(getQualifyingCartSubtotal(cart.slice(0, 1))).toBe(400);
    const subtotal = getQualifyingCartSubtotal(cart);
    expect(subtotal).toBe(650);
    const response = buildPromotionalAddonsResponse(
      [kulfiDeal],
      subtotal,
      cart
    );
    expect(response.eligible).toBe(true);
    expect(response.availableItems).toHaveLength(1);
  });

  it('does not count add-ons or free claims towards unlocking', () => {
    const cart = [
      makeCartItem({ price: 590 }),
      makeCartItem({ id: 'kulfi', price: 9, isPromotionalAddon: true }),
      makeCartItem({ id: 'dal', price: 0, isFreeClaim: true }),
    ];
    expect(getQualifyingCartSubtotal(cart)).toBe(590);
  });

  it("stamps a ₹9 add-on with the dish's restaurant", () => {
    const product = makeFoodItem({ id: 'kulfi', restaurantId: 'mutka-king' });
    const addon = createPromotionalAddonCartItem(
      kulfiDeal,
      product,
      1,
      null,
      directory
    );
    expect(addon).toMatchObject({
      restaurantId: 'mutka-king',
      restaurantName: 'Mutka King',
      marketId: 'market1',
      price: 9,
      isPromotionalAddon: true,
    });
  });
});

describe('split pickup checkout (D12)', () => {
  const paneer = makeCartItem({ quantity: 2 }); // Bob's, 250 × 2
  const chai = makeCartItem({
    id: 'kulhad-chai',
    name: 'Kulhad Chai',
    price: 40,
    restaurantId: 'mutka-king',
    restaurantName: 'Mutka King',
  });
  const bobsPart: PublicRestaurantOrder = {
    restaurantId: 'bobs',
    restaurantName: "Bob's",
    restaurantPhone: '+919643310092',
    items: [
      {
        foodItemId: paneer.id,
        itemName: paneer.name,
        quantity: 2,
        unitPrice: 250,
        restaurantId: 'bobs',
      },
    ],
    subtotal: 500,
    status: OrderStatus.PENDING,
  };
  const mutkaPart: PublicRestaurantOrder = {
    restaurantId: 'mutka-king',
    restaurantName: 'Mutka King',
    restaurantPhone: '+919800000001',
    items: [
      {
        foodItemId: 'kulhad-chai',
        itemName: 'Kulhad Chai',
        quantity: 1,
        unitPrice: 40,
        restaurantId: 'mutka-king',
      },
    ],
    subtotal: 40,
    status: OrderStatus.PENDING,
  };
  const order = (
    id: string,
    fulfillmentType: OrderFulfillmentType,
    parts: PublicRestaurantOrder[],
    deliveryFee: number | null
  ): PublicOrder => ({
    id,
    customerName: 'Asha',
    customerPhone: '+919812345678',
    deliveryAddress: 'Pickup',
    fulfillmentType,
    items: parts.flatMap((part) => part.items),
    totalAmount: parts.reduce((sum, part) => sum + part.subtotal, 0),
    status: OrderStatus.PENDING,
    deliveryFee,
    restaurantOrders: parts,
  });
  const first = {
    ...order('order-bobs', OrderFulfillmentType.PICKUP, [bobsPart], 0),
    checkoutGroupId: 'group-1',
  };
  const second = {
    ...order('order-mutka', OrderFulfillmentType.PICKUP, [mutkaPart], 0),
    checkoutGroupId: 'group-1',
  };
  const splitResponse: PublicOrder = {
    ...first,
    groupOrders: [first, second],
  };
  const deliveryResponse = order(
    'order-all',
    OrderFulfillmentType.DELIVERY,
    [bobsPart, mutkaPart],
    20
  );

  it('warns before placing only for pickup from 2+ restaurants', () => {
    expect(willSplitPickup(OrderFulfillmentType.PICKUP, 2)).toBe(true);
    expect(willSplitPickup(OrderFulfillmentType.PICKUP, 1)).toBe(false);
    expect(willSplitPickup(OrderFulfillmentType.DELIVERY, 2)).toBe(false);
    expect(willSplitPickup(OrderFulfillmentType.SCHEDULED, 3)).toBe(false);
  });

  it('decides split vs consolidated from groupOrders', () => {
    expect(isSplitCheckout(splitResponse)).toBe(true);
    expect(getCheckoutOrders(splitResponse).map((o) => o.id)).toEqual([
      'order-bobs',
      'order-mutka',
    ]);
    expect(isSplitCheckout(deliveryResponse)).toBe(false);
    expect(isSplitCheckout({ ...deliveryResponse, groupOrders: [] })).toBe(
      false
    );
    expect(isSplitCheckout({ ...deliveryResponse, groupOrders: null })).toBe(
      false
    );
    expect(getCheckoutOrders(deliveryResponse)).toEqual([deliveryResponse]);
  });

  it('sums the fee over the orders', () => {
    expect(getCheckoutDeliveryFee([first, second])).toBe(0);
    expect(getCheckoutDeliveryFee([deliveryResponse])).toBe(20);
    expect(
      getCheckoutDeliveryFee([{ ...deliveryResponse, deliveryFee: null }])
    ).toBeUndefined();
  });

  it('builds one confirmation row per order for a split pickup', () => {
    const placed = summarizePlacedCheckout({
      response: splitResponse,
      cartItems: [paneer, chai],
      displayedFee: 0,
      cartTotal: 540,
      discountAmount: 50,
    });
    expect(placed.split).toBe(true);
    expect(placed.orderIds).toEqual(['order-bobs', 'order-mutka']);
    expect(
      placed.restaurants.map((r) => [r.orderId, r.name, r.phone, r.subtotal])
    ).toEqual([
      ['order-bobs', "Bob's", '+919643310092', 500],
      ['order-mutka', 'Mutka King', '+919800000001', 40],
    ]);
    expect(placed).toMatchObject({
      deliveryFee: 0,
      feeChanged: false,
      total: 490,
    });
  });

  it('keeps one order with sections for delivery, using the server fee', () => {
    const placed = summarizePlacedCheckout({
      response: deliveryResponse,
      cartItems: [paneer, chai],
      displayedFee: 30,
      cartTotal: 540,
      discountAmount: 0,
    });
    expect(placed.split).toBe(false);
    expect(placed.orderIds).toEqual(['order-all']);
    expect(placed.restaurants.map((r) => r.restaurantId)).toEqual([
      'bobs',
      'mutka-king',
    ]);
    expect(placed.restaurants.every((r) => r.orderId === undefined)).toBe(true);
    expect(placed).toMatchObject({
      deliveryFee: 20,
      feeChanged: true,
      total: 560,
    });
  });
});

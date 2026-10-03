import { describe, expect, it } from 'vitest';
import { OrderFulfillmentType, OrderStatus } from '../../types';
import { ApiError } from '../api/apiError';
import {
  AdminFullOrder,
  AdminOrderItem,
  AdminRestaurantOrder,
} from '../types/orders';
import {
  buildRestaurantFilterOptions,
  currentOrdersBucket,
  deriveOverallStatus,
  filterOrdersByRestaurant,
  formatItemVariant,
  formatRupees,
  getOrderMoneySummary,
  getRestaurantSections,
  getStatusChipColor,
  isLegacyOrder,
  overallStatusNote,
  replaceOrderInList,
  restaurantItemsTotal,
  statusErrorMessage,
  subOrderProgressText,
  telHref,
} from './adminOrders';

const item = (overrides: Partial<AdminOrderItem> = {}): AdminOrderItem => ({
  foodItemId: 'f1',
  itemName: 'Paneer Tikka',
  quantity: 2,
  unitPrice: 250,
  size: 'Full',
  restaurantId: 'bobs',
  restaurantName: "Bob's",
  ...overrides,
});

const subOrder = (
  overrides: Partial<AdminRestaurantOrder> = {}
): AdminRestaurantOrder => ({
  restaurantId: 'bobs',
  restaurantName: "Bob's",
  restaurantPhone: '+919643310092',
  items: [item()],
  subtotal: 500,
  status: OrderStatus.PENDING,
  payoutAmount: 500,
  payoutStatus: 'UNPAID',
  ...overrides,
});

const mutkaItem = item({
  foodItemId: 'm1',
  itemName: 'Kulhad Chai',
  quantity: 3,
  unitPrice: 33.33,
  size: 'Full',
  restaurantId: 'mutka-king',
  restaurantName: 'Mutka King',
});

const order = (overrides: Partial<AdminFullOrder> = {}): AdminFullOrder => ({
  id: 'o1',
  customerName: 'Asha',
  customerPhone: '+919812345678',
  deliveryAddress: 'Tower 3',
  fulfillmentType: OrderFulfillmentType.DELIVERY,
  items: [item(), mutkaItem],
  subtotal: 599.99,
  totalAmount: 599.99,
  deliveryFee: 20,
  isPaidOnline: false,
  status: OrderStatus.PENDING,
  marketId: 'market1',
  restaurantOrders: [
    subOrder(),
    subOrder({
      restaurantId: 'mutka-king',
      restaurantName: 'Mutka King',
      restaurantPhone: '+91 98000 00000',
      items: [mutkaItem],
      subtotal: 99.99,
      payoutAmount: 99.99,
    }),
  ],
  ...overrides,
});

const legacyOrder = (overrides: Partial<AdminFullOrder> = {}) =>
  order({
    id: 'legacy',
    restaurantOrders: undefined,
    marketId: undefined,
    items: [item({ restaurantId: undefined, restaurantName: undefined })],
    subtotal: 500,
    totalAmount: 500,
    deliveryFee: undefined,
    status: OrderStatus.COMPLETED,
    ...overrides,
  });

describe('formatting helpers', () => {
  it('formats rupees with 2 decimals and Indian grouping', () => {
    expect(formatRupees(1200)).toBe('₹1,200.00');
    expect(formatRupees(123456.5)).toBe('₹1,23,456.50');
    expect(formatRupees(99.999)).toBe('₹100.00');
    expect(formatRupees(-20)).toBe('-₹20.00');
    expect(formatRupees(null)).toBe('₹0.00');
    expect(formatRupees(undefined)).toBe('₹0.00');
  });

  it('builds tel: links without spaces', () => {
    expect(telHref('+91 98000-00000')).toBe('tel:+919800000000');
    expect(telHref('')).toBeNull();
    expect(telHref(null)).toBeNull();
  });

  it('formats item variants', () => {
    expect(formatItemVariant({ size: 'Full', style: 'Dry' })).toBe(
      ' (Full, Dry)'
    );
    expect(formatItemVariant({ size: '' })).toBe('');
  });
});

describe('deriveOverallStatus (mirror of OrderStatusRules)', () => {
  const S = OrderStatus;
  it.each([
    [[S.READY, S.PENDING], S.PREPARING],
    [[S.PENDING, S.CONFIRMED], S.CONFIRMED],
    [[S.COMPLETED, S.CANCELLED], S.COMPLETED],
    [[S.CANCELLED, S.CANCELLED], S.CANCELLED],
    [[S.READY, S.COMPLETED], S.READY],
    [[S.PENDING, S.PENDING], S.PENDING],
    [[null, S.CONFIRMED], S.CONFIRMED],
  ])('%j → %s', (statuses, expected) => {
    expect(deriveOverallStatus(statuses)).toBe(expected);
  });

  it('returns null with no sub-orders', () => {
    expect(deriveOverallStatus([])).toBeNull();
  });
});

describe('status display', () => {
  it('maps statuses to chip colours', () => {
    expect(getStatusChipColor(OrderStatus.PENDING)).toBe('warning');
    expect(getStatusChipColor(OrderStatus.READY)).toBe('success');
    expect(getStatusChipColor(OrderStatus.CANCELLED)).toBe('error');
    expect(getStatusChipColor(undefined)).toBe('default');
  });

  it('keeps READY on the board with Preparing', () => {
    expect(currentOrdersBucket(OrderStatus.PENDING)).toBe('new');
    expect(currentOrdersBucket(OrderStatus.CONFIRMED)).toBe('new');
    expect(currentOrdersBucket(OrderStatus.PREPARING)).toBe('preparing');
    expect(currentOrdersBucket(OrderStatus.READY)).toBe('preparing');
    expect(currentOrdersBucket(OrderStatus.COMPLETED)).toBe('done');
    expect(currentOrdersBucket(OrderStatus.CANCELLED)).toBeNull();
    expect(currentOrdersBucket(undefined)).toBe('new');
  });

  it('shows progress for multi-restaurant orders only', () => {
    const o = order({
      restaurantOrders: [
        subOrder({ status: OrderStatus.READY }),
        subOrder({ restaurantId: 'mutka-king', status: OrderStatus.PREPARING }),
      ],
    });
    expect(subOrderProgressText(o)).toBe('1 of 2 restaurants ready');
    const withCancelled = order({
      restaurantOrders: [
        subOrder({ status: OrderStatus.COMPLETED }),
        subOrder({ restaurantId: 'mutka-king', status: OrderStatus.CANCELLED }),
      ],
    });
    expect(subOrderProgressText(withCancelled)).toBe(
      '1 of 1 restaurant ready, 1 cancelled'
    );
    expect(subOrderProgressText(legacyOrder())).toBeNull();
    expect(
      subOrderProgressText(order({ restaurantOrders: [subOrder()] }))
    ).toBeNull();
  });

  it('notes an overall status that differs from the derived one', () => {
    const o = order({
      status: OrderStatus.COMPLETED,
      restaurantOrders: [
        subOrder({ status: OrderStatus.READY }),
        subOrder({ restaurantId: 'mutka-king', status: OrderStatus.PENDING }),
      ],
    });
    expect(overallStatusNote(o)).toContain('PREPARING');
    const agrees = order({
      status: OrderStatus.PREPARING,
      restaurantOrders: o.restaurantOrders,
    });
    expect(overallStatusNote(agrees)).toBeNull();
    expect(overallStatusNote(legacyOrder())).toBeNull();
  });

  it('explains a 409 conflict', () => {
    expect(
      statusErrorMessage(new ApiError('Order was modified concurrently', 409))
    ).toBe(
      'Order changed, refreshed. Check it and try again. (Order was modified concurrently)'
    );
    expect(
      statusErrorMessage(
        new ApiError("Restaurant 'x' is not part of order 'o1'", 404)
      )
    ).toBe("Restaurant 'x' is not part of order 'o1'");
  });
});

describe('restaurant sections', () => {
  it('uses restaurantOrders in server order', () => {
    const sections = getRestaurantSections(order());
    expect(sections.map((s) => s.restaurantId)).toEqual(['bobs', 'mutka-king']);
    expect(sections[1]).toMatchObject({
      restaurantName: 'Mutka King',
      restaurantPhone: '+91 98000 00000',
      subtotal: 99.99,
      payoutStatus: 'UNPAID',
      legacy: false,
    });
  });

  it("treats a legacy order as one Bob's group with the order status", () => {
    const o = legacyOrder();
    expect(isLegacyOrder(o)).toBe(true);
    const [section] = getRestaurantSections(o);
    expect(section).toMatchObject({
      restaurantId: 'bobs',
      restaurantName: "Bob's",
      subtotal: 500,
      status: OrderStatus.COMPLETED,
      legacy: true,
    });
    expect(isLegacyOrder(order({ restaurantOrders: null }))).toBe(true);
  });

  it('has no sections for restaurantOrders: []', () => {
    const o = order({ restaurantOrders: [], items: [] });
    expect(isLegacyOrder(o)).toBe(false);
    expect(getRestaurantSections(o)).toEqual([]);
  });

  it('filters by restaurant (legacy counts as bobs)', () => {
    const orders = [
      order(),
      legacyOrder(),
      order({ id: 'o3', restaurantOrders: [subOrder()] }),
    ];
    expect(filterOrdersByRestaurant(orders, '').length).toBe(3);
    expect(
      filterOrdersByRestaurant(orders, 'mutka-king').map((o) => o.id)
    ).toEqual(['o1']);
    expect(filterOrdersByRestaurant(orders, 'bobs').map((o) => o.id)).toEqual([
      'o1',
      'legacy',
      'o3',
    ]);
    expect(restaurantItemsTotal(orders, 'bobs')).toBe(1500);
    expect(restaurantItemsTotal(orders, 'mutka-king')).toBe(99.99);
  });

  it('builds filter options from restaurants plus unknown ids on orders', () => {
    const options = buildRestaurantFilterOptions(
      [{ id: 'mutka-king', name: 'Mutka King' }],
      [
        order({
          restaurantOrders: [
            subOrder({
              restaurantId: 'ghost',
              restaurantName: 'Ghost Kitchen',
            }),
          ],
        }),
      ]
    );
    expect(options).toEqual([
      { id: 'bobs', name: "Bob's" },
      { id: 'ghost', name: 'Ghost Kitchen' },
      { id: 'mutka-king', name: 'Mutka King' },
    ]);
  });
});

describe('order money summary', () => {
  it('uses the server fields (totalAmount excludes the fee)', () => {
    expect(getOrderMoneySummary(order({ discountAmount: 50 }))).toEqual({
      itemsSubtotal: 599.99,
      promotionalSavings: 0,
      discount: 50,
      deliveryFee: 20,
      total: 599.99,
    });
  });

  it('falls back to Σ items and item promo savings on old orders', () => {
    const o = legacyOrder({
      subtotal: undefined,
      items: [
        item({
          quantity: 1,
          unitPrice: 9,
          isPromotionalAddon: true,
          originalPrice: 120,
        }),
        item({ quantity: 2, unitPrice: 100 }),
      ],
    });
    expect(getOrderMoneySummary(o)).toMatchObject({
      itemsSubtotal: 209,
      promotionalSavings: 111,
      deliveryFee: 0,
    });
  });
});

describe('replaceOrderInList', () => {
  it('replaces the order by id and keeps the rest', () => {
    const data = { orders: [order(), legacyOrder()], totalAmount: 1 };
    const updated = order({ status: OrderStatus.READY });
    const next = replaceOrderInList(data, updated);
    expect(next?.orders[0].status).toBe(OrderStatus.READY);
    expect(next?.orders[1]).toBe(data.orders[1]);
    expect(replaceOrderInList(data, order({ id: 'nope' }))).toBe(data);
    expect(replaceOrderInList(undefined, updated)).toBeUndefined();
  });
});

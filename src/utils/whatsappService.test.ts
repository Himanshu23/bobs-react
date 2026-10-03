import { describe, expect, it } from 'vitest';
import { OrderFulfillmentType, OrderStatus } from '../types';
import { PublicOrder, PublicRestaurantOrder } from '../types/order';
import { makeCartItem } from './cartTestFixtures';
import {
  buildRestaurantSectionsFromCart,
  buildRestaurantSectionsFromOrder,
  buildSplitOrderSections,
  formatOrderMessage,
  formatRupees,
  OrderMessage,
} from './whatsappService';

const contacts = new Map([
  ['bobs', { name: "Bob's", phone: '+919643310092' }],
  ['mutka-king', { name: 'Mutka King', phone: '+919800000001' }],
]);

const paneer = makeCartItem({ quantity: 2 }); // Bob's, 250 × 2
const chai = makeCartItem({
  id: 'kulhad-chai',
  name: 'Kulhad Chai',
  price: 40,
  option: { size: 'Full', style: 'Dry' },
  restaurantId: 'mutka-king',
  restaurantName: 'Mutka King',
});
const jamunDeal = makeCartItem({
  id: 'gulab-jamun',
  name: 'Gulab Jamun',
  price: 9,
  originalPrice: 60,
  isPromotionalAddon: true,
});
const freeDal = makeCartItem({
  id: 'dal',
  name: 'Dal',
  price: 0,
  option: { size: 'Half' },
  isFreeClaim: true,
});

const serverItem = (foodItemId: string, restaurantId: string) => ({
  foodItemId,
  itemName: foodItemId,
  quantity: 1,
  unitPrice: 999,
  size: 'Full',
  restaurantId,
});

// Server order: Mutka King first (as the server returns it), full prices.
const restaurantOrders: PublicRestaurantOrder[] = [
  {
    restaurantId: 'mutka-king',
    restaurantName: 'Mutka King',
    restaurantPhone: '+919800000009',
    items: [serverItem('kulhad-chai', 'mutka-king')],
    subtotal: 40,
    status: OrderStatus.PENDING,
  },
  {
    restaurantId: 'bobs',
    restaurantName: "Bob's",
    restaurantPhone: '+919643310092',
    items: [
      serverItem('dish-1', 'bobs'),
      serverItem('gulab-jamun', 'bobs'),
      serverItem('dal', 'bobs'),
    ],
    subtotal: 1120,
    status: OrderStatus.PENDING,
  },
];

const baseMessage = (overrides: Partial<OrderMessage> = {}): OrderMessage => ({
  restaurants: [],
  total: 0,
  deliveryAddress: 'Tower 3, Flat 1204',
  customerName: 'Asha',
  deliveryMethod: 'delivery',
  deliveryFee: 20,
  ...overrides,
});

describe('formatRupees', () => {
  it('drops decimals for whole rupees', () => {
    expect(formatRupees(500)).toBe('₹500');
    expect(formatRupees(299.5)).toBe('₹299.50');
    expect(formatRupees(0.1 + 0.2)).toBe('₹0.30');
  });
});

describe('buildRestaurantSectionsFromOrder', () => {
  it("uses the server's restaurants, order and phones with cart prices", () => {
    const sections = buildRestaurantSectionsFromOrder(
      restaurantOrders,
      [paneer, chai, jamunDeal, freeDal],
      contacts
    );
    expect(sections.map((s) => s.restaurantId)).toEqual(['mutka-king', 'bobs']);
    expect(sections[0]).toMatchObject({
      name: 'Mutka King',
      phone: '+919800000009', // snapshot on the order wins
      subtotal: 40,
    });
    // Cart prices: 500 + ₹9 deal + free dal, not the server's 1120.
    expect(sections[1].subtotal).toBe(509);
    expect(sections[1].items.map((i) => i.price)).toEqual([500, 9, 0]);
  });

  it('puts a cart line under the restaurant the server assigned', () => {
    const staleChai = {
      ...chai,
      restaurantId: 'bobs',
      restaurantName: "Bob's",
    };
    const sections = buildRestaurantSectionsFromOrder(
      restaurantOrders,
      [paneer, staleChai],
      contacts
    );
    expect(
      sections.find((s) => s.restaurantId === 'mutka-king')?.items
    ).toHaveLength(1);
  });

  it('groups the cart when the response has no restaurantOrders (legacy)', () => {
    const sections = buildRestaurantSectionsFromOrder(
      null,
      [paneer, chai],
      contacts
    );
    expect(sections.map((s) => s.name)).toEqual(["Bob's", 'Mutka King']);
  });
});

describe('formatOrderMessage', () => {
  it('formats a single-restaurant delivery order', () => {
    const restaurants = buildRestaurantSectionsFromCart([paneer], contacts);
    const message = formatOrderMessage(
      baseMessage({ restaurants, total: 520, tax: 25 })
    );
    expect(message).toBe(
      [
        "🍕 *Order via Bob's Delivery*",
        '',
        '*Customer:* Asha',
        '',
        '*Items:*',
        '',
        "🏪 *Bob's* · 📞 +919643310092",
        '• Paneer Tikka (Full) x2 - ₹500',
        '_Subtotal: ₹500_',
        '',
        '*Delivery Address:*',
        'Tower 3, Flat 1204',
        '',
        '*Items Total:* ₹500',
        '*Tax (shown only, not charged):* ~₹25~',
        '*Delivery Fee:* ₹20',
        '',
        '*Total: ₹520*',
        '',
        'Please confirm this order. Thank you! 🙏',
      ].join('\n')
    );
  });

  it('formats a multi-restaurant order with discount, deal and free lines', () => {
    const restaurants = buildRestaurantSectionsFromOrder(
      restaurantOrders,
      [paneer, chai, jamunDeal, freeDal],
      contacts
    );
    const message = formatOrderMessage(
      baseMessage({
        restaurants,
        discountAmount: 50,
        discountCode: 'WELCOME50',
        discountName: 'Welcome',
        deliveryFee: 20,
        total: 519,
        scheduledTime: '19:30',
        instructions: '  No onions ',
      })
    );
    expect(message).toContain(
      [
        '🏪 *Mutka King* · 📞 +919800000009',
        '• Kulhad Chai (Full, Dry) x1 - ₹40',
        '_Subtotal: ₹40_',
        '',
        "🏪 *Bob's* · 📞 +919643310092",
        '• Paneer Tikka (Full) x2 - ₹500',
        '• Gulab Jamun (Full) x1 - ₹9 (Deal)',
        '• Dal (Half) x1 - FREE',
        '_Subtotal: ₹509_',
      ].join('\n')
    );
    expect(message).toContain('*Scheduled For:* 7:30 PM');
    expect(message).toContain(
      [
        '*Items Total:* ₹549',
        '*Discount Applied:* Welcome (WELCOME50)',
        '*Discount Value:* -₹50',
        '*Delivery Fee:* ₹20',
        '',
        '*Total: ₹519*',
      ].join('\n')
    );
    expect(message).toContain('*Special Instructions:*\nNo onions');
    expect(message).not.toContain('could not be saved');
  });

  it('formats the fallback (not saved) path from the cart', () => {
    const restaurants = buildRestaurantSectionsFromCart(
      [paneer, chai],
      contacts
    );
    const message = formatOrderMessage(
      baseMessage({ restaurants, total: 560, savedToServer: false })
    );
    expect(message).toContain("🏪 *Bob's* · 📞 +919643310092");
    expect(message).toContain('🏪 *Mutka King* · 📞 +919800000001');
    expect(message).toContain('*Total: ₹560*');
    expect(message).toContain(
      '⚠️ _This order could not be saved in the app. Please record it manually._'
    );
  });

  it('shows pickup with the restaurants and a free delivery fee', () => {
    const restaurants = buildRestaurantSectionsFromCart([paneer, chai]);
    const message = formatOrderMessage(
      baseMessage({
        restaurants,
        deliveryMethod: 'pickup',
        deliveryFee: 0,
        total: 540,
      })
    );
    expect(message).toContain(
      "*Order Type:* Pickup 🎉\n*Pickup From:* Bob's, Mutka King"
    );
    expect(message).not.toContain('*Delivery Address:*');
    expect(message).toContain('*Delivery Fee:* Free');
    // No directory: headings without a phone.
    expect(message).toContain("🏪 *Bob's*\n• Paneer Tikka");
  });
});

// D12: a split pickup response, Bob's first (cart order), one order each.
const splitOrder = (
  id: string,
  restaurantOrder: PublicRestaurantOrder
): PublicOrder => ({
  id,
  customerName: 'Asha',
  customerPhone: '+919812345678',
  deliveryAddress: 'Pickup',
  fulfillmentType: OrderFulfillmentType.PICKUP,
  items: restaurantOrder.items,
  totalAmount: restaurantOrder.subtotal,
  status: OrderStatus.PENDING,
  deliveryFee: 0,
  checkoutGroupId: 'group-1',
  restaurantOrders: [restaurantOrder],
});
const groupOrders: PublicOrder[] = [
  splitOrder('order-bobs', restaurantOrders[1]),
  splitOrder('order-mutka', restaurantOrders[0]),
];

describe('buildSplitOrderSections (D12)', () => {
  it('tags each restaurant with the id of its own order, in server order', () => {
    const sections = buildSplitOrderSections(
      groupOrders,
      [paneer, chai, jamunDeal, freeDal],
      contacts
    );
    expect(
      sections.map((s) => [s.restaurantId, s.orderId, s.subtotal])
    ).toEqual([
      ['bobs', 'order-bobs', 509],
      ['mutka-king', 'order-mutka', 40],
    ]);
    expect(sections[1].phone).toBe('+919800000009');
  });

  it('falls back to the items when an order has no restaurantOrders', () => {
    const legacy = groupOrders.map((order) => ({
      ...order,
      restaurantOrders: null,
    }));
    const sections = buildSplitOrderSections(legacy, [paneer, chai], contacts);
    expect(sections.map((s) => [s.restaurantId, s.orderId])).toEqual([
      ['bobs', 'order-bobs'],
      ['mutka-king', 'order-mutka'],
    ]);
  });
});

describe('formatOrderMessage for a split pickup (D12)', () => {
  it('lists each order separately, then discount, tax and the total', () => {
    const restaurants = buildSplitOrderSections(
      groupOrders,
      [paneer, chai],
      contacts
    );
    const message = formatOrderMessage(
      baseMessage({
        restaurants,
        deliveryMethod: 'pickup',
        deliveryFee: 0,
        discountAmount: 50,
        discountCode: 'WELCOME50',
        discountName: 'Welcome',
        tax: 24.5,
        total: 490,
        separateOrders: true,
      })
    );
    expect(message).toBe(
      [
        "🍕 *Order via Bob's Delivery*",
        '',
        '*Customer:* Asha',
        '',
        '*2 separate orders (one per restaurant):*',
        '',
        '*Order 1 of 2* · ID: order-bobs',
        "🏪 *Bob's* · 📞 +919643310092",
        '• Paneer Tikka (Full) x2 - ₹500',
        '_Subtotal: ₹500_',
        '',
        '*Order 2 of 2* · ID: order-mutka',
        '🏪 *Mutka King* · 📞 +919800000009',
        '• Kulhad Chai (Full, Dry) x1 - ₹40',
        '_Subtotal: ₹40_',
        '',
        '*Order Type:* Pickup 🎉',
        "*Pickup From:* Bob's, Mutka King",
        '',
        '*Items Total:* ₹540',
        '*Discount Applied:* Welcome (WELCOME50)',
        '*Discount Value:* -₹50',
        '*Tax (shown only, not charged):* ~₹24.50~',
        '*Delivery Fee:* Free',
        '',
        '*Total to pay (all 2 orders): ₹490*',
        '',
        'Please confirm these orders. Thank you! 🙏',
      ].join('\n')
    );
  });

  it('omits the id when an order id is unknown', () => {
    const restaurants = buildRestaurantSectionsFromCart(
      [paneer, chai],
      contacts
    );
    const message = formatOrderMessage(
      baseMessage({
        restaurants,
        deliveryMethod: 'pickup',
        deliveryFee: 0,
        total: 540,
        separateOrders: true,
      })
    );
    expect(message).toContain("*Order 1 of 2*\n🏪 *Bob's*");
    expect(message).not.toContain('*Items:*');
  });

  it('keeps the consolidated format when not split', () => {
    const restaurants = buildRestaurantSectionsFromCart(
      [paneer, chai],
      contacts
    );
    const message = formatOrderMessage(
      baseMessage({ restaurants, total: 560 })
    );
    expect(message).toContain('*Items:*');
    expect(message).not.toContain('separate orders');
    expect(message).not.toContain('*Order 1 of');
    expect(message).toContain('*Total: ₹560*');
  });
});

/**
 * WhatsApp integration utility
 * Crafts messages and generates WhatsApp links
 */

import { CartItem } from '../types';
import { PublicOrder, PublicRestaurantOrder } from '../types/order';
import { getCartItemRestaurantId, groupCartByRestaurant } from './cartUtils';

/** One item line, priced as the customer pays it (cart price × quantity). */
export interface WhatsAppItemLine {
  name: string;
  quantity: number;
  /** Line total at cart prices: free claims 0, promo add-ons at the promo price. */
  price: number;
  size?: string;
  style?: string;
  base?: string;
  isFreeClaim?: boolean;
  isPromotionalAddon?: boolean;
}

/** One restaurant heading in the message, with its phone and subtotal. */
export interface WhatsAppRestaurantSection {
  restaurantId: string;
  name: string;
  phone?: string | null;
  items: WhatsAppItemLine[];
  subtotal: number;
  /**
   * D12 split pickup: the id of the separate order this restaurant's items
   * were placed as. Absent for a consolidated order and the fallback.
   */
  orderId?: string | null;
}

/** Name/phone lookup (e.g. `useRestaurantDirectory().restaurantsById`). */
export type RestaurantContactLookup = ReadonlyMap<
  string,
  { name?: string; phone?: string | null }
>;

export interface OrderMessage {
  restaurants: WhatsAppRestaurantSection[];
  /** What the customer pays: items − discount + delivery fee. */
  total: number;
  deliveryAddress: string;
  customerName?: string;
  instructions?: string;
  deliveryMethod?: 'pickup' | 'delivery';
  discountCode?: string;
  discountName?: string;
  discountAmount?: number;
  deliveryFee: number;
  tax?: number;
  scheduledTime?: string;
  /** False when saving the order failed, so staff know to record it. */
  savedToServer?: boolean;
  /**
   * D12: the checkout was split into one order per restaurant (pickup from
   * two or more restaurants). Each section is listed as its own order, with
   * its `orderId`.
   */
  separateOrders?: boolean;
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/** ₹ amount: whole rupees without decimals, else 2 decimals. */
export const formatRupees = (amount: number): string => {
  const rounded = roundMoney(amount);
  return `₹${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}`;
};

const toItemLine = (item: CartItem): WhatsAppItemLine => ({
  name: item.name,
  quantity: item.quantity,
  price: roundMoney(item.price * item.quantity),
  size: item.option?.size,
  style: item.option?.style,
  base: item.option?.base,
  isFreeClaim: Boolean(item.isFreeClaim),
  isPromotionalAddon: Boolean(item.isPromotionalAddon),
});

/**
 * Fallback grouping (order not saved, or a legacy response without
 * `restaurantOrders`): the cart grouped by restaurant, in the order the
 * restaurants were first added. Phones come from the restaurants cache.
 */
export const buildRestaurantSectionsFromCart = (
  cartItems: CartItem[],
  contacts?: RestaurantContactLookup
): WhatsAppRestaurantSection[] =>
  groupCartByRestaurant(cartItems).map((group) => {
    const contact = contacts?.get(group.restaurantId);
    return {
      restaurantId: group.restaurantId,
      name: contact?.name || group.restaurantName,
      phone: contact?.phone ?? null,
      items: group.items.map(toItemLine),
      subtotal: roundMoney(group.subtotal),
    };
  });

/**
 * Sections from the server's `restaurantOrders` (names, phones and order as
 * snapshotted on the order), with the cart's lines and prices (§5.6: display
 * cart prices, not the server subtotal, which counts free claims and promo
 * add-ons at full price). Each cart line goes to the restaurant the server
 * put its food item under. Without `restaurantOrders`, the cart is grouped.
 */
export const buildRestaurantSectionsFromOrder = (
  restaurantOrders: PublicRestaurantOrder[] | null | undefined,
  cartItems: CartItem[],
  contacts?: RestaurantContactLookup
): WhatsAppRestaurantSection[] => {
  if (!restaurantOrders || restaurantOrders.length === 0) {
    return buildRestaurantSectionsFromCart(cartItems, contacts);
  }

  const ownerByFoodItemId = new Map<string, string>();
  const sectionsById = new Map<string, WhatsAppRestaurantSection>();
  const sections: WhatsAppRestaurantSection[] = [];

  restaurantOrders.forEach((restaurantOrder) => {
    restaurantOrder.items?.forEach((item) =>
      ownerByFoodItemId.set(item.foodItemId, restaurantOrder.restaurantId)
    );
    const section: WhatsAppRestaurantSection = {
      restaurantId: restaurantOrder.restaurantId,
      name: restaurantOrder.restaurantName,
      phone:
        restaurantOrder.restaurantPhone ??
        contacts?.get(restaurantOrder.restaurantId)?.phone ??
        null,
      items: [],
      subtotal: 0,
    };
    sectionsById.set(section.restaurantId, section);
    sections.push(section);
  });

  cartItems.forEach((item) => {
    const restaurantId =
      ownerByFoodItemId.get(item.id) ?? getCartItemRestaurantId(item);
    let section = sectionsById.get(restaurantId);
    if (!section) {
      // Not expected: the server groups every item. Keep the line anyway.
      const contact = contacts?.get(restaurantId);
      section = {
        restaurantId,
        name: contact?.name || item.restaurantName || restaurantId,
        phone: contact?.phone ?? null,
        items: [],
        subtotal: 0,
      };
      sectionsById.set(restaurantId, section);
      sections.push(section);
    }
    const line = toItemLine(item);
    section.items.push(line);
    section.subtotal = roundMoney(section.subtotal + line.price);
  });

  return sections.filter((section) => section.items.length > 0);
};

/**
 * D12 split pickup: the sections of every order in `groupOrders` (cart
 * prices, as for a consolidated order), each tagged with the id of the order
 * its restaurant was placed as. Sections keep the server's order.
 */
export const buildSplitOrderSections = (
  groupOrders: PublicOrder[],
  cartItems: CartItem[],
  contacts?: RestaurantContactLookup
): WhatsAppRestaurantSection[] => {
  const orderIdByRestaurant = new Map<string, string>();
  groupOrders.forEach((order) => {
    order.restaurantOrders?.forEach((restaurantOrder) => {
      if (!orderIdByRestaurant.has(restaurantOrder.restaurantId)) {
        orderIdByRestaurant.set(restaurantOrder.restaurantId, order.id);
      }
    });
    order.items?.forEach((item) => {
      if (item.restaurantId && !orderIdByRestaurant.has(item.restaurantId)) {
        orderIdByRestaurant.set(item.restaurantId, order.id);
      }
    });
  });

  const restaurantOrders = groupOrders.flatMap(
    (order) => order.restaurantOrders ?? []
  );
  return buildRestaurantSectionsFromOrder(
    restaurantOrders,
    cartItems,
    contacts
  ).map((section) => ({
    ...section,
    orderId: orderIdByRestaurant.get(section.restaurantId) ?? null,
  }));
};

const formatScheduledTime = (time: string): string => {
  const [hoursText, minutes] = time.split(':');
  const hours = Number(hoursText);

  if (Number.isNaN(hours) || !minutes) {
    return time;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${minutes} ${period}`;
};

const formatItemLine = (item: WhatsAppItemLine): string => {
  const options = [item.size, item.style, item.base].filter(Boolean);
  const name = options.length
    ? `${item.name} (${options.join(', ')})`
    : item.name;
  let price = formatRupees(item.price);
  if (item.isFreeClaim) {
    price = 'FREE';
  } else if (item.isPromotionalAddon) {
    price = `${price} (Deal)`;
  }
  return `• ${name} x${item.quantity} - ${price}`;
};

const formatRestaurantSection = (section: WhatsAppRestaurantSection) => {
  const heading = section.phone
    ? `🏪 *${section.name}* · 📞 ${section.phone}`
    : `🏪 *${section.name}*`;
  return [
    heading,
    ...section.items.map(formatItemLine),
    `_Subtotal: ${formatRupees(section.subtotal)}_`,
  ].join('\n');
};

/** D12: each restaurant as its own numbered order, with the order id. */
const formatSeparateOrders = (sections: WhatsAppRestaurantSection[]) => {
  const count = sections.length;
  const orders = sections.map((section, index) => {
    const heading = section.orderId
      ? `*Order ${index + 1} of ${count}* · ID: ${section.orderId}`
      : `*Order ${index + 1} of ${count}*`;
    return `${heading}\n${formatRestaurantSection(section)}`;
  });
  return `*${count} separate orders (one per restaurant):*

${orders.join('\n\n')}`;
};

/**
 * Format the order for WhatsApp (sent to the platform number): items grouped
 * under restaurant headings with phone and subtotal, then items total,
 * discount, delivery fee and the grand total the customer pays. For a split
 * pickup (`separateOrders`), each restaurant is listed as its own order with
 * its id; the totals below cover all of them.
 */
export const formatOrderMessage = (order: OrderMessage): string => {
  const itemsTotal = order.restaurants.reduce(
    (sum, section) => sum + section.subtotal,
    0
  );
  const itemsBlock = order.separateOrders
    ? formatSeparateOrders(order.restaurants)
    : `*Items:*

${order.restaurants.map(formatRestaurantSection).join('\n\n')}`;

  let message = `🍕 *Order via Grokheads*

*Customer:* ${order.customerName || 'Guest'}

${itemsBlock}`;

  if (order.deliveryMethod === 'pickup') {
    const pickupFrom = order.restaurants.map((section) => section.name);
    message += `

*Order Type:* Pickup 🎉
*Pickup From:* ${pickupFrom.length ? pickupFrom.join(', ') : 'Restaurant'}`;
  } else {
    message += `

*Delivery Address:*
${order.deliveryAddress}`;
  }

  if (order.scheduledTime) {
    message += `

*Scheduled For:* ${formatScheduledTime(order.scheduledTime)}`;
  }

  message += `

*Items Total:* ${formatRupees(itemsTotal)}`;

  if (order.discountAmount && order.discountAmount > 0) {
    message += `
*Discount Applied:* ${order.discountName || 'Offer'}${
      order.discountCode ? ` (${order.discountCode})` : ''
    }
*Discount Value:* -${formatRupees(order.discountAmount)}`;
  }

  if (order.tax && order.tax > 0) {
    message += `
*Tax (shown only, not charged):* ~${formatRupees(order.tax)}~`;
  }

  message += `
*Delivery Fee:* ${
    order.deliveryFee > 0 ? formatRupees(order.deliveryFee) : 'Free'
  }`;

  message += order.separateOrders
    ? `

*Total to pay (all ${order.restaurants.length} orders): ${formatRupees(
        order.total
      )}*`
    : `

*Total: ${formatRupees(order.total)}*`;

  if (order.instructions && order.instructions.trim()) {
    message += `

*Special Instructions:*
${order.instructions.trim()}`;
  }

  if (order.savedToServer === false) {
    message += `

⚠️ _This order could not be saved in the app. Please record it manually._`;
  }

  message += order.separateOrders
    ? '\n\nPlease confirm these orders. Thank you! 🙏'
    : '\n\nPlease confirm this order. Thank you! 🙏';

  return message;
};

/**
 * Generate WhatsApp link with pre-filled message (iOS-compatible)
 */
export const getWhatsAppLink = (
  phoneNumber: string,
  message: string
): string => {
  // Remove any special characters from phone number except +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  // Ensure it starts with country code (91 for India)
  const formattedPhone = cleanPhone.startsWith('+')
    ? cleanPhone
    : `+91${cleanPhone}`;

  // Encode message for URL - handle special characters properly
  const encodedMessage = encodeURIComponent(message);

  // Use the wa.me URL which works on both iOS and Android
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

/**
 * Open WhatsApp with order message (PopUp blocker bypass)
 * Strategy:
 * 1. Try window.open() first (works on most devices)
 * 2. If blocked on iOS, use window.location as fallback
 */
export const openWhatsApp = (phoneNumber: string, message: string): void => {
  const link = getWhatsAppLink(phoneNumber, message);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Try to open in new tab (most reliable, preserves app context)
  const newWindow = window.open(link, '_blank');

  // Fallback for iOS popup blockers: redirect to WhatsApp
  // This only triggers if window.open() was blocked and didn't return a window object
  if (!newWindow && isIOS) {
    window.location.href = link;
  }
};

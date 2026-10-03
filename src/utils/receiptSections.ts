/**
 * Receipt layout (task 5.4): cart lines grouped by restaurant, in the order
 * the restaurants were first added, with a subtotal per restaurant.
 */
import { CartItem } from '../types';
import { DEFAULT_RESTAURANT_ID } from '../types/marketplace';
import { groupCartByRestaurant } from './cartUtils';

export interface ReceiptLine {
  key: string;
  name: string;
  /** e.g. `Full x2 @ ₹250` */
  detail: string;
  amount: number;
}

export interface ReceiptSection {
  restaurantId: string;
  restaurantName: string;
  lines: ReceiptLine[];
  subtotal: number;
}

export interface ReceiptLayout {
  sections: ReceiptSection[];
  /** Restaurant headings: shown unless it's a Bob's-only receipt. */
  showHeadings: boolean;
  /** Per-restaurant subtotals: only useful with more than one restaurant. */
  showSubtotals: boolean;
}

const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const lineDetail = (item: CartItem): string => {
  const variant = [item.option?.size, item.option?.style, item.option?.base]
    .filter(Boolean)
    .join(' ');
  const price = item.isFreeClaim && !item.price ? 'FREE' : `₹${item.price}`;
  return `${variant ? `${variant} ` : ''}x${item.quantity} @ ${price}`;
};

/** Groups receipt lines by restaurant (items without one count as Bob's). */
export const buildReceiptLayout = (items: CartItem[]): ReceiptLayout => {
  const sections = groupCartByRestaurant(items).map((group) => ({
    restaurantId: group.restaurantId,
    restaurantName: group.restaurantName,
    subtotal: round2(group.subtotal),
    lines: group.items.map((item, idx) => ({
      key: `${group.restaurantId}-${item.id}-${idx}`,
      name: item.name,
      detail: lineDetail(item),
      amount: round2(item.price * item.quantity),
    })),
  }));
  const multiple = sections.length > 1;
  return {
    sections,
    showHeadings:
      multiple ||
      (sections.length === 1 &&
        sections[0].restaurantId !== DEFAULT_RESTAURANT_ID),
    showSubtotals: multiple,
  };
};

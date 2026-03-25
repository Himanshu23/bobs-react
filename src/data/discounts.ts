export interface Discount {
  id: string;
  name: string;
  description: string;
  minValue: number; // Minimum cart value to apply discount
  percent: number; // Percentage discount (0 if using fixedValue)
  fixedValue: number; // Fixed discount amount (0 if using percent)
  maxCap: number; // Maximum discount cap
  code?: string; // Optional promo code
  active: boolean;
}

export const DISCOUNTS: Discount[] = [
  {
    id: 'welcome-10',
    name: 'Online Discount',
    description: 'Get 10% off on your online order',
    minValue: 0,
    percent: 10,
    fixedValue: 0,
    maxCap: 100,
    code: 'ONLINE10',
    active: true,
  },
];

/**
 * Calculate discount amount based on discount config and cart total
 * @param discount - Discount configuration
 * @param cartTotal - Total cart value
 * @returns Discount amount to be applied
 */
export const calculateDiscountAmount = (
  discount: Discount,
  cartTotal: number
): number => {
  // Check if cart value meets minimum requirement
  if (cartTotal < discount.minValue) {
    return 0;
  }

  let discountAmount = 0;

  if (discount.percent > 0) {
    // Calculate percentage-based discount
    discountAmount = (cartTotal * discount.percent) / 100;
  } else if (discount.fixedValue > 0) {
    // Use fixed discount amount
    discountAmount = discount.fixedValue;
  }

  // Apply maximum cap
  if (discountAmount > discount.maxCap) {
    discountAmount = discount.maxCap;
  }

  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
};

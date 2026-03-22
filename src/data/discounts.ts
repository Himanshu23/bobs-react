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
    name: 'Welcome Discount',
    description: 'Get 10% off on your first order',
    minValue: 0,
    percent: 10,
    fixedValue: 0,
    maxCap: 100,
    code: 'WELCOME10',
    active: true,
  },
  {
    id: 'bulk-15',
    name: 'Bulk Order Discount',
    description: '15% off on orders above ₹500',
    minValue: 500,
    percent: 15,
    fixedValue: 0,
    maxCap: 200,
    active: true,
  },
  {
    id: 'party-20',
    name: 'Party Special',
    description: '20% off on orders above ₹1000',
    minValue: 1000,
    percent: 20,
    fixedValue: 0,
    maxCap: 300,
    code: 'PARTY20',
    active: true,
  },
  {
    id: 'festive-fixed-100',
    name: 'Festive Flat Discount',
    description: 'Flat ₹100 off on orders above ₹400',
    minValue: 400,
    percent: 0,
    fixedValue: 100,
    maxCap: 100,
    code: 'FESTIVE100',
    active: true,
  },
  {
    id: 'loyalty-5',
    name: 'Loyalty Reward',
    description: '5% loyalty discount',
    minValue: 0,
    percent: 5,
    fixedValue: 0,
    maxCap: 150,
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

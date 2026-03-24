import { FoodItem } from '../types';

/**
 * Get the lowest now price from all available sizes
 */
export const getLowestNowPrice = (item: FoodItem): number | undefined => {
  const prices = Object.values(item.priceOptions.nowPrice.size).filter(
    (price): price is number => price !== undefined
  );
  return prices.length > 0 ? Math.min(...prices) : 0;
};

/**
 * Get the lowest was price from all available sizes
 */
export const getLowestWasPrice = (item: FoodItem): number | undefined => {
  if (!item.priceOptions.wasPrice) return undefined;
  const prices = Object.values(item.priceOptions.wasPrice.size).filter(
    (price): price is number => price !== undefined
  );
  return prices.length > 0 ? Math.min(...prices) : undefined;
};

/**
 * Get price for a specific size
 */
export const getPriceForSize = (
  item: FoodItem,
  size: string
): { wasPrice?: number; nowPrice?: number } => {
  const wasSize = size as keyof typeof item.priceOptions.wasPrice.size;
  const nowSize = size as keyof typeof item.priceOptions.nowPrice.size;
  return {
    wasPrice: item.priceOptions.wasPrice?.size[wasSize],
    nowPrice: item.priceOptions.nowPrice.size[nowSize],
  };
};

/**
 * Format price display as "₹XX"
 */
export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(0)}`;
};

/**
 * Get price display text with was and now prices
 * Returns: "₹199" if no was price, or "₹313 ₹199" if was price exists
 */
export const getPriceDisplayText = (item: FoodItem, size?: string): string => {
  let nowPrice: number | undefined;
  let wasPrice: number | undefined;

  if (size) {
    const sizePrice = getPriceForSize(item, size);
    nowPrice = sizePrice.nowPrice;
    wasPrice = sizePrice.wasPrice;
  } else {
    nowPrice = getLowestNowPrice(item);
    wasPrice = getLowestWasPrice(item);
  }

  if (!nowPrice) return 'N/A';

  if (wasPrice && wasPrice > nowPrice) {
    return `${formatPrice(wasPrice)} ${formatPrice(nowPrice)}`;
  }
  return formatPrice(nowPrice);
};

/**
 * Calculate discount percentage between was and now price
 */
export const calculateDiscount = (
  wasPrice: number | undefined,
  nowPrice: number | undefined
): number | undefined => {
  if (!wasPrice || !nowPrice || wasPrice <= 0 || nowPrice >= wasPrice) {
    return undefined;
  }
  return Math.round(((wasPrice - nowPrice) / wasPrice) * 100);
};

/**
 * Get discount percentage for lowest prices
 */
export const getLowestPriceDiscount = (item: FoodItem): number | undefined => {
  const wasPrice = getLowestWasPrice(item);
  const nowPrice = getLowestNowPrice(item);
  return calculateDiscount(wasPrice, nowPrice);
};

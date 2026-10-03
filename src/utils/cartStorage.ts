import { CartItem } from '../types';
import { normalizeCartItem } from './cartUtils';

const CART_STORAGE_KEY = 'bob_cart_items';

/**
 * Save cart items to localStorage
 */
export const saveCartToLocalStorage = (items: CartItem[]): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

const isCartItemLike = (value: unknown): value is CartItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.price === 'number' &&
    Number.isFinite(item.price) &&
    typeof item.quantity === 'number' &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
};

const RESTAURANT_FIELDS = [
  'restaurantId',
  'restaurantName',
  'marketId',
] as const;

/** Drops restaurant fields that aren't non-empty strings, so they get refilled. */
const withoutInvalidRestaurantFields = (item: CartItem): CartItem => {
  const invalid = RESTAURANT_FIELDS.filter(
    (field) =>
      field in item && (typeof item[field] !== 'string' || !item[field])
  );
  if (invalid.length === 0) {
    return item;
  }
  const cleaned: CartItem = { ...item };
  invalid.forEach((field) => {
    delete cleaned[field];
  });
  return cleaned;
};

/**
 * Migrates a saved cart to the multi-restaurant shape. Carts saved before
 * restaurants existed have no `restaurantId`: those items become Bob's
 * (`bobs` / "Bob's" / `market1`). Entries without a string id, a finite
 * price and a positive whole quantity are dropped.
 */
export const migrateStoredCart = (saved: unknown): CartItem[] => {
  if (!Array.isArray(saved)) {
    return [];
  }
  return saved
    .filter(isCartItemLike)
    .map(withoutInvalidRestaurantFields)
    .map(normalizeCartItem);
};

/**
 * Retrieve cart items from localStorage (migrated to the current shape)
 */
export const getCartFromLocalStorage = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? migrateStoredCart(JSON.parse(saved)) : [];
  } catch (error) {
    console.error('Failed to retrieve cart from localStorage:', error);
    return [];
  }
};

/**
 * Clear cart from localStorage
 */
export const clearCartFromLocalStorage = (): void => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear cart from localStorage:', error);
  }
};

/**
 * Get cart size from localStorage without parsing full data
 */
export const getCartSizeFromStorage = (): number => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    const items = saved ? JSON.parse(saved) : [];
    return items.length;
  } catch {
    return 0;
  }
};

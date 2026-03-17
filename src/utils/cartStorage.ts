import { CartItem } from '../types';

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

/**
 * Retrieve cart items from localStorage
 */
export const getCartFromLocalStorage = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
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

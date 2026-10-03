import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './store'; // Adjust the path to your store definition
import { ItemOptions } from '../types';
import { getCartItemRestaurantId } from '../utils/cartUtils';

// Food Items Selectors
const selectFoodItems = (state: RootState) => state.food.items;

// Selector to get a food item by ID
export const selectFoodItemById = (id: string) =>
  createSelector([selectFoodItems], (foodItems) =>
    foodItems.find((item) => item.id === id)
  );

// Cart Items Selectors
// Selector to get all cart items
const selectCartItems = (state: RootState) => state.cart.items;

// Selector to find a specific cart item by ID (returns first match)
export const selectCartItemById = (id: string) =>
  createSelector([selectCartItems], (cartItems) =>
    cartItems.find((item) => item.id === id)
  );

// Selector to find a specific cart item by ID and option (uniquely identifies a variant)
export const selectCartItemByIdAndOption = (id: string, option?: ItemOptions) =>
  createSelector([selectCartItems], (cartItems) =>
    cartItems.find(
      (item) =>
        item.id === id &&
        item.option?.size === option?.size &&
        item.option?.style === option?.style &&
        item.option?.base === option?.base
    )
  );

// Selector to get total quantity of a product across all variants.
// Pass restaurantId to count only that restaurant's lines.
export const selectProductTotalQuantity = (id: string, restaurantId?: string) =>
  createSelector([selectCartItems], (cartItems) => {
    const variants = cartItems.filter(
      (item) =>
        item.id === id &&
        (restaurantId === undefined ||
          getCartItemRestaurantId(item) === restaurantId)
    );
    return variants.reduce((total, item) => total + item.quantity, 0);
  });

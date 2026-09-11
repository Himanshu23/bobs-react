import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import foodReducer from './foodSlice';
import { CartItem, ItemOptions } from '../types';
import {
  saveCartToLocalStorage,
  getCartFromLocalStorage,
} from '../utils/cartStorage';

// Define cart state type
interface CartState {
  items: CartItem[];
  totalItems: number;
}

// Initial state - Load from localStorage if available
const savedItems = getCartFromLocalStorage();
const initialState: CartState = {
  items: savedItems,
  totalItems: savedItems.reduce((sum, item) => sum + item.quantity, 0),
};

const findItem = (
  items: CartItem[],
  item: {
    id: string;
    option: ItemOptions;
    isFreeClaim?: boolean;
    isPromotionalAddon?: boolean;
  }
) => {
  const { id, option, isFreeClaim, isPromotionalAddon } = item;
  return items.find(
    (cartItem) =>
      cartItem.id === id &&
      cartItem.option?.base === option?.base &&
      cartItem.option?.size === option?.size &&
      cartItem.option?.style === option?.style &&
      (isFreeClaim === undefined || cartItem.isFreeClaim === isFreeClaim) &&
      (isPromotionalAddon === undefined ||
        cartItem.isPromotionalAddon === isPromotionalAddon)
  );
};

const findItemIndex = (
  items: CartItem[],
  item: {
    id: string;
    option: ItemOptions;
    isFreeClaim?: boolean;
    isPromotionalAddon?: boolean;
  }
) => {
  const { id, option, isFreeClaim, isPromotionalAddon } = item;
  return items.findIndex(
    (cartItem) =>
      cartItem.id === id &&
      cartItem.option?.base === option?.base &&
      cartItem.option?.size === option?.size &&
      cartItem.option?.style === option?.style &&
      (isFreeClaim === undefined || cartItem.isFreeClaim === isFreeClaim) &&
      (isPromotionalAddon === undefined ||
        cartItem.isPromotionalAddon === isPromotionalAddon)
  );
};
// Create slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const {
        id,
        name,
        price,
        image,
        quantity,
        option,
        description,
        product,
        isFreeClaim,
        isPromotionalAddon,
        originalPrice,
      } = action.payload;
      const existingItem = findItem(state.items, {
        id,
        option,
        isFreeClaim,
        isPromotionalAddon,
      });
      if (existingItem) {
        if (isPromotionalAddon) {
          return;
        }
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          id,
          name,
          price,
          image,
          quantity,
          option,
          description,
          product,
          isFreeClaim,
          isPromotionalAddon,
          originalPrice,
        });
      }

      state.totalItems += quantity;
      // Save to localStorage
      saveCartToLocalStorage(state.items);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{
        id: string;
        option: ItemOptions;
        quantity: number;
        isFreeClaim?: boolean;
        isPromotionalAddon?: boolean;
      }>
    ) => {
      const { id, option, quantity, isFreeClaim, isPromotionalAddon } =
        action.payload;
      const item = findItem(state.items, {
        id,
        option,
        isFreeClaim,
        isPromotionalAddon,
      });

      if (item) {
        state.totalItems += quantity - item.quantity;
        item.quantity = quantity;
        // Save to localStorage
        saveCartToLocalStorage(state.items);
      }
    },
    removeFromCart: (
      state,
      action: PayloadAction<{
        id: string;
        option: ItemOptions;
        isFreeClaim?: boolean;
        isPromotionalAddon?: boolean;
      }>
    ) => {
      const itemIndex = findItemIndex(state.items, action.payload);
      if (itemIndex !== -1) {
        const item = state.items[itemIndex];
        // Remove entire item completely regardless of quantity
        state.totalItems -= item.quantity;
        state.items.splice(itemIndex, 1);
        // Save to localStorage
        saveCartToLocalStorage(state.items);
      }
    },
    removePromotionalAddons: (state) => {
      const promotionalItems = state.items.filter(
        (item) => item.isPromotionalAddon
      );

      if (promotionalItems.length === 0) return;

      state.totalItems -= promotionalItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.items = state.items.filter((item) => !item.isPromotionalAddon);
      saveCartToLocalStorage(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      // Clear localStorage
      saveCartToLocalStorage([]);
    },
  },
});

// Export actions
export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  removePromotionalAddons,
  clearCart,
} =
  cartSlice.actions;

// Configure store with types
const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    food: foodReducer,
  },
});

// **Define RootState and AppDispatch types**
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

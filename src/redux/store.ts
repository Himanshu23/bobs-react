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
  item: { id: string; option: ItemOptions }
) => {
  const { id, option } = item;
  return items.find(
    (item) =>
      item.id === id &&
      item.option?.base === option?.base &&
      item.option?.size === option?.size &&
      item.option?.style === option?.style
  );
};

const findItemIndex = (
  items: CartItem[],
  item: { id: string; option: ItemOptions }
) => {
  const { id, option } = item;
  return items.findIndex(
    (item) =>
      item.id === id &&
      item.option?.base === option?.base &&
      item.option?.size === option?.size &&
      item.option?.style === option?.style
  );
};
// Create slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const { id, name, price, image, quantity, option, description, product } =
        action.payload;
      const existingItem = findItem(state.items, { id, option });
      if (existingItem) {
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
      }>
    ) => {
      const { id, option, quantity } = action.payload;
      const item = findItem(state.items, { id, option });

      if (item) {
        state.totalItems += quantity - item.quantity;
        item.quantity = quantity;
        // Save to localStorage
        saveCartToLocalStorage(state.items);
      }
    },
    removeFromCart: (
      state,
      action: PayloadAction<{ id: string; option: ItemOptions }>
    ) => {
      const itemIndex = findItemIndex(state.items, action.payload);
      if (itemIndex !== -1) {
        const item = state.items[itemIndex];
        if (item.quantity === 1) {
          // Remove item completely if quantity is 1
          state.totalItems -= 1;
          state.items.splice(itemIndex, 1);
        } else {
          // Decrement quantity by 1
          item.quantity -= 1;
          state.totalItems -= 1;
        }
        // Save to localStorage
        saveCartToLocalStorage(state.items);
      }
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
export const { addToCart, updateQuantity, removeFromCart, clearCart } =
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

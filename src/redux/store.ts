import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import foodReducer from './foodSlice';
import { CartItem, ItemOptions } from '../types';
import {
  saveCartToLocalStorage,
  getCartFromLocalStorage,
} from '../utils/cartStorage';
import {
  CartLineKey,
  findCartLineIndex,
  isSameCartLine,
  normalizeCartItem,
} from '../utils/cartUtils';

// Define cart state type
interface CartState {
  items: CartItem[];
  totalItems: number;
}

// Initial state - Load from localStorage if available (migrated on read)
const savedItems = getCartFromLocalStorage();
const initialState: CartState = {
  items: savedItems,
  totalItems: savedItems.reduce((sum, item) => sum + item.quantity, 0),
};

const findItem = (items: CartItem[], key: CartLineKey) =>
  items.find((cartItem) => isSameCartLine(cartItem, key));

/** Adds a line, or increases the quantity of the matching line. */
const addLine = (state: CartState, payload: CartItem) => {
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
    restaurantId,
    restaurantName,
    marketId,
  } = normalizeCartItem(payload);
  // Flags are exact here (missing = false): a regular add must never merge
  // into a promo or free-claim line of the same dish.
  const existingItem = findItem(state.items, {
    id,
    option,
    isFreeClaim: !!isFreeClaim,
    isPromotionalAddon: !!isPromotionalAddon,
    restaurantId,
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
      restaurantId,
      restaurantName,
      marketId,
    });
  }

  state.totalItems += quantity;
};

// Create slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      addLine(state, action.payload);
      // Save to localStorage
      saveCartToLocalStorage(state.items);
    },
    /** Market guard (D5) "start a new cart": empty the cart, then add the item. */
    startNewCartWith: (state, action: PayloadAction<CartItem>) => {
      state.items = [];
      state.totalItems = 0;
      addLine(state, action.payload);
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
        restaurantId?: string;
      }>
    ) => {
      const { quantity, ...key } = action.payload;
      const item = findItem(state.items, key);

      if (item) {
        state.totalItems += quantity - item.quantity;
        item.quantity = quantity;
        // Save to localStorage
        saveCartToLocalStorage(state.items);
      }
    },
    removeFromCart: (state, action: PayloadAction<CartLineKey>) => {
      const itemIndex = findCartLineIndex(state.items, action.payload);
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
  startNewCartWith,
  updateQuantity,
  removeFromCart,
  removePromotionalAddons,
  clearCart,
} = cartSlice.actions;

/** Cart reducer, exported for unit tests. */
export const cartReducer = cartSlice.reducer;

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

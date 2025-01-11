import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import foodReducer from './foodSlice';
import { CartItem, ItemOptions } from '../types';


// Define cart state type
interface CartState {
  items: CartItem[];
  totalItems: number;
}

// Initial state
const initialState: CartState = {
  items: [],
  totalItems: 0
};

// Create slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const { id, name, price, image, quantity, option } = action.payload;
      const existingItem = state.items.find(item => item.id === id && item.option === option);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          id, name, price, image, quantity, option,
          description: '',
        });
      }

      state.totalItems += quantity;
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; option: ItemOptions; quantity: number }>) => {
      const { id, option, quantity } = action.payload;
      const item = state.items.find(item => item.id === id && item.option === option.base);

      if (item) {
        state.totalItems += quantity - item.quantity;
        item.quantity = quantity;
      }
    },
    removeFromCart: (state, action: PayloadAction<{ id: string; option: ItemOptions }>) => {
      const { id, option } = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === id && item.option === option);

      if (itemIndex !== -1) {
        state.totalItems -= state.items[itemIndex].quantity;
        state.items.splice(itemIndex, 1);
      }
    }
  }
});

// Export actions
export const { addToCart, updateQuantity, removeFromCart } = cartSlice.actions;

// Configure store with types
const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    food: foodReducer
  }
});

// **Define RootState and AppDispatch types**
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

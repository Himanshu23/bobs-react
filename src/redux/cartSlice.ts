import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  totalQuantity: number;
}

const initialState: CartState = {
  items: [],
  totalQuantity: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      const item = action.payload;
      const existingItem = state.items.find(item => item.id === item.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push(item);
      }

      state.totalQuantity += 1;
    },
    removeItem(state, action: PayloadAction<number>) {
      const id = action.payload;
      const existingItem = state.items.find(item => item.id === item.id);

      if (existingItem) {
        if (existingItem.quantity === 1) {
          state.items = state.items.filter(item => item.id !== item.id);
        } else {
          existingItem.quantity -= 1;
        }

        state.totalQuantity -= 1;
      }
    },
    clearCart(state) {
      state.items = [];
      state.totalQuantity = 0;
    },
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

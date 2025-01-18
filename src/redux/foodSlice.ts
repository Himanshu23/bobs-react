import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { FoodItem } from '../types';
import foodItems from '../data/foodItems';

interface FoodState {
  items: FoodItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Mock API call
const fetchFoodItems = createAsyncThunk('food/fetchFoodItems', async () => {
  return new Promise<FoodItem[]>(
    (resolve) =>
      setTimeout(() => {
        resolve(foodItems.foodItems);
      }, 1000) // Mocking API delay
  );
});

const initialState: FoodState = {
  items: [],
  status: 'idle',
  error: null,
};

const foodSlice = createSlice({
  name: 'food',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFoodItems.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFoodItems.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchFoodItems.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch food items';
      });
  },
});

export default foodSlice.reducer;
export { fetchFoodItems }; // Only export once

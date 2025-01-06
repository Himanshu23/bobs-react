import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store'; // Add RootState and AppDispatch imports
import { fetchFoodItems } from '../redux/foodSlice';
import { FoodItem } from '../types'; // Add a type for food item
import FoodItemCard from '../components/foodItemCard';

const FoodListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { items, status, error } = useSelector((state: RootState) => state.food);
  
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchFoodItems());
    }
  }, [status, dispatch]);

  const handleAddToCart = (foodItem: FoodItem) => {
    navigate(`/product`, { state: { product: foodItem } });
  };

  if (status === 'loading') {
    return <CircularProgress />;
  }

  if (status === 'failed') {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', padding: 3 }}>
      {items.map((food: FoodItem) => (
        <FoodItemCard  item={food} onAddToCart={handleAddToCart} />
      ))}
    </Box>
  );
};

export default FoodListPage;

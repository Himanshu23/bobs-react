import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store'; // Add RootState and AppDispatch imports
import { fetchFoodItems } from '../redux/foodSlice';
import { FoodItem } from '../types'; // Add a type for food item
import FoodItemCard from '../components/foodItemCard';
import ProductDetailModal from '../components/productDetail';
import QuantityUpdate from '../components/quantityUpdate';

const FoodListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  
  const { items, status, error } = useSelector((state: RootState) => state.food);
  const [productDetailModal, setProductDetailModal] = useState(false);
  const [quantityUpdateModal, setQuantityUpdateModal] = useState(false);
  const [quantityUpdateItem, setquantityUpdateItem] = useState<FoodItem>();
  const [product, setProduct] = useState<FoodItem>();

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchFoodItems());
    }
  }, [status, dispatch]);

  const handleAddToCart = (foodItem: FoodItem) => {
    if(cartItems.find(el => el.id === foodItem.id)) {
      setQuantityUpdateModal(true);
      setquantityUpdateItem(foodItem);
    } else {
    setProductDetailModal(true);
    setProduct(foodItem);
    }
 };

 const handleQuantityUpdateClose = () => {
  setQuantityUpdateModal(false);
  setquantityUpdateItem(undefined);
 }

  if (status === 'loading') {
    return <CircularProgress />;
  }

  if (status === 'failed') {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', padding: 3 }}>
      {items.map((food: FoodItem) => (
        <FoodItemCard  key={`list_${food.id}`} item={food} onAddToCart={handleAddToCart} />
      ))}
    </Box>
    {productDetailModal && product && <ProductDetailModal
     open={productDetailModal}
     onClose={() => setProductDetailModal(false)}
     product={product}
   />}
   {quantityUpdateModal && quantityUpdateItem &&
    <QuantityUpdate open={quantityUpdateModal} item={quantityUpdateItem} onClose={() => handleQuantityUpdateClose()} />
   }
   </>
  );
};

export default FoodListPage;



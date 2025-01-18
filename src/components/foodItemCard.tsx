import React from 'react';
import { Box, Typography, Button, Rating } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material'; // Veg & Non-Veg Icons
import { FoodItem } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { QuantityButtons } from './quantityButton';

interface FoodItemCardProps {
  item: FoodItem;
  onAddToCart: (item: FoodItem) => void;
}

const FoodItemCard = ({ item, onAddToCart }: FoodItemCardProps) => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartItem = cartItems.find((el) => el.id === item.id);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 400,
        padding: 2,
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: 'white',
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {item.veg ? (
            <CheckCircle sx={{ color: 'green' }} />
          ) : (
            <Cancel sx={{ color: 'red' }} />
          )}
          <Typography variant="body1" fontWeight="bold">
            {item.name}
          </Typography>
        </Box>

        <Rating value={item.rating} precision={0.5} readOnly sx={{ my: 1 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {item.description}
        </Typography>

        {/* Was Now Price */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {item.wasPrice && (
            <Typography
              variant="body2"
              sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
            >
              ₹{item.wasPrice}
            </Typography>
          )}
          {item.nowPrice && (
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', color: 'primary.main' }}
            >
              ₹{item.nowPrice}
            </Typography>
          )}
        </Box>

        {cartItem ? (
          <Box sx={{ width: '50%' }}>
            <QuantityButtons
              product={item}
              onAddtoCart={() => onAddToCart(item)}
            ></QuantityButtons>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => onAddToCart(item)}
          >
            Add to Cart
          </Button>
        )}
      </Box>

      <Box
        component="img"
        src={item.image}
        alt={item.name}
        sx={{
          width: 100,
          height: 100,
          borderRadius: 1,
          objectFit: 'cover',
        }}
      />
    </Box>
  );
};

export default FoodItemCard;

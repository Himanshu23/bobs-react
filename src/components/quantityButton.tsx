import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { FoodItem } from '../types';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

interface QuantityButtonsProps {
  product: FoodItem;
  onAddtoCart: (foodItem: FoodItem) => void;
}
export const QuantityButtons = ({
  product,
  onAddtoCart,
}: QuantityButtonsProps) => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const quantity = cartItems.filter((el) => el.id === product.id)?.length ?? 0;

  return (
    <Card
      sx={{
        padding: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '55px',
        flexShrink: 0, // Prevents shrinking in flex container
      }}
    >
      <CardContent
        sx={{
          padding: '0px !important',
          textAlign: 'center',
          width: '50%',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <Button sx={{ minWidth: '30px', padding: '5px' }} onClick={() => {}}>
            -
          </Button>
          <Typography sx={{ minWidth: '30px' }}>{quantity}</Typography>
          <Button
            sx={{ minWidth: '30px', padding: '5px' }}
            onClick={() => onAddtoCart(product)}
          >
            +
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateQuantity, removeFromCart } from '../redux/store';
import { Box, Button, Typography, List, ListItem } from '@mui/material';
import { CartItem, ItemOptions } from '../types';

interface RootState {
  cart: {
    items: CartItem[];
  };
}

const CartPage: React.FC = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();

  const handleQuantityChange = (
    id: string,
    option: ItemOptions,
    newQuantity: number
  ) => {
    dispatch(updateQuantity({ id, option, quantity: newQuantity }));
  };

  const handleRemove = (id: string, option: ItemOptions) => {
    dispatch(removeFromCart({ id, option }));
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4">Your Cart</Typography>
      {cartItems.length === 0 ? (
        <Typography>Your cart is empty.</Typography>
      ) : (
        <List>
          {cartItems.map((item) => (
            <ListItem
              key={`${item.id}-${item.option}`}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <img
                src={item.image}
                alt={item.name}
                style={{ width: '80px', borderRadius: '5px' }}
              />
              <Box>
                <Typography variant="h6">{item.name}</Typography>
                <Typography>{item.option?.size}</Typography>
                <Typography>{item.option?.style}</Typography>
                <Typography>{item.option?.base}</Typography>
                <Typography>₹{item.price}</Typography>
              </Box>
              <Box>
                <Button
                  onClick={() =>
                    handleQuantityChange(
                      item.id,
                      item.option as ItemOptions,
                      Math.max(1, item.quantity - 1)
                    )
                  }
                >
                  -
                </Button>
                <Typography>{item.quantity}</Typography>
                <Button
                  onClick={() =>
                    handleQuantityChange(
                      item.id,
                      item.option as ItemOptions,
                      item.quantity + 1
                    )
                  }
                >
                  +
                </Button>
              </Box>
              <Button
                variant="contained"
                color="error"
                onClick={() =>
                  handleRemove(item.id, item.option as ItemOptions)
                }
              >
                Remove
              </Button>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default CartPage;

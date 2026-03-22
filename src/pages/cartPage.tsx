import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateQuantity, removeFromCart } from '../redux/store';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  Divider,
  Container,
} from '@mui/material';
import { CartItem, ItemOptions } from '../types';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';

interface RootState {
  cart: {
    items: CartItem[];
  };
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();

  const handleQuantityChange = (
    id: string,
    option: ItemOptions,
    newQuantity: number
  ) => {
    if (newQuantity > 0) {
      dispatch(updateQuantity({ id, option, quantity: newQuantity }));
    } else if (newQuantity === 0) {
      // Remove item when quantity reaches 0
      dispatch(removeFromCart({ id, option }));
    }
  };

  const handleRemove = (id: string, option: ItemOptions) => {
    dispatch(removeFromCart({ id, option }));
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const getOptionLabel = (item: CartItem): string => {
    const options = [];
    if (item.option?.size) options.push(item.option.size);
    if (item.option?.style) options.push(item.option.style);
    if (item.option?.base) options.push(item.option.base);
    return options.length > 0 ? options.join(', ') : 'Standard';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* <Typography variant="h6" sx={{ mb: 4, fontWeight: 'bold' }}>
        Your Cart
      </Typography> */}

      {cartItems.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
            Your cart is empty
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 3 }}>
            Add some delicious items to get started!
          </Typography>
          <Button variant="contained" href="/">
            Continue Shopping
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Cart Items Section */}
          <Grid item xs={12} md={8}>
            {cartItems.map((item) => (
              <Card
                key={`${item.id}-${JSON.stringify(item.option)}`}
                sx={{
                  display: 'flex',
                  mb: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                {/* Product Image */}
                <CardMedia
                  component="img"
                  sx={{
                    width: 120,
                    height: 120,
                    objectFit: 'cover',
                  }}
                  image={item.image}
                  alt={item.name}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).src = '/placeholder.jpg';
                  }}
                />

                {/* Product Details */}
                <CardContent
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {getOptionLabel(item)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 'bold', color: '#ff6b6b' }}
                      >
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ₹{item.price} each
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                    }}
                  >
                    {/* Quantity Controls */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #ddd',
                        borderRadius: 1,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleQuantityChange(
                            item.id,
                            item.option as ItemOptions,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography
                        sx={{ px: 2, minWidth: 30, textAlign: 'center' }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleQuantityChange(
                            item.id,
                            item.option as ItemOptions,
                            item.quantity + 1
                          )
                        }
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Delete Button - Removes entire item */}
                    <IconButton
                      color="error"
                      onClick={() =>
                        handleRemove(item.id, item.option as ItemOptions)
                      }
                      title="Delete entire item from cart"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Grid>

          {/* Order Summary Section */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography color="textSecondary">Subtotal:</Typography>
                  <Typography>₹{totalPrice.toFixed(2)}</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography color="textSecondary">Delivery:</Typography>
                  <Typography color="#4CAF50">Free</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography color="textSecondary">Tax (estimate):</Typography>
                  <Typography>₹{(totalPrice * 0.05).toFixed(2)}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Total:
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', color: '#ff6b6b' }}
                >
                  ₹{(totalPrice * 1.05).toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => navigate('/checkout')}
                sx={{
                  mb: 1,
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="outlined"
                fullWidth
                href="/"
                sx={{ textTransform: 'none' }}
              >
                Continue Shopping
              </Button>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default CartPage;

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  removePromotionalAddons,
  updateQuantity,
  removeFromCart,
} from '../redux/store';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Divider,
  Container,
  Chip,
} from '@mui/material';
import { CartItem, ItemOptions } from '../types';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { trackEvent } from '../utils/analytics';
import { usePromotionalAddons } from '../data/hooks/usePromotionalAddons';
import { useFoodItems } from '../data/hooks/useFoodItems';
import PromotionalAddonBanner from '../components/promotionalAddons/PromotionalAddonBanner';
import PromotionalAddonSection from '../components/promotionalAddons/PromotionalAddonSection';
import CartItemPriceDisplay from '../components/promotionalAddons/CartItemPriceDisplay';
import FoodImage from '../components/FoodImage';
import {
  getCartPromoSavings,
  getQualifyingCartSubtotal,
} from '../utils/promotionalAddonStrategy';

interface RootState {
  cart: {
    items: CartItem[];
  };
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const { data: menuItems = [] } = useFoodItems();

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const { data: promoData, isFetching: isPromoFetching } =
    usePromotionalAddons(cartItems);
  const promoSavings = getCartPromoSavings(cartItems);
  const qualifyingSubtotal = getQualifyingCartSubtotal(cartItems);

  useEffect(() => {
    if (promoData && !promoData.eligible && promoData.campaign.active) {
      dispatch(removePromotionalAddons());
    }
  }, [dispatch, promoData]);

  const handleQuantityChange = (
    id: string,
    option: ItemOptions,
    newQuantity: number,
    itemFlags?: { isPromotionalAddon?: boolean; isFreeClaim?: boolean }
  ) => {
    if (newQuantity > 0) {
      trackEvent('update_cart_quantity', {
        item_id: id,
        quantity: newQuantity,
        source: 'cart_page',
      });
      dispatch(
        updateQuantity({
          id,
          option,
          quantity: newQuantity,
          ...itemFlags,
        })
      );
    } else if (newQuantity === 0) {
      trackEvent('remove_from_cart', {
        item_id: id,
        source: 'cart_page',
      });
      dispatch(removeFromCart({ id, option, ...itemFlags }));
    }
  };

  const handleRemove = (
    id: string,
    option: ItemOptions,
    itemFlags?: { isPromotionalAddon?: boolean; isFreeClaim?: boolean }
  ) => {
    trackEvent('remove_from_cart', {
      item_id: id,
      source: 'cart_page',
    });
    dispatch(removeFromCart({ id, option, ...itemFlags }));
  };

  const handleProceedToCheckout = () => {
    trackEvent('begin_checkout', {
      item_count: cartItems.length,
      value: totalPrice,
    });
    navigate('/checkout');
  };

  const getItemKey = (item: CartItem) =>
    `${item.id}-${JSON.stringify(item.option)}-${item.isPromotionalAddon ? 'promo' : ''}-${item.isFreeClaim ? 'free' : ''}`;

  const getItemFlags = (item: CartItem) => ({
    isPromotionalAddon: item.isPromotionalAddon,
    isFreeClaim: item.isFreeClaim,
  });

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
          <Grid item xs={12}>
            <PromotionalAddonBanner
              promoData={promoData}
              cartSubtotal={qualifyingSubtotal}
            />
            <PromotionalAddonSection
              promoData={promoData}
              menuItems={menuItems}
              isUpdating={isPromoFetching}
            />
          </Grid>

          {/* Cart Items Section */}
          <Grid item xs={12} md={8}>
            {cartItems.map((item) => (
              <Card
                key={getItemKey(item)}
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
                <FoodImage
                  src={item.image}
                  alt={item.name}
                  size={120}
                  sx={{ borderRadius: 0 }}
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
                        {item.isPromotionalAddon && (
                          <Chip
                            label="₹9 Deal"
                            size="small"
                            sx={{
                              ml: 1,
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: '#e8f5e9',
                              color: '#2e7d32',
                            }}
                          />
                        )}
                      </Typography>
                    </Box>
                    <CartItemPriceDisplay item={item} showEach />
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
                            item.quantity - 1,
                            getItemFlags(item)
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
                            item.quantity + 1,
                            getItemFlags(item)
                          )
                        }
                        disabled={item.isPromotionalAddon && item.quantity >= 1}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Delete Button - Removes entire item */}
                    <IconButton
                      color="error"
                      onClick={() =>
                        handleRemove(
                          item.id,
                          item.option as ItemOptions,
                          getItemFlags(item)
                        )
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
                {promoSavings > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography color="#2e7d32">₹9 Deal savings:</Typography>
                    <Typography color="#2e7d32">
                      −₹{promoSavings.toFixed(0)}
                    </Typography>
                  </Box>
                )}
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
                onClick={handleProceedToCheckout}
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

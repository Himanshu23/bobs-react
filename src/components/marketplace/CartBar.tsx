import { Avatar, AvatarGroup, Box, Button, Typography } from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../redux/store';
import {
  getCartItemsTotal,
  getCartLineKey,
  groupCartByRestaurant,
} from '../../utils/cartUtils';

/**
 * Bottom padding a page needs so its last content isn't hidden behind the
 * cart bar: the bar (~80px incl. its padding), a 24px gap, and the phone's
 * bottom safe area (home indicator / gesture bar), which the bar also adds.
 */
export const CART_BAR_CLEARANCE =
  'calc(104px + env(safe-area-inset-bottom, 0px))';

/** Bottom padding when there's no cart bar: a gap plus the safe area. */
export const PAGE_BOTTOM_CLEARANCE =
  'calc(32px + env(safe-area-inset-bottom, 0px))';

/**
 * Persistent bottom bar (item count + total + "View cart") shown on the
 * restaurant list and every restaurant menu. The cart spans restaurants.
 */
const CartBar = () => {
  const navigate = useNavigate();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItems = useSelector((state: RootState) => state.cart.totalItems);

  if (totalItems <= 0) {
    return null;
  }

  const total = getCartItemsTotal(cartItems);
  const restaurantCount = groupCartByRestaurant(cartItems).length;

  return (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      onClick={() => navigate('/cart')}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        borderRadius: 0,
        fontSize: '1rem',
        fontWeight: 600,
        padding: '16px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        textTransform: 'none',
      }}
    >
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}
      >
        <AvatarGroup
          max={3}
          sx={{
            '& .MuiAvatar-root': {
              width: 40,
              height: 40,
              fontSize: '0.875rem',
              border: '3px solid rgba(255, 255, 255, 0.8)',
            },
            '& .MuiAvatarGroup-avatar': {
              marginLeft: '-12px',
            },
          }}
        >
          {cartItems.slice(0, 3).map((item) => (
            <Avatar
              key={getCartLineKey(item)}
              alt={item.name}
              src={item.image}
              sx={{ width: 40, height: 40 }}
            />
          ))}
        </AvatarGroup>
        <Box sx={{ textAlign: 'left', minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, color: 'white', lineHeight: 1.2 }}>
            {totalItems} Item{totalItems > 1 ? 's' : ''} · ₹{total.toFixed(0)}
          </Typography>
          {restaurantCount > 1 && (
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.85)', display: 'block' }}
            >
              from {restaurantCount} restaurants
            </Typography>
          )}
        </Box>
      </Box>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}
      >
        View Cart
        <ChevronRightIcon sx={{ fontSize: '1.25rem' }} />
      </Box>
    </Button>
  );
};

export default CartBar;

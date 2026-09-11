import { Box, Chip, Typography } from '@mui/material';
import { CartItem } from '../../types';

interface CartItemPriceDisplayProps {
  item: CartItem;
  showEach?: boolean;
  compact?: boolean;
}

/**
 * Renders cart line-item pricing.
 * Promotional add-ons show original price struck-through + discounted price.
 */
const CartItemPriceDisplay = ({
  item,
  showEach = false,
  compact = false,
}: CartItemPriceDisplayProps) => {
  const lineTotal = item.price * item.quantity;
  const isPromo = item.isPromotionalAddon && item.originalPrice;
  const priceVariant = compact ? 'body2' : 'h6';

  return (
    <Box sx={{ textAlign: 'right' }}>
      {isPromo ? (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
            >
              ₹{(item.originalPrice! * item.quantity).toFixed(0)}
            </Typography>
            <Typography
              variant={priceVariant}
              sx={{ fontWeight: 'bold', color: '#ff6b6b' }}
            >
              ₹{lineTotal.toFixed(0)}
            </Typography>
          </Box>
          {(!compact || showEach) && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 0.5,
                mt: 0.25,
              }}
            >
              {!compact && (
                <Chip
                  label="₹9 Deal"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: '#e8f5e9',
                    color: '#2e7d32',
                  }}
                />
              )}
              {showEach && (
                <Typography variant="caption" color="text.secondary">
                  ₹{item.price} each
                </Typography>
              )}
            </Box>
          )}
        </>
      ) : item.isFreeClaim ? (
        <>
          <Typography
            variant={priceVariant}
            sx={{ fontWeight: 'bold', color: '#4CAF50' }}
          >
            FREE
          </Typography>
          {showEach && (
            <Typography variant="caption" color="text.secondary">
              ₹0 each
            </Typography>
          )}
        </>
      ) : (
        <>
          <Typography
            variant={priceVariant}
            sx={{ fontWeight: 'bold', color: '#ff6b6b' }}
          >
            ₹{lineTotal.toFixed(2)}
          </Typography>
          {showEach && (
            <Typography variant="caption" color="text.secondary">
              ₹{item.price} each
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default CartItemPriceDisplay;
